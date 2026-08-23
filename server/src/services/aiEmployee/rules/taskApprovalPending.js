/**
 * Rule: a task is finished work waiting on sign-off.
 *
 * Distinct from the `approvals` table — tasks carry their own lightweight
 * `requires_approval` / `approval_status` pair, and those stall just as often.
 * The nudge goes to the project manager, who is the de-facto approver.
 */

import { select, hasColumns, daysBetween } from '../db.js';
import { commonReplacements, taskUrl } from './shared.js';

export default {
  key: 'task_approval_pending',
  name: 'Task awaiting sign-off',
  category: 'approval',

  isAvailable: () => hasColumns('tasks', ['id', 'title', 'requires_approval', 'approval_status', 'status']),

  async detect({ config }) {
    const settings = config.rules.taskApprovalPending;
    if (!settings.enabled) return [];

    const now = new Date();
    const cutoff = new Date(now.getTime() - settings.afterDays * 86400000);

    const rows = await select(
      `SELECT t.id, t.title, t.task_code AS "taskCode", t.project_id AS "projectId",
              t.completion_date AS "completionDate", t.updated_at AS "updatedAt",
              p.name AS "projectName", p.manager_id AS "managerId"
         FROM tasks t
    LEFT JOIN projects p ON p.id = t.project_id
        WHERE t.requires_approval = true
          AND (t.approval_status IS NULL OR t.approval_status = 'pending')
          AND (t.status IS NULL OR CAST(t.status AS TEXT) NOT IN (:closedTaskStatuses))
          AND t.updated_at IS NOT NULL
          AND t.updated_at <= :cutoff`,
      { cutoff, ...commonReplacements }
    );

    return rows.map((row) => {
      const daysWaiting = Math.abs(daysBetween(row.updatedAt, now));
      const where = row.projectName ? ` on ${row.projectName}` : '';

      return {
        dedupeKey: `task_approval_pending:${row.id}`,
        severity: daysWaiting >= settings.afterDays * 3 ? 'high' : 'warning',
        entityType: 'task',
        entityId: row.id,
        projectId: row.projectId,
        ownerUserId: row.managerId ? Number(row.managerId) : null,
        title: `Task awaiting your sign-off: ${row.title}`,
        message:
          `"${row.title}"${where} needs approval and has been waiting ${daysWaiting} days. ` +
          `Approve or send it back so the work can be closed out.`,
        actionUrl: taskUrl(row.id),
        actionLabel: 'Review task',
        metadata: { taskCode: row.taskCode, daysWaiting }
      };
    });
  }
};
