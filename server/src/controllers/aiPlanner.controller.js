/**
 * AI Employee — Planner HTTP surface.
 *
 * The flow this exposes is deliberately three steps, not one:
 *   generate  → a draft plan nobody has seen
 *   review    → accept, edit or reject each item individually
 *   approve   → commit the survivors into real tasks, indicators and a budget
 *
 * There is no path that turns a project into live tasks without a person
 * approving it.
 */

import { select, execute, fromJsonColumn, toJsonColumn } from '../services/aiEmployee/db.js';
import { generatePlan } from '../services/aiEmployee/planner/generate.js';
import { commitPlan } from '../services/aiEmployee/planner/commit.js';
import { describeProviders } from '../services/aiEmployee/planner/provider.js';

const PLAN_FIELDS = `
  id, project_id AS "projectId", title, status, source, brief, summary,
  assumptions, questions, generator, model, prompt_version AS "promptVersion",
  ai_available AS "aiAvailable", generation_ms AS "generationMs",
  item_count AS "itemCount", committed_count AS "committedCount", warnings,
  generated_by AS "generatedBy", generated_at AS "generatedAt",
  approved_by AS "approvedBy", approved_at AS "approvedAt",
  committed_at AS "committedAt", rejected_reason AS "rejectedReason"
`;

const ITEM_FIELDS = `
  id, plan_id AS "planId", kind, sequence, origin, ref, title,
  payload, edited_payload AS "editedPayload", status,
  rejected_reason AS "rejectedReason",
  committed_entity_type AS "committedEntityType",
  committed_entity_id AS "committedEntityId", notes
`;

const hydratePlan = (row) => ({
  ...row,
  assumptions: fromJsonColumn(row.assumptions, []),
  questions: fromJsonColumn(row.questions, []),
  warnings: fromJsonColumn(row.warnings, [])
});

const hydrateItem = (row) => ({
  ...row,
  payload: fromJsonColumn(row.payload, {}),
  editedPayload: fromJsonColumn(row.editedPayload, null)
});

/** Who may approve or reject a plan — the same people who run the assistant. */
const APPROVER_ROLES = ['Admin', 'CEO', 'BOD', 'Director Programmes', 'Programme Manager'];
const canApprove = (user) => APPROVER_ROLES.includes(user.role);

/**
 * POST /api/ai-employee/plans
 * Body: { projectId, brief?, provider? }
 */
export const createPlan = async (req, res) => {
  try {
    const projectId = parseInt(req.body?.projectId, 10);
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'projectId is required' });
    }

    const existing = await select(
      `SELECT id, status FROM ai_plans WHERE project_id = :projectId AND status = 'draft'`,
      { projectId }
    );

    const result = await generatePlan({
      projectId,
      brief: req.body?.brief ?? null,
      userId: req.user.id,
      provider: req.body?.provider ?? null
    });

    res.status(201).json({
      success: true,
      ...result,
      // Surface rather than silently supersede — two live drafts for one project
      // is confusing, and the caller should decide which to keep.
      note: existing.length > 0
        ? `This project already had ${existing.length} draft plan(s): #${existing.map((p) => p.id).join(', #')}. Discard the ones you do not want.`
        : undefined
    });
  } catch (error) {
    console.error('Error generating plan:', error);
    res.status(500).json({ success: false, message: 'Plan generation failed', error: error.message });
  }
};

