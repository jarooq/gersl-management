/**
 * AI Employee — HTTP surface.
 *
 * Two audiences: staff reading and managing the alerts that concern them, and
 * admins operating the assistant (run it now, tune thresholds, inspect runs).
 */

import { select, execute, fromJsonColumn } from '../services/aiEmployee/db.js';
import { getConfig, saveConfig } from '../services/aiEmployee/settings.js';
import { getAiEmployee } from '../services/aiEmployee/identity.js';
import { runWatch } from '../services/aiEmployee/engine.js';
import { runBriefing } from '../services/aiEmployee/briefing.js';
import { isJobRunning } from '../services/aiEmployee/scheduler.js';
import { RULES } from '../services/aiEmployee/rules/index.js';

const ALERT_FIELDS = `
  a.id, a.rule_key AS "ruleKey", a.severity, a.category,
  a.entity_type AS "entityType", a.entity_id AS "entityId", a.project_id AS "projectId",
  a.owner_user_id AS "ownerUserId", a.title, a.message,
  a.action_url AS "actionUrl", a.action_label AS "actionLabel",
  a.status, a.escalation_level AS "escalationLevel", a.notify_count AS "notifyCount",
  a.first_detected_at AS "firstDetectedAt", a.last_seen_at AS "lastSeenAt",
  a.last_notified_at AS "lastNotifiedAt", a.snoozed_until AS "snoozedUntil",
  a.resolved_at AS "resolvedAt", a.resolution, a.metadata
`;

const hydrate = (row) => ({ ...row, metadata: fromJsonColumn(row.metadata, {}) });

/**
 * GET /api/ai-employee/status
 * Health card: who the assistant is, whether it is on duty, and what it found last.
 */
export const getStatus = async (req, res) => {
  try {
    const config = await getConfig();
    const employee = await getAiEmployee();

    const [lastWatch] = await select(
      `SELECT id, status, started_at AS "startedAt", finished_at AS "finishedAt",
              duration_ms AS "durationMs", rules_run AS "rulesRun", findings,
              alerts_opened AS "alertsOpened", alerts_resolved AS "alertsResolved",
              alerts_escalated AS "alertsEscalated", notifications_sent AS "notificationsSent",
              errors
         FROM ai_employee_runs
        WHERE job = 'watch'
        ORDER BY started_at DESC
        LIMIT 1`
    );

    const counts = await select(
      `SELECT severity, COUNT(*) AS count
         FROM ai_alerts WHERE status = 'open'
        GROUP BY severity`
    );

    const openBySeverity = counts.reduce((acc, row) => {
      acc[row.severity] = Number(row.count);
      return acc;
    }, {});

    res.json({
      success: true,
      employee: employee
        ? { id: employee.id, name: employee.fullName, role: employee.role, department: employee.department }
        : null,
      enabled: config.enabled,
      dryRun: config.dryRun,
      timezone: config.timezone,
      schedule: config.schedule,
      sweepInProgress: isJobRunning('watch'),
      lastRun: lastWatch ? { ...lastWatch, errors: fromJsonColumn(lastWatch.errors, null) } : null,
      openAlerts: {
        total: Object.values(openBySeverity).reduce((a, b) => a + b, 0),
        bySeverity: openBySeverity
      },
      rules: RULES.map((r) => ({ key: r.key, name: r.name, category: r.category }))
    });
  } catch (error) {
    console.error('Error fetching AI Employee status:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch status', error: error.message });
  }
};

/**
 * GET /api/ai-employee/alerts
 * Filters: status, severity, ruleKey, projectId, mine=true, limit, offset
 */
