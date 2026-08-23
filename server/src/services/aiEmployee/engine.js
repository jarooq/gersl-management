/**
 * AI Employee — the Watcher engine.
 *
 * One sweep does five things, in order:
 *   1. run every available rule and collect findings
 *   2. upsert findings into the alert ledger (dedupe_key is the identity)
 *   3. auto-resolve alerts that were open but are no longer detected
 *   4. escalate alerts that have been open long enough to widen the audience
 *   5. notify — respecting quiet hours, re-notify intervals and rate limits
 *
 * Every rule is isolated: one failing rule is recorded on the run and the sweep
 * continues. That matters here because the schema has drifted over time and a
 * rule may be querying a column that no longer exists on some deployment.
 */

import { select, execute, toJsonColumn, fromJsonColumn, daysBetween } from './db.js';
import { getConfig } from './settings.js';
import { getAiEmployeeId } from './identity.js';
import { RULES } from './rules/index.js';
import { levelForAge, resolveRecipients, getFallbackRecipients } from './escalation.js';
import { sendNotification, AI_NOTIFICATION_TYPE } from './dispatcher.js';

// ── Run bookkeeping ──────────────────────────────────────────────────────

const startRun = async ({ trigger, job, userId }) => {
  const startedAt = new Date();
  await execute(
    `INSERT INTO ai_employee_runs (trigger, job, status, started_at, triggered_by, created_at)
     VALUES (:trigger, :job, 'running', :startedAt, :userId, :startedAt)`,
    { trigger, job, startedAt, userId: userId ?? null }
  );
  const [row] = await select(`SELECT id FROM ai_employee_runs ORDER BY id DESC LIMIT 1`);
  return { id: row?.id ?? null, startedAt };
};

const finishRun = async (run, stats, status = 'completed') => {
  if (!run.id) return;
  const finishedAt = new Date();
  await execute(
    `UPDATE ai_employee_runs
        SET status = :status, finished_at = :finishedAt,
            duration_ms = :durationMs, rules_run = :rulesRun, findings = :findings,
            alerts_opened = :opened, alerts_resolved = :resolved,
            alerts_escalated = :escalated, notifications_sent = :sent,
            errors = :errors
      WHERE id = :id`,
    {
      id: run.id,
      status,
      finishedAt,
      durationMs: finishedAt.getTime() - run.startedAt.getTime(),
      rulesRun: stats.rulesRun,
      findings: stats.findings,
      opened: stats.opened,
      resolved: stats.resolved,
      escalated: stats.escalated,
      sent: stats.sent,
      errors: toJsonColumn(stats.errors.length ? stats.errors : null)
    }
  );
};

// ── Alert ledger ─────────────────────────────────────────────────────────

/**
 * Insert a finding, or refresh the existing alert with the same dedupe_key.
 * Returns 'opened' for a new alert, 'seen' for one that already existed.
 *
 * A resolved alert whose condition reappears is deliberately reopened at
 * level 0 — the problem came back, so the chase starts again.
 */
const upsertAlert = async (finding, rule, seenAt) => {
  const before = await select(
    `SELECT id, status FROM ai_alerts WHERE dedupe_key = :dedupeKey`,
    { dedupeKey: finding.dedupeKey }
  );

  const params = {
    ruleKey: rule.key,
    severity: finding.severity ?? 'warning',
    category: rule.category ?? 'deadline',
    entityType: finding.entityType ?? null,
    entityId: finding.entityId ?? null,
    projectId: finding.projectId ?? null,
    ownerUserId: finding.ownerUserId ?? null,
    dedupeKey: finding.dedupeKey,
    title: String(finding.title).slice(0, 255),
    message: finding.message ?? null,
    actionUrl: finding.actionUrl ? finding.actionUrl.slice(0, 500) : null,
    actionLabel: finding.actionLabel ? finding.actionLabel.slice(0, 100) : null,
    metadata: toJsonColumn(finding.metadata ?? {}),
    seenAt
  };

  if (before.length === 0) {
    await execute(
      `INSERT INTO ai_alerts (
         rule_key, severity, category, entity_type, entity_id, project_id, owner_user_id,
         dedupe_key, title, message, action_url, action_label,
         status, escalation_level, notify_count,
         first_detected_at, last_seen_at, metadata, created_at, updated_at
       ) VALUES (
         :ruleKey, :severity, :category, :entityType, :entityId, :projectId, :ownerUserId,
         :dedupeKey, :title, :message, :actionUrl, :actionLabel,
         'open', 0, 0,
         :seenAt, :seenAt, :metadata, :seenAt, :seenAt
       )`,
      params
    );
    return 'opened';
  }

  const wasResolved = before[0].status === 'resolved';

  await execute(
    `UPDATE ai_alerts
        SET severity = :severity, title = :title, message = :message,
            action_url = :actionUrl, action_label = :actionLabel,
            owner_user_id = :ownerUserId, project_id = :projectId,
            metadata = :metadata, last_seen_at = :seenAt, updated_at = :seenAt,
            status = CASE WHEN status = 'resolved' THEN 'open' ELSE status END,
            escalation_level = CASE WHEN status = 'resolved' THEN 0 ELSE escalation_level END,
            first_detected_at = CASE WHEN status = 'resolved' THEN :seenAt ELSE first_detected_at END,
            resolved_at = CASE WHEN status = 'resolved' THEN NULL ELSE resolved_at END,
            resolution = CASE WHEN status = 'resolved' THEN NULL ELSE resolution END
      WHERE dedupe_key = :dedupeKey`,
    params
  );

  return wasResolved ? 'opened' : 'seen';
};

