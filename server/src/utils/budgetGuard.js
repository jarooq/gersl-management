// =============================================================================
// Project budget reconciliation helpers.
//
// Before this file the audit found three holes:
//   1. Project.spent never auto-updated — initialised at 0 and never moved.
//   2. Orders could overcommit a project (sum of order.totalBudget > project.budget).
//   3. Expense reject didn't reverse a previous approve, so project.spent leaked.
//
// `assertOrderWithinBudget` is called from order create/update; `recalcSpent`
// is called from order/item/expense status changes to keep project.spent
// honest from the source of truth (approved expenses + reported items).
// =============================================================================

import { WashOrder, IgpOrder, Project, Expense, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Sum the active (non-cancelled) order budgets for a project across both
 * WASH and IGP, optionally excluding one order id (for updates).
 */
const sumActiveOrderBudgets = async ({ projectId, excludeWashId, excludeIgpId }) => {
  if (!projectId) return 0;
  const washWhere = { projectId, status: { [Op.ne]: 'Cancelled' } };
  if (excludeWashId) washWhere.id = { [Op.ne]: excludeWashId };
  const igpWhere = { projectId, status: { [Op.ne]: 'Cancelled' } };
  if (excludeIgpId) igpWhere.id = { [Op.ne]: excludeIgpId };

  const [washSum, igpSum] = await Promise.all([
    WashOrder.sum('totalBudget', { where: washWhere }),
    IgpOrder.sum('totalBudget', { where: igpWhere }),
  ]);
  return Number(washSum || 0) + Number(igpSum || 0);
};

/**
 * Throw if `orderBudget` + existing-active-orders for this project would
 * exceed the project budget. Caller controls excludeWashId/IgpId so an
 * UPDATE doesn't count itself.
 */
export const assertOrderWithinBudget = async ({
  projectId,
  orderBudget,
  excludeWashId = null,
  excludeIgpId = null,
}) => {
  if (!projectId || !orderBudget) return; // nothing to guard
  const project = await Project.findByPk(projectId, { attributes: ['id', 'name', 'budget'] });
  if (!project) return; // can't enforce without a project, controller may still allow
  const cap = Number(project.budget || 0);
  if (cap <= 0) return; // no budget set — informational only

  const existing = await sumActiveOrderBudgets({ projectId, excludeWashId, excludeIgpId });
  const projected = existing + Number(orderBudget || 0);
  if (projected > cap) {
    const remaining = Math.max(cap - existing, 0);
    const err = new Error(
      `Order budget (${Number(orderBudget).toFixed(2)}) would overcommit project "${project.name}". ` +
      `Project budget ${cap.toFixed(2)}, already committed ${existing.toFixed(2)}, remaining ${remaining.toFixed(2)}.`
    );
    err.statusCode = 400;
    throw err;
  }
};

/**
 * Recompute project.spent from the source of truth and persist.
 *   spent = sum(approved/paid expenses against the project)
 *         + sum(actualCost of items in HandedOver/Reported stage)
 *
 * Best-effort: silently swallows on failure so it never breaks the caller's
 * own status update.
 */
export const recalcProjectSpent = async (projectId) => {
  if (!projectId) return;
  try {
    // Approved/paid expense sum.
    const expenseSum = await Expense.sum('amount', {
      where: { projectId, status: { [Op.in]: ['Approved', 'Paid'] } },
    });

    // Delivered programme spend. Reported = delivered + paperwork done.
    const [washActuals, igpActuals] = await Promise.all([
      sequelize.query(
        `SELECT COALESCE(SUM(wi.actual_cost), 0) AS total
         FROM wash_items wi
         JOIN wash_orders wo ON wo.id = wi.order_id
         WHERE wo.project_id = :projectId
           AND wi.stage IN ('HandedOver', 'Reported')`,
        { replacements: { projectId }, type: sequelize.QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT COALESCE(SUM(ii.actual_cost), 0) AS total
         FROM igp_items ii
         JOIN igp_orders io ON io.id = ii.order_id
         WHERE io.project_id = :projectId
           AND ii.stage IN ('Delivered', 'Reported')`,
        { replacements: { projectId }, type: sequelize.QueryTypes.SELECT }
      ),
    ]);

    const spent =
      Number(expenseSum || 0) +
      Number(washActuals[0]?.total || 0) +
      Number(igpActuals[0]?.total || 0);

    await Project.update({ spent }, { where: { id: projectId } });
  } catch (err) {
    console.error('[budgetGuard] recalcProjectSpent failed:', err.message);
  }
};
