/**
 * Rule: an approval has been sitting unactioned.
 *
 * Approvals are the most common silent blocker in this system — a procurement
 * or budget request stalls at one level and nobody downstream knows why. The
 * current rung of `approval_chain` names either a specific approver or a role;
 * both are resolved here so the nudge reaches a real person.
 */

import { select, hasColumns, fromJsonColumn, daysBetween } from '../db.js';
import { approvalUrl } from './shared.js';

export default {
  key: 'approval_pending',
  name: 'Approval waiting too long',
  category: 'approval',

  isAvailable: () =>
    hasColumns('approvals', ['id', 'type', 'status', 'approval_chain', 'current_level', 'initiated_at']),

  async detect({ config }) {
    const settings = config.rules.approvalPending;
    if (!settings.enabled) return [];

    const now = new Date();
    const cutoff = new Date(now.getTime() - settings.afterDays * 86400000);

    const rows = await select(
      `SELECT a.id, a.type, a.entity_type AS "entityType", a.entity_id AS "entityId",
              a.amount, a.current_level AS "currentLevel", a.approval_chain AS "approvalChain",
              a.initiated_by AS "initiatedBy", a.initiated_at AS "initiatedAt", a.metadata
         FROM approvals a
        WHERE a.status = 'pending'
          AND a.initiated_at IS NOT NULL
          AND a.initiated_at <= :cutoff`,
      { cutoff }
    );

    if (rows.length === 0) return [];

    // Resolve any roles named in the pending rungs to actual active users.
    const chains = rows.map((row) => ({
      row,
      rung: (fromJsonColumn(row.approvalChain, []) || [])[Number(row.currentLevel ?? 0)] || null
    }));

    const roles = [...new Set(chains.map((c) => c.rung?.role).filter(Boolean))];
    const usersByRole = new Map();

    if (roles.length > 0) {
      const userRows = await select(
        `SELECT id, role FROM users WHERE role IN (:roles) AND status = 'Active'`,
        { roles }
      );
      for (const u of userRows) {
        if (!usersByRole.has(u.role)) usersByRole.set(u.role, []);
        usersByRole.get(u.role).push(Number(u.id));
      }
    }

    const findings = [];

    for (const { row, rung } of chains) {
      const daysWaiting = Math.abs(daysBetween(row.initiatedAt, now));
      const amount = row.amount != null ? Number(row.amount) : null;
      const meta = fromJsonColumn(row.metadata, {}) || {};

      const isHighValue = amount != null && amount >= settings.highValueAmount;
      const severity = isHighValue || daysWaiting >= settings.afterDays * 3 ? 'high' : 'warning';

      const approverIds = rung?.approverId
        ? [Number(rung.approverId)]
        : usersByRole.get(rung?.role) ?? [];

      const subject = meta.projectName || meta.proposalTitle || `${row.entityType} #${row.entityId}`;
      const amountText = amount != null ? ` for ${amount.toLocaleString()}` : '';

      if (approverIds.length === 0) {
        // Nobody resolvable — still raise it so leadership can unstick it.
        findings.push({
          dedupeKey: `approval_pending_unassigned:${row.id}`,
          severity: 'high',
          entityType: 'approval',
          entityId: row.id,
          projectId: null,
          ownerUserId: null,
          title: `Approval stuck with no approver: ${row.type}`,
          message:
            `A ${row.type} approval${amountText} for ${subject} has been pending ${daysWaiting} days, ` +
            `and no active user matches the approver level "${rung?.role ?? 'unknown'}". ` +
            `The approval chain needs fixing before this can move.`,
          actionUrl: approvalUrl(),
          actionLabel: 'Open approvals',
          metadata: { approvalType: row.type, daysWaiting, amount, level: row.currentLevel, role: rung?.role }
        });
        continue;
      }

      for (const approverId of approverIds) {
        findings.push({
          dedupeKey: `approval_pending:${row.id}:${approverId}`,
          severity,
          entityType: 'approval',
          entityId: row.id,
          projectId: null,
          ownerUserId: approverId,
          title: `Waiting on your approval: ${row.type}`,
          message:
            `A ${row.type} approval${amountText} for ${subject} has been waiting for your decision for ` +
            `${daysWaiting} days. Everything behind it is blocked until you approve or reject it.`,
          actionUrl: approvalUrl(),
          actionLabel: 'Review approval',
          metadata: { approvalType: row.type, daysWaiting, amount, level: row.currentLevel, highValue: isHighValue }
        });
      }
    }

    return findings;
  }
};
