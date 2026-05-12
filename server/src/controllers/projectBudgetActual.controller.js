// =============================================================================
// Project Budget vs Actual report
//
// GET /api/projects/:id/budget-actual?startDate=&endDate=&fiscalYear=
//
// Compares the project's planned spend (Project.budget plus any per-category
// breakdown from Budget.lineItems for that project) against actual expenses
// recorded against the project. Only Approved + Paid expenses count toward
// "actual" — Pending/Rejected are surfaced separately so users can see the
// pipeline.
//
// Returned aggregates:
//   - totals:     headline numbers (budget, actual, variance, utilization%)
//   - byCategory: per-category budget vs actual (Travel, Meal, etc.)
//   - byMonth:    actual spend per calendar month, for sparkline/trend
//   - byStatus:   counts and amounts per status (Pending/Approved/Paid/Rejected)
//
// Date filter applies to Expense.date (the spend date). Project.budget is
// treated as a single planning figure that doesn't change with the filter —
// the report is "of this budget, how much has been spent in [period]".
// =============================================================================

import { Op } from 'sequelize';
import { Project, Expense, Budget } from '../models/index.js';
import { asyncHandler, NotFoundError } from '../middleware/error.middleware.js';

const ACTUAL_STATUSES = ['Approved', 'Paid'];

const monthKey = (d) => {
  const date = new Date(d);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

// Pull per-category budget from Budget.lineItems JSON. Shape we tolerate:
//   [{ category: 'Travel', amount: 100000 }, ...]
// Anything else is ignored. Multiple budgets for the same project (multiple
// fiscal years) are summed.
const sumLineItemsByCategory = (budgets) => {
  const byCat = {};
  for (const b of budgets) {
    const items = Array.isArray(b.lineItems) ? b.lineItems : [];
    for (const it of items) {
      const cat = String(it?.category || '').trim();
      const amt = Number(it?.amount);
      if (!cat || !Number.isFinite(amt)) continue;
      byCat[cat] = (byCat[cat] || 0) + amt;
    }
  }
  return byCat;
};

export const getProjectBudgetActual = asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  if (!Number.isFinite(projectId)) {
    return res.status(400).json({ success: false, message: 'Invalid project id' });
  }

  const project = await Project.findByPk(projectId, {
    attributes: ['id', 'name', 'projectCode', 'budget', 'spent', 'startDate', 'endDate', 'status']
  });
  if (!project) throw new NotFoundError('Project not found');

  const { startDate, endDate, fiscalYear } = req.query;

  // Expense filter: scope to project, optional date window.
  const expWhere = { projectId };
  if (startDate || endDate) {
    expWhere.date = {};
    if (startDate) expWhere.date[Op.gte] = startDate;
    if (endDate)   expWhere.date[Op.lte] = endDate;
  }
  const expenses = await Expense.findAll({
    where: expWhere,
    attributes: ['id', 'date', 'category', 'amount', 'status'],
    order: [['date', 'ASC']],
  });

  // Budget filter: same project, optional fiscalYear.
  const budgetWhere = { projectId };
  if (fiscalYear) budgetWhere.fiscalYear = fiscalYear;
  const budgets = await Budget.findAll({
    where: budgetWhere,
    attributes: ['id', 'fiscalYear', 'totalBudget', 'spentAmount', 'lineItems', 'status'],
  });

  // Totals
  const projectBudget = Number(project.budget || 0);
  let actualApproved = 0;
  let pendingAmount  = 0;
  let rejectedAmount = 0;
  const byStatus = { Pending: { count: 0, amount: 0 }, Approved: { count: 0, amount: 0 },
                     Paid:    { count: 0, amount: 0 }, Rejected: { count: 0, amount: 0 } };

  // Per-category & per-month roll-ups (only actuals count toward variance).
  const actualByCategory = {};
  const actualByMonth    = {};

  for (const e of expenses) {
    const amt = Number(e.amount || 0);
    const st  = e.status || 'Pending';
    if (byStatus[st]) {
      byStatus[st].count += 1;
      byStatus[st].amount += amt;
    }
    if (st === 'Pending') pendingAmount += amt;
    if (st === 'Rejected') rejectedAmount += amt;
    if (ACTUAL_STATUSES.includes(st)) {
      actualApproved += amt;
      const cat = e.category || 'Uncategorised';
      actualByCategory[cat] = (actualByCategory[cat] || 0) + amt;
      const mk = monthKey(e.date);
      actualByMonth[mk] = (actualByMonth[mk] || 0) + amt;
    }
  }

  const budgetByCategory = sumLineItemsByCategory(budgets);

  // Stitch categories — union of planned and actual categories.
  const allCategories = new Set([
    ...Object.keys(budgetByCategory),
    ...Object.keys(actualByCategory),
  ]);
  const byCategory = [...allCategories].map((cat) => {
    const planned = budgetByCategory[cat] ?? null;
    const actual  = actualByCategory[cat]  ?? 0;
    const variance = planned !== null ? planned - actual : null;
    const utilizationPct = planned && planned > 0 ? (actual / planned) * 100 : null;
    return { category: cat, budget: planned, actual, variance, utilizationPct };
  }).sort((a, b) => (b.actual ?? 0) - (a.actual ?? 0));

  const byMonth = Object.entries(actualByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, actual]) => ({ month, actual }));

  const variance = projectBudget - actualApproved;
  const utilizationPct = projectBudget > 0 ? (actualApproved / projectBudget) * 100 : null;

  res.json({
    success: true,
    data: {
      project: {
        id: project.id,
        name: project.name,
        projectCode: project.projectCode,
        budget: projectBudget,
        spent: Number(project.spent || 0),
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status,
      },
      period: { startDate: startDate || null, endDate: endDate || null, fiscalYear: fiscalYear || null },
      totals: {
        budget: projectBudget,
        actual: actualApproved,
        pending: pendingAmount,
        rejected: rejectedAmount,
        variance,
        utilizationPct,
      },
      byCategory,
      byMonth,
      byStatus,
      budgetsConsidered: budgets.length,
      expensesConsidered: expenses.length,
    },
  });
});
