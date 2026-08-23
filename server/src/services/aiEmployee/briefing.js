/**
 * AI Employee — the morning briefing.
 *
 * Individual alerts chase problems; the briefing gives each person one place to
 * see their day. Sent once each working morning, it summarises what is due, what
 * is late, and what has been escalated to them — as a single notification rather
 * than a stream.
 */

import { select, execute, startOfToday, toDateOnly, addDays } from './db.js';
import { getConfig } from './settings.js';
import { getAiEmployeeId } from './identity.js';
import { sendNotification, AI_BRIEFING_TYPE } from './dispatcher.js';
import { taskOwnersSql, commonReplacements } from './rules/shared.js';

const SEVERITY_LABEL = {
  critical: '🔴',
  high: '🟠',
  warning: '🟡',
  info: '🔵'
};

/** Tasks due today or already overdue, per user. */
const getTaskLoad = async () => {
  const today = toDateOnly(startOfToday());
  const owners = await taskOwnersSql();

  const rows = await select(
    `SELECT o.user_id AS "userId", t.id, t.title, t.due_date AS "dueDate"
       FROM tasks t
       JOIN (${owners}) o ON o.task_id = t.id
      WHERE t.due_date IS NOT NULL
        AND t.due_date <= :today
        AND (t.status IS NULL OR t.status NOT IN (:closedTaskStatuses))`,
    { today, ...commonReplacements }
  );

  const byUser = new Map();
  for (const row of rows) {
    const userId = Number(row.userId);
    if (!byUser.has(userId)) byUser.set(userId, { dueToday: [], overdue: [] });
    const bucket = byUser.get(userId);
    (String(row.dueDate) === today ? bucket.dueToday : bucket.overdue).push(row);
  }
  return byUser;
};

/** Open alerts owned by each user. */
const getAlertLoad = async () => {
  const rows = await select(
    `SELECT owner_user_id AS "userId", id, title, severity, escalation_level AS "level"
       FROM ai_alerts
      WHERE status = 'open' AND owner_user_id IS NOT NULL
      ORDER BY
        CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END`
  );

  const byUser = new Map();
  for (const row of rows) {
    const userId = Number(row.userId);
    if (!byUser.has(userId)) byUser.set(userId, []);
    byUser.get(userId).push(row);
  }
  return byUser;
};

/** Projects each user manages that need attention in the next fortnight. */
const getManagedProjects = async () => {
  const soon = toDateOnly(addDays(startOfToday(), 14));

  const rows = await select(
    `SELECT p.manager_id AS "userId", p.id, p.name AS "projectName",
            p.end_date AS "endDate", p.budget, p.spent
       FROM projects p
      WHERE p.manager_id IS NOT NULL
        AND p.end_date IS NOT NULL
        AND p.end_date <= :soon
        AND (p.status IS NULL OR p.status NOT IN (:closedProjectStatuses))`,
    { soon, ...commonReplacements }
  );

  const byUser = new Map();
  for (const row of rows) {
    const userId = Number(row.userId);
    if (!byUser.has(userId)) byUser.set(userId, []);
    byUser.get(userId).push(row);
  }
  return byUser;
};

const buildMessage = ({ name, tasks, alerts, projects, maxItems }) => {
  const lines = [`Good morning ${name.split(' ')[0]} — here is your day.`, ''];

  const overdue = tasks?.overdue ?? [];
  const dueToday = tasks?.dueToday ?? [];

  if (overdue.length > 0) {
    lines.push(`⏰ Overdue (${overdue.length}):`);
    for (const t of overdue.slice(0, maxItems)) lines.push(`   • ${t.title} — was due ${t.dueDate}`);
    if (overdue.length > maxItems) lines.push(`   • …and ${overdue.length - maxItems} more`);
    lines.push('');
  }

  if (dueToday.length > 0) {
    lines.push(`📌 Due today (${dueToday.length}):`);
    for (const t of dueToday.slice(0, maxItems)) lines.push(`   • ${t.title}`);
    lines.push('');
  }

  const escalated = (alerts ?? []).filter((a) => Number(a.level) > 0);
  if (escalated.length > 0) {
    lines.push(`⚠️ Escalated to your manager (${escalated.length}):`);
    for (const a of escalated.slice(0, maxItems)) {
      lines.push(`   ${SEVERITY_LABEL[a.severity] ?? '•'} ${a.title}`);
    }
    lines.push('');
  }

  // Everything else still open. Without this a quiet week reads as
  // "you have 3 open items" with no way to tell what they are.
  const tracking = (alerts ?? []).filter((a) => Number(a.level) === 0);
  if (tracking.length > 0) {
    // "Also" only reads right when something came before it.
    const heading = lines.length > 2 ? 'Also on my list' : 'On my list';
    lines.push(`📋 ${heading} (${tracking.length}):`);
    for (const a of tracking.slice(0, maxItems)) {
      lines.push(`   ${SEVERITY_LABEL[a.severity] ?? '•'} ${a.title}`);
    }
    if (tracking.length > maxItems) lines.push(`   • …and ${tracking.length - maxItems} more`);
    lines.push('');
  }

  if ((projects ?? []).length > 0) {
    lines.push(`📁 Projects you manage closing soon (${projects.length}):`);
    for (const p of projects.slice(0, maxItems)) {
      const budget = Number(p.budget ?? 0);
      const spent = Number(p.spent ?? 0);
      const burn = budget > 0 ? ` — ${Math.round((spent / budget) * 100)}% of budget spent` : '';
      lines.push(`   • ${p.projectName} ends ${p.endDate}${burn}`);
    }
    lines.push('');
  }

  if ((alerts ?? []).length === 0 && overdue.length === 0 && dueToday.length === 0) {
    lines.push('Nothing outstanding on my list for you. Have a good day.');
  }

  return lines.join('\n').trim();
};

