/**
 * Rule: a task is approaching its due date.
 *
 * Fires once per horizon crossed (7 / 3 / 1 days out) rather than every hour,
 * because the dedupe key carries the horizon. One alert per assignee — people
 * escalate up their own reporting line.
 */

import { select, hasColumns, startOfToday, addDays, toDateOnly, daysBetween } from '../db.js';
import { taskOwnersSql, commonReplacements, taskUrl, describeDays } from './shared.js';

export default {
  key: 'task_due_soon',
  name: 'Task due soon',
  category: 'deadline',

  isAvailable: () => hasColumns('tasks', ['id', 'title', 'due_date', 'status', 'assigned_to', 'project_id']),

  async detect({ config }) {
    const settings = config.rules.taskDueSoon;
    if (!settings.enabled) return [];

    const horizons = [...settings.horizons].sort((a, b) => b - a);
    const today = startOfToday();
    const furthest = toDateOnly(addDays(today, horizons[0]));
    const owners = await taskOwnersSql();

    const rows = await select(
      `SELECT t.id, t.title, t.task_code AS "taskCode", t.due_date AS "dueDate",
              t.priority, t.project_id AS "projectId",
              p.name AS "projectName",
              o.user_id AS "ownerId"
         FROM tasks t
         JOIN (${owners}) o ON o.task_id = t.id
    LEFT JOIN projects p ON p.id = t.project_id
        WHERE t.due_date IS NOT NULL
          AND t.due_date >= :todayDate
          AND t.due_date <= :furthest
          AND (t.status IS NULL OR t.status NOT IN (:closedTaskStatuses))`,
      { todayDate: toDateOnly(today), furthest, ...commonReplacements }
    );

    const findings = [];

    for (const row of rows) {
      const daysLeft = daysBetween(today, row.dueDate);

      // Attribute the task to the tightest horizon it has crossed, so a task
      // 2 days out reports against the "3 day" rung and won't re-alert at 1 day
      // under the same key.
      const horizon = horizons.find((h) => daysLeft <= h);
      if (horizon === undefined) continue;

      const severity = daysLeft <= 1 ? 'high' : daysLeft <= 3 ? 'warning' : 'info';
      const where = row.projectName ? ` on ${row.projectName}` : '';

      findings.push({
        dedupeKey: `task_due_soon:${row.id}:${row.ownerId}:${horizon}`,
        severity,
        entityType: 'task',
        entityId: row.id,
        projectId: row.projectId,
        ownerUserId: row.ownerId,
        title: `Task due ${describeDays(daysLeft)}: ${row.title}`,
        message:
          `"${row.title}"${where} is due ${describeDays(daysLeft)} (${row.dueDate}). ` +
          `Please update the status or move the date if it has changed.`,
        actionUrl: taskUrl(row.id),
        actionLabel: 'Open task',
        metadata: {
          taskCode: row.taskCode,
          dueDate: row.dueDate,
          daysLeft,
          horizon,
          priority: row.priority
        }
      });
    }

    return findings;
  }
};
