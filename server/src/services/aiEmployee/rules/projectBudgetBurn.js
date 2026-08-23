/**
 * Rule: a project is spending faster than its timeline is elapsing.
 *
 * Compares % of budget spent against % of the project period elapsed. A project
 * 40% through its schedule but 75% through its money is the single earliest
 * warning of a donor-reportable overspend, and nothing in the system surfaces
 * it today.
 *
 * The ratio is meaningless in the first weeks (mobilisation costs land early),
 * so projects below `minElapsedPercent` are skipped.
 */

import { select, hasColumns, startOfToday, daysBetween } from '../db.js';
import { commonReplacements, projectUrl } from './shared.js';

export default {
  key: 'project_budget_burn',
  name: 'Budget burning ahead of schedule',
  category: 'finance',

  isAvailable: () =>
    hasColumns('projects', ['id', 'name', 'budget', 'spent', 'start_date', 'end_date', 'status']),

  async detect({ config }) {
    const settings = config.rules.projectBudgetBurn;
    if (!settings.enabled) return [];

    const today = startOfToday();

    const rows = await select(
      `SELECT p.id, p.name AS "projectName", p.project_code AS "projectCode",
              p.budget, p.spent, p.start_date AS "startDate", p.end_date AS "endDate",
              p.status, p.manager_id AS "managerId", p.donor
         FROM projects p
        WHERE p.budget IS NOT NULL
          AND p.start_date IS NOT NULL
          AND p.end_date IS NOT NULL
          AND (p.status IS NULL OR p.status NOT IN (:closedProjectStatuses))`,
      commonReplacements
    );

    const findings = [];

    for (const row of rows) {
      const budget = Number(row.budget);
      const spent = Number(row.spent ?? 0);
      if (!Number.isFinite(budget) || budget < settings.minBudget) continue;

      const totalDays = daysBetween(row.startDate, row.endDate);
      if (totalDays <= 0) continue;

      const elapsedDays = daysBetween(row.startDate, today);
      if (elapsedDays <= 0) continue;

      const elapsedPercent = Math.min(100, (elapsedDays / totalDays) * 100);
      if (elapsedPercent < settings.minElapsedPercent) continue;

      const spentPercent = (spent / budget) * 100;
      const gap = spentPercent - elapsedPercent;
      if (gap < settings.warningGapPercent) continue;

      const severity = gap >= settings.criticalGapPercent ? 'critical' : 'high';
      const round = (n) => Math.round(n);

      findings.push({
        // Band the gap so the alert re-opens (and re-escalates) when burn
        // materially worsens, rather than sitting silent at its first level.
        dedupeKey: `project_budget_burn:${row.id}:${severity}`,
        severity,
        entityType: 'project',
        entityId: row.id,
        projectId: row.id,
        ownerUserId: row.managerId ? Number(row.managerId) : null,
        title: `Budget ahead of schedule: ${row.projectName}`,
        message:
          `${row.projectName} has spent ${round(spentPercent)}% of its budget ` +
          `(${spent.toLocaleString()} of ${budget.toLocaleString()}) but is only ` +
          `${round(elapsedPercent)}% through its timeline — a ${round(gap)} point gap. ` +
          `At this rate the budget runs out before ${row.endDate}.` +
          (row.donor ? ` Donor: ${row.donor}.` : ''),
        actionUrl: projectUrl(row.id),
        actionLabel: 'Review budget',
        metadata: {
          projectCode: row.projectCode,
          budget,
          spent,
          spentPercent: round(spentPercent),
          elapsedPercent: round(elapsedPercent),
          gapPercent: round(gap),
          endDate: row.endDate
        }
      });
    }

    return findings;
  }
};
