/**
 * Rule: a task has passed its due date and is still open.
 *
 * A single long-lived alert per (task, assignee) — severity climbs with how
 * late it is, and the engine's escalation ladder widens the audience the longer
 * it stays open. This is the rule that does most of the chasing.
 */

import { select, hasColumns, startOfToday, toDateOnly, daysBetween } from '../db.js';
import { taskOwnersSql, commonReplacements, taskUrl } from './shared.js';

const severityFor = (settings, daysOverdue) => {
  let severity = 'warning';
  for (const band of settings.severityByDaysOverdue) {
    if (daysOverdue >= band.minDays) severity = band.severity;
  }
  return severity;
};

export default {
  key: 'task_overdue',
  name: 'Overdue task',
  category: 'deadline',

  isAvailable: () => hasColumns('tasks', ['id', 'title', 'due_date', 'status', 'assigned_to', 'project_id']),

  async detect({ config }) {
    const settings = config.rules.taskOverdue;
    if (!settings.enabled) return [];

    const today = startOfToday();
    const owners = await taskOwnersSql();

    const rows = await select(
      `SELECT t.id, t.title, t.task_code AS "taskCode", t.due_date AS "dueDate",
              t.status, t.priority, t.progress, t.project_id AS "projectId",
              p.name AS "projectName",
              o.user_id AS "ownerId"
         FROM tasks t
         JOIN (${owners}) o ON o.task_id = t.id
    LEFT JOIN projects p ON p.id = t.project_id
        WHERE t.due_date IS NOT NULL
          AND t.due_date < :todayDate
          AND (t.status IS NULL OR t.status NOT IN (:closedTaskStatuses))`,
      { todayDate: toDateOnly(today), ...commonReplacements }
    );

    return rows.map((row) => {
      const daysOverdue = Math.abs(daysBetween(today, row.dueDate));
      const where = row.projectName ? ` on ${row.projectName}` : '';
      const progress = row.progress ? ` It is showing ${row.progress}% complete.` : '';

      return {
        dedupeKey: `task_overdue:${row.id}:${row.ownerId}`,
        severity: severityFor(settings, daysOverdue),
        entityType: 'task',
        entityId: row.id,
        projectId: row.projectId,
        ownerUserId: row.ownerId,
        title: `Overdue by ${daysOverdue} day${daysOverdue === 1 ? '' : 's'}: ${row.title}`,
        message:
          `"${row.title}"${where} was due on ${row.dueDate} and is still marked "${row.status || 'Pending'}".` +
          `${progress} Please complete it, or revise the due date with a reason.`,
        actionUrl: taskUrl(row.id),
        actionLabel: 'Open task',
        metadata: {
          taskCode: row.taskCode,
          dueDate: row.dueDate,
          daysOverdue,
          status: row.status,
          priority: row.priority,
          progress: row.progress
        }
      };
    });
  }
};
