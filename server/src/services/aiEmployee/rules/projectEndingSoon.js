/**
 * Rule: a project is approaching (or has passed) its end date.
 *
 * Two distinct problems: closure work that hasn't started, and projects left
 * "Active" months after they actually finished — which quietly corrupts every
 * portfolio report until someone notices.
 */

import { select, hasColumns, startOfToday, addDays, toDateOnly, daysBetween } from '../db.js';
import { commonReplacements, projectUrl, describeDays } from './shared.js';

export default {
  key: 'project_ending_soon',
  name: 'Project closing / overdue',
  category: 'deadline',

  isAvailable: () => hasColumns('projects', ['id', 'name', 'end_date', 'status']),

  async detect({ config }) {
    const settings = config.rules.projectEndingSoon;
    if (!settings.enabled) return [];

    const horizons = [...settings.horizons].sort((a, b) => b - a);
    const today = startOfToday();
    const furthest = toDateOnly(addDays(today, horizons[0]));

    const rows = await select(
      `SELECT p.id, p.name AS "projectName", p.project_code AS "projectCode",
              p.end_date AS "endDate", p.status, p.progress,
              p.manager_id AS "managerId", p.donor
         FROM projects p
        WHERE p.end_date IS NOT NULL
          AND p.end_date <= :furthest
          AND (p.status IS NULL OR CAST(p.status AS TEXT) NOT IN (:closedProjectStatuses))`,
      { furthest, ...commonReplacements }
    );

    const findings = [];

    for (const row of rows) {
      const daysLeft = daysBetween(today, row.endDate);
      const ownerUserId = row.managerId ? Number(row.managerId) : null;

      if (daysLeft < 0) {
        if (!settings.flagOverdue) continue;
        const daysPast = Math.abs(daysLeft);

        findings.push({
          dedupeKey: `project_past_end:${row.id}`,
          severity: daysPast > 30 ? 'high' : 'warning',
          entityType: 'project',
          entityId: row.id,
          projectId: row.id,
          ownerUserId,
          title: `Past end date but still open: ${row.projectName}`,
          message:
            `${row.projectName} ended on ${row.endDate} (${daysPast} days ago) but is still marked ` +
            `"${row.status || 'Active'}". Close it out or extend the end date — while it stays open it ` +
            `distorts every portfolio and donor report.`,
          actionUrl: projectUrl(row.id),
          actionLabel: 'Open project',
          metadata: { projectCode: row.projectCode, endDate: row.endDate, daysPast, status: row.status }
        });
        continue;
      }

      const horizon = horizons.find((h) => daysLeft <= h);
      if (horizon === undefined) continue;

      findings.push({
        dedupeKey: `project_ending_soon:${row.id}:${horizon}`,
        severity: daysLeft <= 7 ? 'high' : 'warning',
        entityType: 'project',
        entityId: row.id,
        projectId: row.id,
        ownerUserId,
        title: `Project ends ${describeDays(daysLeft)}: ${row.projectName}`,
        message:
          `${row.projectName} ends on ${row.endDate} (${describeDays(daysLeft)}).` +
          (row.progress != null ? ` Progress is recorded at ${row.progress}%.` : '') +
          ` Closure work — final report, expense reconciliation, beneficiary evidence — should be underway.` +
          (row.donor ? ` Donor: ${row.donor}.` : ''),
        actionUrl: projectUrl(row.id),
        actionLabel: 'Open project',
        metadata: { projectCode: row.projectCode, endDate: row.endDate, daysLeft, horizon, progress: row.progress }
      });
    }

    return findings;
  }
};