export const listAlerts = async (req, res) => {
  try {
    const { status = 'open', severity, ruleKey, projectId, mine } = req.query;
    const limit = Math.min(parseInt(req.query.limit ?? '50', 10) || 50, 200);
    const offset = parseInt(req.query.offset ?? '0', 10) || 0;

    const clauses = [];
    const replacements = { limit, offset };

    if (status && status !== 'all') {
      clauses.push('a.status = :status');
      replacements.status = status;
    }
    if (severity) {
      clauses.push('a.severity = :severity');
      replacements.severity = severity;
    }
    if (ruleKey) {
      clauses.push('a.rule_key = :ruleKey');
      replacements.ruleKey = ruleKey;
    }
    if (projectId) {
      clauses.push('a.project_id = :projectId');
      replacements.projectId = parseInt(projectId, 10);
    }
    if (mine === 'true') {
      clauses.push('a.owner_user_id = :userId');
      replacements.userId = req.user.id;
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    // Alias the table so ALERT_FIELDS' bare column names still resolve, and
    // pull the owner's name across — "user #4" is not a useful thing to show.
    const rows = await select(
      `SELECT ${ALERT_FIELDS}, u.full_name AS "ownerName", u.role AS "ownerRole"
         FROM ai_alerts a
    LEFT JOIN users u ON u.id = a.owner_user_id
        ${where}
        ORDER BY
          CASE a.severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
          a.first_detected_at ASC
        LIMIT :limit OFFSET :offset`,
      replacements
    );

    const [countRow] = await select(
      `SELECT COUNT(*) AS count FROM ai_alerts a ${where}`,
      replacements
    );

    res.json({
      success: true,
      alerts: rows.map(hydrate),
      total: Number(countRow?.count ?? 0),
      limit,
      offset
    });
  } catch (error) {
    console.error('Error listing AI alerts:', error);
    res.status(500).json({ success: false, message: 'Failed to list alerts', error: error.message });
  }
};

/**
 * GET /api/ai-employee/alerts/summary
 * Counts grouped by rule and severity, for a dashboard tile.
 */
export const getAlertSummary = async (req, res) => {
  try {
    const byRule = await select(
      `SELECT rule_key AS "ruleKey", severity, COUNT(*) AS count
         FROM ai_alerts WHERE status = 'open'
        GROUP BY rule_key, severity`
    );

    const [mine] = await select(
      `SELECT COUNT(*) AS count FROM ai_alerts WHERE status = 'open' AND owner_user_id = :userId`,
      { userId: req.user.id }
    );

    res.json({
      success: true,
      byRule: byRule.map((r) => ({ ...r, count: Number(r.count) })),
      mine: Number(mine?.count ?? 0)
    });
  } catch (error) {
    console.error('Error summarising AI alerts:', error);
    res.status(500).json({ success: false, message: 'Failed to summarise alerts', error: error.message });
  }
};

const loadAlert = async (id) => {
  const [row] = await select(`SELECT ${ALERT_FIELDS} FROM ai_alerts a WHERE a.id = :id`, { id });
  return row ? hydrate(row) : null;
};

/** Staff may action alerts they own; managers and admins may action any. */
const canAction = (user, alert) =>
  Number(alert.ownerUserId) === Number(user.id) ||
  ['Admin', 'CEO', 'BOD', 'Director Programmes', 'Programme Manager'].includes(user.role);

/**
 * POST /api/ai-employee/alerts/:id/snooze  { days }
 * Quiet an alert without pretending it is fixed — it stays open in the ledger.
 */
export const snoozeAlert = async (req, res) => {
  try {
    const alert = await loadAlert(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    if (!canAction(req.user, alert)) {
      return res.status(403).json({ success: false, message: 'You cannot action this alert' });
    }

    const days = Math.min(Math.max(parseInt(req.body.days ?? '3', 10) || 3, 1), 90);
    const until = new Date(Date.now() + days * 86400000);

    await execute(
      `UPDATE ai_alerts SET snoozed_until = :until, updated_at = :now WHERE id = :id`,
      { id: alert.id, until, now: new Date() }
    );

    res.json({ success: true, message: `Snoozed for ${days} day${days === 1 ? '' : 's'}`, snoozedUntil: until });
  } catch (error) {
    console.error('Error snoozing alert:', error);
    res.status(500).json({ success: false, message: 'Failed to snooze alert', error: error.message });
  }
};

/**
 * POST /api/ai-employee/alerts/:id/resolve  { note }
 * Manual close. If the underlying condition is still true the next sweep
 * reopens it — which is the correct behaviour, not a bug.
 */
export const resolveAlert = async (req, res) => {
  try {
    const alert = await loadAlert(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    if (!canAction(req.user, alert)) {
      return res.status(403).json({ success: false, message: 'You cannot action this alert' });
    }

    await execute(
      `UPDATE ai_alerts
          SET status = 'resolved', resolved_at = :now, resolution = 'manual', updated_at = :now
        WHERE id = :id`,
      { id: alert.id, now: new Date() }
    );

    res.json({ success: true, message: 'Alert resolved' });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ success: false, message: 'Failed to resolve alert', error: error.message });
  }
};

/**
 * POST /api/ai-employee/alerts/:id/mute
 * Permanently stop this specific alert. Unlike resolve, a muted alert is not
 * reopened by later sweeps.
 */
export const muteAlert = async (req, res) => {
  try {
    const alert = await loadAlert(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    if (!canAction(req.user, alert)) {
      return res.status(403).json({ success: false, message: 'You cannot action this alert' });
    }

    await execute(
      `UPDATE ai_alerts
          SET status = 'muted', resolved_at = :now, resolution = 'muted', updated_at = :now
        WHERE id = :id`,
      { id: alert.id, now: new Date() }
    );

    res.json({ success: true, message: 'Alert muted' });
  } catch (error) {
    console.error('Error muting alert:', error);
    res.status(500).json({ success: false, message: 'Failed to mute alert', error: error.message });
  }
};

/**
 * POST /api/ai-employee/run   { ruleKeys?: string[] }
 * Trigger a sweep immediately. Admin only.
 */
export const triggerRun = async (req, res) => {
  try {
    if (isJobRunning('watch')) {
      return res.status(409).json({ success: false, message: 'A sweep is already in progress' });
    }

    const ruleKeys = Array.isArray(req.body?.ruleKeys) && req.body.ruleKeys.length
      ? req.body.ruleKeys
      : null;

    const result = await runWatch({ trigger: 'manual', userId: req.user.id, ruleKeys });
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error running AI Employee sweep:', error);
    res.status(500).json({ success: false, message: 'Sweep failed', error: error.message });
  }
};

/**
 * POST /api/ai-employee/briefing  { me?: boolean }
 * Send briefings now — either to everyone (admin) or just to the caller, which
 * is the safe way to preview what the message looks like.
 */
export const triggerBriefing = async (req, res) => {
  try {
    const onlyMe = req.body?.me === true;
    const isAdmin = ['Admin', 'CEO', 'BOD', 'Director Programmes'].includes(req.user.role);

    if (!onlyMe && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only admins can send briefings to everyone' });
    }

    const result = await runBriefing({
      trigger: 'manual',
      userId: req.user.id,
      targetUserId: onlyMe ? req.user.id : null
    });

    res.json({ success: true, result });
  } catch (error) {
    console.error('Error running briefing:', error);
    res.status(500).json({ success: false, message: 'Briefing failed', error: error.message });
  }
};

/** GET /api/ai-employee/runs — recent execution history. */
export const listRuns = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit ?? '20', 10) || 20, 100);
    const rows = await select(
      `SELECT id, trigger, job, status, started_at AS "startedAt", finished_at AS "finishedAt",
              duration_ms AS "durationMs", rules_run AS "rulesRun", findings,
              alerts_opened AS "alertsOpened", alerts_resolved AS "alertsResolved",
              alerts_escalated AS "alertsEscalated", notifications_sent AS "notificationsSent",
              errors, triggered_by AS "triggeredBy"
         FROM ai_employee_runs
        ORDER BY started_at DESC
        LIMIT :limit`,
      { limit }
    );

    res.json({
      success: true,
      runs: rows.map((r) => ({ ...r, errors: fromJsonColumn(r.errors, null) }))
    });
  } catch (error) {
    console.error('Error listing AI Employee runs:', error);
    res.status(500).json({ success: false, message: 'Failed to list runs', error: error.message });
  }
};

/** GET /api/ai-employee/settings — effective config (defaults + overrides). */
export const getSettings = async (req, res) => {
  try {
    res.json({ success: true, config: await getConfig({ fresh: true }) });
  } catch (error) {
    console.error('Error fetching AI Employee settings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settings', error: error.message });
  }
};

/** PUT /api/ai-employee/settings — save a partial override. Admin only. */
export const updateSettings = async (req, res) => {
  try {
    const patch = req.body?.config;
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
      return res.status(400).json({ success: false, message: 'Body must be { config: { ... } }' });
    }

    const config = await saveConfig(patch, req.user.id);
    res.json({ success: true, message: 'Settings updated', config });
  } catch (error) {
    console.error('Error updating AI Employee settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings', error: error.message });
  }
};