/**
 * Send each active user their briefing. Users with nothing outstanding are
 * skipped by default — a daily "you have nothing" message is how an assistant
 * teaches people to ignore it.
 */
export const runBriefing = async ({ trigger = 'cron', userId = null, targetUserId = null } = {}) => {
  const config = await getConfig({ fresh: true });

  if (!config.enabled || !config.briefing.enabled) {
    return { skipped: true, reason: 'Briefing is disabled' };
  }

  const startedAt = new Date();
  await execute(
    `INSERT INTO ai_employee_runs (trigger, job, status, started_at, triggered_by, created_at)
     VALUES (:trigger, 'briefing', 'running', :startedAt, :userId, :startedAt)`,
    { trigger, startedAt, userId: userId ?? null }
  );
  const [runRow] = await select(`SELECT id FROM ai_employee_runs ORDER BY id DESC LIMIT 1`);

  const aiEmployeeId = await getAiEmployeeId();

  const users = await select(
    targetUserId
      ? `SELECT id, full_name AS "fullName" FROM users WHERE id = :targetUserId AND status = 'Active'`
      : `SELECT id, full_name AS "fullName" FROM users WHERE status = 'Active'`,
    { targetUserId }
  );

  const [taskLoad, alertLoad, projectLoad] = await Promise.all([
    getTaskLoad(),
    getAlertLoad(),
    getManagedProjects()
  ]);

  let sent = 0;
  let skipped = 0;

  for (const user of users) {
    const id = Number(user.id);
    if (aiEmployeeId && id === Number(aiEmployeeId)) continue;

    const tasks = taskLoad.get(id);
    const alerts = alertLoad.get(id) ?? [];
    const projects = projectLoad.get(id) ?? [];

    const hasContent =
      (tasks?.overdue?.length ?? 0) > 0 ||
      (tasks?.dueToday?.length ?? 0) > 0 ||
      alerts.length > 0 ||
      projects.length > 0;

    if (!hasContent && config.briefing.skipIfEmpty) {
      skipped += 1;
      continue;
    }

    const result = await sendNotification({
      config,
      userId: id,
      severity: 'info',
      type: AI_BRIEFING_TYPE,
      title: `Your daily briefing — ${toDateOnly(startOfToday())}`,
      message: buildMessage({
        name: user.fullName || 'there',
        tasks,
        alerts,
        projects,
        maxItems: config.briefing.maxItems
      }),
      category: 'briefing',
      actionUrl: '/admin/operations/tasks',
      actionLabel: 'Open my tasks',
      // The briefing is the one message that should always get through — it
      // replaces, rather than adds to, the day's noise.
      bypassRateLimit: true
    });

    if (result === 'sent') sent += 1;
  }

  const finishedAt = new Date();
  if (runRow?.id) {
    await execute(
      `UPDATE ai_employee_runs
          SET status = 'completed', finished_at = :finishedAt, duration_ms = :durationMs,
              notifications_sent = :sent
        WHERE id = :id`,
      {
        id: runRow.id,
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        sent
      }
    );
  }

  console.log(`[AI Employee] Briefing sent to ${sent} users (${skipped} had nothing outstanding)`);
  return { runId: runRow?.id ?? null, sent, skipped, users: users.length };
};