/**
 * Close alerts that a successfully-run rule no longer reports. Anything still
 * present had its last_seen_at bumped to this run, so "not seen this run" is
 * simply last_seen_at older than the run start.
 */
const autoResolveStale = async (ruleKeys, runStartedAt) => {
  if (ruleKeys.length === 0) return 0;

  const stale = await select(
    `SELECT id FROM ai_alerts
      WHERE status IN ('open', 'snoozed')
        AND rule_key IN (:ruleKeys)
        AND last_seen_at < :runStartedAt`,
    { ruleKeys, runStartedAt }
  );

  if (stale.length === 0) return 0;

  await execute(
    `UPDATE ai_alerts
        SET status = 'resolved', resolved_at = :now, resolution = 'auto', updated_at = :now
      WHERE id IN (:ids)`,
    { ids: stale.map((r) => r.id), now: new Date() }
  );

  return stale.length;
};

// ── Notification pass ────────────────────────────────────────────────────

const hoursSince = (date) => (Date.now() - new Date(date).getTime()) / 3600000;

/** Whether this alert is due to say something, and why. */
const notificationDecision = (config, alert, targetLevel) => {
  if (alert.snoozedUntil && new Date(alert.snoozedUntil) > new Date()) return null;

  if (targetLevel > Number(alert.escalationLevel)) return 'escalated';
  if (!alert.lastNotifiedAt) return 'first';

  const interval = config.limits.reNotifyAfterHours[alert.severity] ?? 72;
  return hoursSince(alert.lastNotifiedAt) >= interval ? 'reminder' : null;
};

const notifyAlert = async ({ config, alert, rung, reason, aiEmployeeId }) => {
  let recipients = await resolveRecipients({
    config,
    audience: rung.audience,
    ownerUserId: alert.ownerUserId,
    projectId: alert.projectId,
    aiEmployeeId
  });

  // An alert nobody owns still needs a home, or it is detected and never seen.
  if (recipients.length === 0) {
    recipients = await getFallbackRecipients(config, aiEmployeeId);
  }
  if (recipients.length === 0) return { sent: 0, notified: [] };

  const prefix = reason === 'escalated'
    ? '[Escalated] '
    : reason === 'reminder'
      ? '[Reminder] '
      : '';

  let sent = 0;
  const notified = [];

  for (const userId of recipients) {
    const isOwner = Number(userId) === Number(alert.ownerUserId);
    const body = isOwner
      ? alert.message
      : `${alert.message}\n\n(You are seeing this because it has been open for ` +
        `${daysBetween(alert.firstDetectedAt, new Date())} days and has been escalated to you.)`;

    const result = await sendNotification({
      config,
      userId,
      severity: alert.severity,
      type: AI_NOTIFICATION_TYPE,
      title: `${prefix}${alert.title}`,
      message: body,
      category: alert.category,
      entityType: alert.entityType,
      entityId: alert.entityId,
      actionUrl: alert.actionUrl,
      actionLabel: alert.actionLabel
    });

    if (result === 'sent') {
      sent += 1;
      notified.push(userId);
    }
  }

  return { sent, notified };
};

// ── Main sweep ───────────────────────────────────────────────────────────

/**
 * Run one full sweep. The cron scheduler serialises calls; running two at once
 * only duplicates work, it does not corrupt the ledger.
 */
