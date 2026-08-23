/**
 * AI Employee — escalation ladder
 *
 * An alert starts with the person who owns the work. The longer it stays open,
 * the wider the circle gets: line manager, then project manager, then
 * leadership. This is what separates an employee from a reminder cron — it
 * doesn't give up, and it doesn't stay quiet when something is genuinely stuck.
 */

import { select, hasColumns } from './db.js';

/** Which rung an alert should be on, given how long it has been open. */
export const levelForAge = (config, daysOpen) => {
  const levels = config.escalation.levels;
  let chosen = levels[0];
  for (const rung of levels) {
    if (daysOpen >= rung.afterDays) chosen = rung;
  }
  return chosen;
};

/** Active users holding a leadership role. */
const getLeadership = async (config) => {
  const roles = config.escalation.leadershipRoles || [];
  if (roles.length === 0) return [];
  const rows = await select(
    `SELECT id FROM users WHERE role IN (:roles) AND status = 'Active'`,
    { roles }
  );
  return rows.map((r) => Number(r.id));
};

/** The supervisor of a user, via users.reporting_to. */
const getLineManager = async (userId) => {
  if (!userId) return null;
  if (!(await hasColumns('users', ['reporting_to']))) return null;
  const [row] = await select(
    `SELECT u.reporting_to AS "managerId"
       FROM users u
       JOIN users m ON m.id = u.reporting_to AND m.status = 'Active'
      WHERE u.id = :userId`,
    { userId }
  );
  return row?.managerId ? Number(row.managerId) : null;
};

/** The manager of a project, via projects.manager_id. */
const getProjectManager = async (projectId) => {
  if (!projectId) return null;
  if (!(await hasColumns('projects', ['manager_id']))) return null;
  const [row] = await select(
    `SELECT p.manager_id AS "managerId"
       FROM projects p
       JOIN users u ON u.id = p.manager_id AND u.status = 'Active'
      WHERE p.id = :projectId`,
    { projectId }
  );
  return row?.managerId ? Number(row.managerId) : null;
};

/**
 * Resolve an audience list (`['owner', 'line_manager', ...]`) into user ids.
 * Deduplicated, inactive users dropped, and the AI Employee never notifies
 * itself.
 */
export const resolveRecipients = async ({
  config,
  audience,
  ownerUserId,
  projectId,
  aiEmployeeId
}) => {
  const ids = new Set();

  for (const group of audience) {
    if (group === 'owner' && ownerUserId) {
      ids.add(Number(ownerUserId));
    } else if (group === 'line_manager') {
      const managerId = await getLineManager(ownerUserId);
      if (managerId) ids.add(managerId);
    } else if (group === 'project_manager') {
      const pmId = await getProjectManager(projectId);
      if (pmId) ids.add(pmId);
    } else if (group === 'leadership') {
      for (const id of await getLeadership(config)) ids.add(id);
    }
  }

  if (aiEmployeeId) ids.delete(Number(aiEmployeeId));
  if (ids.size === 0) return [];

  // Final guard: only active users, in case reporting_to points at a leaver.
  const rows = await select(
    `SELECT id FROM users WHERE id IN (:ids) AND status = 'Active'`,
    { ids: [...ids] }
  );
  return rows.map((r) => Number(r.id));
};

/**
 * Fallback owner for alerts with nobody attached (e.g. a project with no
 * manager). Without this, orphaned alerts would be detected and never seen.
 */
export const getFallbackRecipients = async (config, aiEmployeeId) => {
  const ids = await getLeadership(config);
  return ids.filter((id) => Number(id) !== Number(aiEmployeeId));
};
