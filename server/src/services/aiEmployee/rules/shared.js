/**
 * Shared SQL fragments for the Watcher's rules.
 */

import { hasColumns } from '../db.js';
import { CLOSED_TASK_STATUSES, CLOSED_PROJECT_STATUSES } from '../config.js';

export const TASK_COLUMNS = ['id', 'title', 'due_date', 'status', 'assigned_to', 'project_id'];

/**
 * Tasks carry ownership two ways in this codebase: the legacy `tasks.assigned_to`
 * column and the newer `task_assignees` join table. Both are still written to,
 * so the Watcher has to consider the union or it will silently miss people.
 *
 * Returns a SQL fragment usable as a subquery yielding (task_id, user_id).
 */
export const taskOwnersSql = async () => {
  const legacy = `SELECT t.id AS task_id, t.assigned_to AS user_id
                    FROM tasks t
                   WHERE t.assigned_to IS NOT NULL`;

  if (await hasColumns('task_assignees', ['task_id', 'user_id'])) {
    return `${legacy}
            UNION
            SELECT ta.task_id, ta.user_id
              FROM task_assignees ta
             WHERE ta.user_id IS NOT NULL`;
  }

  return legacy;
};

/** Task statuses the Watcher should stop chasing. */
export const OPEN_TASK_FILTER = `t.status IS NULL OR t.status NOT IN (:closedTaskStatuses)`;

export const commonReplacements = {
  closedTaskStatuses: CLOSED_TASK_STATUSES,
  closedProjectStatuses: CLOSED_PROJECT_STATUSES
};

/** Deep-link used by notifications and the alerts inbox. */
export const taskUrl = (taskId) => `/admin/operations/tasks?task=${taskId}`;
export const projectUrl = (projectId) => `/admin/projects/${projectId}`;
export const approvalUrl = () => `/admin/approvals`;
export const documentUrl = () => `/admin/hr/documents`;

/** Human-friendly "in 3 days" / "3 days ago" / "today". */
export const describeDays = (days) => {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${Math.abs(days)} days ago`;
};