/** GET /api/ai-employee/plans?projectId=&status= */
export const listPlans = async (req, res) => {
  try {
    const clauses = [];
    const replacements = { limit: Math.min(parseInt(req.query.limit ?? '25', 10) || 25, 100) };

    if (req.query.projectId) {
      clauses.push('project_id = :projectId');
      replacements.projectId = parseInt(req.query.projectId, 10);
    }
    if (req.query.status) {
      clauses.push('status = :status');
      replacements.status = req.query.status;
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = await select(
      `SELECT ${PLAN_FIELDS} FROM ai_plans ${where} ORDER BY generated_at DESC LIMIT :limit`,
      replacements
    );

    res.json({ success: true, plans: rows.map(hydratePlan) });
  } catch (error) {
    console.error('Error listing plans:', error);
    res.status(500).json({ success: false, message: 'Failed to list plans', error: error.message });
  }
};

/** GET /api/ai-employee/plans/:id — the full plan with every item, for review. */
export const getPlan = async (req, res) => {
  try {
    const [plan] = await select(`SELECT ${PLAN_FIELDS} FROM ai_plans WHERE id = :id`, { id: req.params.id });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const items = await select(
      `SELECT ${ITEM_FIELDS} FROM ai_plan_items WHERE plan_id = :id ORDER BY sequence ASC`,
      { id: req.params.id }
    );

    const hydrated = items.map(hydrateItem);

    res.json({
      success: true,
      plan: hydratePlan(plan),
      items: hydrated,
      grouped: {
        tasks: hydrated.filter((i) => i.kind === 'task'),
        indicators: hydrated.filter((i) => i.kind === 'indicator'),
        budgetLines: hydrated.filter((i) => i.kind === 'budget_line')
      },
      counts: hydrated.reduce((acc, i) => {
        acc[i.status] = (acc[i.status] ?? 0) + 1;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch plan', error: error.message });
  }
};

/**
 * PATCH /api/ai-employee/plans/:id/items/:itemId
 * Body: { status?: 'accepted'|'rejected'|'proposed', payload?: {...}, reason?, notes? }
 *
 * Editing an item stores the edit separately from what the model proposed, so
 * the original suggestion stays visible next to the human correction.
 */
export const updatePlanItem = async (req, res) => {
  try {
    const [plan] = await select(`SELECT id, status FROM ai_plans WHERE id = :id`, { id: req.params.id });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    if (plan.status === 'committed') {
      return res.status(409).json({ success: false, message: 'This plan has already been committed' });
    }
    if (!canApprove(req.user)) {
      return res.status(403).json({ success: false, message: 'You cannot edit plan items' });
    }

    const [item] = await select(
      `SELECT ${ITEM_FIELDS} FROM ai_plan_items WHERE id = :itemId AND plan_id = :id`,
      { itemId: req.params.itemId, id: req.params.id }
    );
    if (!item) return res.status(404).json({ success: false, message: 'Plan item not found' });

    const updates = [];
    const replacements = { itemId: item.id, now: new Date() };

    if (req.body?.payload && typeof req.body.payload === 'object') {
      const merged = { ...fromJsonColumn(item.payload, {}), ...req.body.payload };
      updates.push('edited_payload = :editedPayload', "status = 'edited'");
      replacements.editedPayload = toJsonColumn(merged);
      if (merged.title) {
        updates.push('title = :title');
        replacements.title = String(merged.title).slice(0, 255);
      }
    } else if (req.body?.status) {
      const status = req.body.status;
      if (!['proposed', 'accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'status must be proposed, accepted or rejected' });
      }
      updates.push('status = :status');
      replacements.status = status;
      updates.push('rejected_reason = :reason');
      replacements.reason = status === 'rejected' ? (req.body.reason ?? null) : null;
    }

    if (req.body?.notes !== undefined) {
      updates.push('notes = :notes');
      replacements.notes = req.body.notes;
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    updates.push('updated_at = :now');
    await execute(`UPDATE ai_plan_items SET ${updates.join(', ')} WHERE id = :itemId`, replacements);

    const [updated] = await select(`SELECT ${ITEM_FIELDS} FROM ai_plan_items WHERE id = :itemId`, { itemId: item.id });
    res.json({ success: true, item: hydrateItem(updated) });
  } catch (error) {
    console.error('Error updating plan item:', error);
    res.status(500).json({ success: false, message: 'Failed to update item', error: error.message });
  }
};

/**
 * POST /api/ai-employee/plans/:id/approve
 * Commits every item that has not been rejected.
 */
export const approvePlan = async (req, res) => {
  try {
    if (!canApprove(req.user)) {
      return res.status(403).json({ success: false, message: 'You cannot approve plans' });
    }

    const result = await commitPlan({ planId: req.params.id, userId: req.user.id });
    res.json({ success: true, message: 'Plan committed', ...result });
  } catch (error) {
    console.error('Error approving plan:', error);
    const conflict = /already been committed|was rejected|Nothing to commit/.test(error.message);
    res.status(conflict ? 409 : 500).json({ success: false, message: error.message });
  }
};

/** POST /api/ai-employee/plans/:id/reject  { reason } */
export const rejectPlan = async (req, res) => {
  try {
    if (!canApprove(req.user)) {
      return res.status(403).json({ success: false, message: 'You cannot reject plans' });
    }

    const [plan] = await select(`SELECT id, status FROM ai_plans WHERE id = :id`, { id: req.params.id });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    if (plan.status === 'committed') {
      return res.status(409).json({ success: false, message: 'This plan has already been committed' });
    }

    await execute(
      `UPDATE ai_plans SET status = 'rejected', rejected_reason = :reason, updated_at = :now WHERE id = :id`,
      { id: plan.id, reason: req.body?.reason ?? null, now: new Date() }
    );

    res.json({ success: true, message: 'Plan rejected' });
  } catch (error) {
    console.error('Error rejecting plan:', error);
    res.status(500).json({ success: false, message: 'Failed to reject plan', error: error.message });
  }
};

/** GET /api/ai-employee/planner/status — which provider would be used. */
export const getPlannerStatus = async (req, res) => {
  try {
    const providers = describeProviders();
    const [counts] = await select(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS drafts,
              SUM(CASE WHEN status = 'committed' THEN 1 ELSE 0 END) AS committed
         FROM ai_plans`
    );

    res.json({
      success: true,
      providers,
      plans: {
        total: Number(counts?.total ?? 0),
        drafts: Number(counts?.drafts ?? 0),
        committed: Number(counts?.committed ?? 0)
      }
    });
  } catch (error) {
    console.error('Error fetching planner status:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch planner status', error: error.message });
  }
};