export const runWatch = async ({ trigger = 'cron', userId = null, ruleKeys = null } = {}) => {
  const config = await getConfig({ fresh: true });

  if (!config.enabled) {
    return { skipped: true, reason: 'AI Employee is disabled' };
  }

  const run = await startRun({ trigger, job: 'watch', userId });
  const aiEmployeeId = await getAiEmployeeId();

  const stats = {
    rulesRun: 0,
    findings: 0,
    opened: 0,
    resolved: 0,
    escalated: 0,
    sent: 0,
    skippedRules: [],
    errors: []
  };

  const selectedRules = ruleKeys ? RULES.filter((r) => ruleKeys.includes(r.key)) : RULES;
  const succeededRuleKeys = [];

  // ── 1 & 2: detect and record ──
  for (const rule of selectedRules) {
    try {
      const available = await rule.isAvailable();
      if (!available) {
        stats.skippedRules.push({ rule: rule.key, reason: 'required columns missing' });
        continue;
      }

      let findings = await rule.detect({ config });

      if (findings.length > config.limits.maxFindingsPerRule) {
        stats.errors.push({
          rule: rule.key,
          message: `Capped at ${config.limits.maxFindingsPerRule} of ${findings.length} findings`
        });
        findings = findings.slice(0, config.limits.maxFindingsPerRule);
      }

      for (const finding of findings) {
        const outcome = await upsertAlert(finding, rule, run.startedAt);
        if (outcome === 'opened') stats.opened += 1;
      }

      stats.findings += findings.length;
      stats.rulesRun += 1;
      succeededRuleKeys.push(rule.key);
    } catch (err) {
      console.error(`[AI Employee] Rule "${rule.key}" failed:`, err.message);
      stats.errors.push({ rule: rule.key, message: err.message });
    }
  }

  // ── 3: auto-resolve what disappeared ──
  // Only for rules that ran cleanly — a rule that threw proves nothing about
  // whether its alerts are still valid.
  try {
    stats.resolved = await autoResolveStale(succeededRuleKeys, run.startedAt);
  } catch (err) {
    stats.errors.push({ rule: '_autoResolve', message: err.message });
  }

  // ── 4 & 5: escalate and notify ──
  try {
    const openAlerts = await select(
      `SELECT id, rule_key AS "ruleKey", severity, category, entity_type AS "entityType",
              entity_id AS "entityId", project_id AS "projectId", owner_user_id AS "ownerUserId",
              title, message, action_url AS "actionUrl", action_label AS "actionLabel",
              escalation_level AS "escalationLevel", notify_count AS "notifyCount",
              first_detected_at AS "firstDetectedAt", last_notified_at AS "lastNotifiedAt",
              snoozed_until AS "snoozedUntil", notified_user_ids AS "notifiedUserIds"
         FROM ai_alerts
        WHERE status = 'open'
        ORDER BY
          CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
          first_detected_at ASC`
    );

    for (const alert of openAlerts) {
      if (stats.sent >= config.limits.maxNotificationsPerRun) {
        stats.errors.push({
          rule: '_dispatch',
          message: `Hit per-run notification cap (${config.limits.maxNotificationsPerRun}); remaining alerts wait for the next sweep`
        });
        break;
      }

      const daysOpen = daysBetween(alert.firstDetectedAt, new Date());
      const rung = levelForAge(config, daysOpen);
      const reason = notificationDecision(config, alert, rung.level);
      if (!reason) continue;

      const { sent, notified } = await notifyAlert({ config, alert, rung, reason, aiEmployeeId });
      if (sent === 0) continue;

      stats.sent += sent;
      if (reason === 'escalated') stats.escalated += 1;

      const previouslyNotified = fromJsonColumn(alert.notifiedUserIds, []) || [];
      const allNotified = [...new Set([...previouslyNotified, ...notified])];

      await execute(
        `UPDATE ai_alerts
            SET escalation_level = :level, notify_count = notify_count + 1,
                last_notified_at = :now, notified_user_ids = :notified, updated_at = :now
          WHERE id = :id`,
        { id: alert.id, level: rung.level, now: new Date(), notified: toJsonColumn(allNotified) }
      );
    }
  } catch (err) {
    console.error('[AI Employee] Dispatch pass failed:', err.message);
    stats.errors.push({ rule: '_dispatch', message: err.message });
  }

  await finishRun(run, stats, stats.errors.length ? 'completed_with_errors' : 'completed');

  console.log(
    `[AI Employee] Sweep done — ${stats.rulesRun} rules, ${stats.findings} findings, ` +
    `${stats.opened} new, ${stats.resolved} resolved, ${stats.escalated} escalated, ${stats.sent} sent`
  );

  return { runId: run.id, ...stats };
};

// ── Housekeeping ─────────────────────────────────────────────────────────

export const purgeOldRecords = async () => {
  const config = await getConfig();
  const alertCutoff = new Date(Date.now() - config.retention.resolvedAlertDays * 86400000);
  const runCutoff = new Date(Date.now() - config.retention.runHistoryDays * 86400000);

  await execute(
    `DELETE FROM ai_alerts WHERE status = 'resolved' AND resolved_at IS NOT NULL AND resolved_at < :cutoff`,
    { cutoff: alertCutoff }
  );
  await execute(`DELETE FROM ai_employee_runs WHERE started_at < :cutoff`, { cutoff: runCutoff });
};
