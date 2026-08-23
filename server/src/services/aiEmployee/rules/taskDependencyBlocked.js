/**
 * Rule: a task is blocked because something it depends on has slipped.
 *
 * This is the rule that catches trouble *before* the blocked task itself goes
 * overdue. It raises two alerts: a high-severity one for whoever owns the late
 * blocker (they are the one who can unblock it), and an informational one for
 * the person waiting, so they aren't silently stuck.
 *
 * `tasks.depends_on` is a Postgres integer array, so this rule disables itself
 * on SQLite dev databases.
 */

import { select, hasColumns, isPostgres, startOfToday, toDateOnly, daysBetween } from '../db.js';
import { taskOwnersSql, commonReplacements, taskUrl } from './shared.js';

export default {
  key: 'task_dependency_blocked',
  name: 'Blocked by a late dependency',
  category: 'workflow',

  async isAvailable() {
    if (!isPostgres) return false;
    return hasColumns('tasks', ['id', 'title', 'depends_on', 'status', 'due_date', 'project_id']);
  },

  async detect({ config }) {
    if (!config.rules.taskDependencyBlocked.enabled) return [];

    const today = startOfToday();
    const owners = await taskOwnersSql();

    const rows = await select(
      `SELECT t.id            AS "blockedId",
              t.title         AS "blockedTitle",
              t.project_id    AS "projectId",
              d.id            AS "blockerId",
              d.title         AS "blockerTitle",
              d.due_date      AS "blockerDueDate",
              d.status        AS "blockerStatus",
              p.name          AS "projectName"
         FROM tasks t
         JOIN tasks d ON d.id = ANY(t.depends_on)
    LEFT JOIN projects p ON p.id = t.project_id
        WHERE t.depends_on IS NOT NULL
          AND array_length(t.depends_on, 1) > 0
          AND (t.status IS NULL OR t.status NOT IN (:closedTaskStatuses))
          AND (d.status IS NULL OR d.status NOT IN (:closedTaskStatuses))
          AND d.due_date IS NOT NULL
          AND d.due_date < :todayDate`,
      { todayDate: toDateOnly(today), ...commonReplacements }
    );

    if (rows.length === 0) return [];

    // Fetch owners for both sides in one go.
    const taskIds = [...new Set(rows.flatMap((r) => [r.blockedId, r.blockerId]))];
    const ownerRows = await select(
      `SELECT o.task_id AS "taskId", o.user_id AS "userId"
         FROM (${owners}) o
        WHERE o.task_id IN (:taskIds)`,
      { taskIds }
    );

    const ownersByTask = new Map();
    for (const { taskId, userId } of ownerRows) {
      if (!ownersByTask.has(taskId)) ownersByTask.set(taskId, []);
      ownersByTask.get(taskId).push(Number(userId));
    }

    const findings = [];

    for (const row of rows) {
      const daysLate = Math.abs(daysBetween(today, row.blockerDueDate));
      const where = row.projectName ? ` (${row.projectName})` : '';

      // The person who can actually unblock this.
      for (const blockerOwner of ownersByTask.get(row.blockerId) ?? []) {
        findings.push({
          dedupeKey: `task_blocking:${row.blockerId}:${row.blockedId}:${blockerOwner}`,
          severity: 'high',
          entityType: 'task',
          entityId: row.blockerId,
          projectId: row.projectId,
          ownerUserId: blockerOwner,
          title: `Your late task is blocking others: ${row.blockerTitle}`,
          message:
            `"${row.blockerTitle}"${where} is ${daysLate} day${daysLate === 1 ? '' : 's'} overdue and ` +
            `"${row.blockedTitle}" cannot start until it is done. This one is holding up the schedule.`,
          actionUrl: taskUrl(row.blockerId),
          actionLabel: 'Open blocking task',
          metadata: {
            blockedTaskId: row.blockedId,
            blockedTaskTitle: row.blockedTitle,
            daysLate
          }
        });
      }

      // The person waiting on it.
      for (const blockedOwner of ownersByTask.get(row.blockedId) ?? []) {
        findings.push({
          dedupeKey: `task_blocked:${row.blockedId}:${row.blockerId}:${blockedOwner}`,
          severity: 'info',
          entityType: 'task',
          entityId: row.blockedId,
          projectId: row.projectId,
          ownerUserId: blockedOwner,
          title: `Blocked: ${row.blockedTitle}`,
          message:
            `"${row.blockedTitle}"${where} is waiting on "${row.blockerTitle}", which is ` +
            `${daysLate} day${daysLate === 1 ? '' : 's'} overdue. Plan around it or raise it with the owner.`,
          actionUrl: taskUrl(row.blockedId),
          actionLabel: 'Open task',
          metadata: {
            blockerTaskId: row.blockerId,
            blockerTaskTitle: row.blockerTitle,
            daysLate
          }
        });
      }
    }

    return findings;
  }
};
