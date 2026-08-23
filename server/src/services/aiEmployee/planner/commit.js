/**
 * AI Employee — committing an approved plan.
 *
 * This is the only place in the AI Employee that writes to operational data, and
 * it runs exactly once per plan, only after a human has approved it, and only for
 * the items that human accepted.
 *
 * Everything happens in one transaction. A plan that half-commits — twelve tasks
 * created, the thirteenth failing — would leave a project in a state nobody
 * asked for and nobody can easily unpick.
 */

import sequelize from '../../../config/database.js';
import { select, execute, hasColumns, toJsonColumn, fromJsonColumn, isPostgres } from '../db.js';

const payloadOf = (item) =>
  fromJsonColumn(item.editedPayload, null) ?? fromJsonColumn(item.payload, {});

// ── Task commit ──────────────────────────────────────────────────────────

const commitTasks = async ({ items, project, userId, transaction, warnings }) => {
  const refToId = new Map();
  const created = [];
  const baseCount = await (async () => {
    const [row] = await sequelize.query(
      `SELECT COUNT(*) AS count FROM tasks WHERE project_id = :projectId`,
      { replacements: { projectId: project.id }, type: sequelize.QueryTypes.SELECT, transaction }
    );
    return Number(row?.count ?? 0);
  })();

  const hasProcurement = await hasColumns('tasks', ['requires_procurement']);
  const hasTaskType = await hasColumns('tasks', ['task_type']);
  const hasDeliverables = await hasColumns('tasks', ['deliverables']);

  // Pass 1 — create every task. Dependencies can't be wired yet because the
  // tasks they point at may not exist until this loop finishes.
  let offset = 0;
  for (const item of items) {
    const p = payloadOf(item);
    const code = project.projectCode
      ? `${project.projectCode}-T${String(baseCount + offset + 1).padStart(3, '0')}`
      : null;

    const columns = [
      'project_id', 'task_code', 'title', 'description', 'status', 'priority',
      'start_date', 'due_date', 'created_by', 'requires_approval', 'progress',
      'created_at', 'updated_at'
    ];
    const values = [
      ':projectId', ':taskCode', ':title', ':description', "'Pending'", ':priority',
      ':startDate', ':dueDate', ':createdBy', ':requiresApproval', '0',
      ':now', ':now'
    ];
    const replacements = {
      projectId: project.id,
      taskCode: code,
      title: String(p.title ?? 'Untitled').slice(0, 255),
      description: p.description ?? null,
      priority: p.priority ?? 'Medium',
      startDate: p.startDate ?? null,
      dueDate: p.dueDate ?? null,
      createdBy: userId ?? null,
      requiresApproval: Boolean(p.requiresApproval),
      now: new Date()
    };

    if (hasTaskType) {
      columns.push('task_type');
      values.push(':taskType');
      replacements.taskType = p.taskType ?? 'Other';
    }
    if (hasProcurement) {
      columns.push('requires_procurement');
      values.push(':requiresProcurement');
      replacements.requiresProcurement = Boolean(p.requiresProcurement);
    }
    if (hasDeliverables) {
      columns.push('deliverables');
      values.push(':deliverables');
      replacements.deliverables = toJsonColumn(
        (p.deliverables ?? []).map((d) => ({ name: String(d), status: 'pending', url: '' }))
      );
    }

    await sequelize.query(
      `INSERT INTO tasks (${columns.join(', ')}) VALUES (${values.join(', ')})`,
      { replacements, transaction }
    );

    const [row] = await sequelize.query(
      `SELECT id FROM tasks WHERE project_id = :projectId ORDER BY id DESC LIMIT 1`,
      { replacements: { projectId: project.id }, type: sequelize.QueryTypes.SELECT, transaction }
    );

    const taskId = Number(row.id);
    if (p.ref) refToId.set(p.ref, taskId);
    created.push({ item, taskId, payload: p });
    offset += 1;
  }

  // Pass 2 — wire dependencies now that every ref resolves to a real id.
  // depends_on is a Postgres integer array; on other dialects it is skipped.
  if (isPostgres && (await hasColumns('tasks', ['depends_on', 'blocks']))) {
    const blockedBy = new Map(); // blockerId -> [blockedId]

    for (const { taskId, payload } of created) {
      const dependsOn = (payload.dependsOnRefs ?? [])
        .map((ref) => refToId.get(ref))
        .filter(Boolean);

      if (dependsOn.length === 0) continue;

      await sequelize.query(
        `UPDATE tasks SET depends_on = :dependsOn WHERE id = :taskId`,
        { replacements: { dependsOn, taskId }, transaction }
      );

      for (const blockerId of dependsOn) {
        if (!blockedBy.has(blockerId)) blockedBy.set(blockerId, []);
        blockedBy.get(blockerId).push(taskId);
      }
    }

    for (const [blockerId, blocked] of blockedBy) {
      await sequelize.query(
        `UPDATE tasks SET blocks = :blocks WHERE id = :blockerId`,
        { replacements: { blocks: blocked, blockerId }, transaction }
      );
    }
  } else if (created.some((c) => (c.payload.dependsOnRefs ?? []).length > 0)) {
    warnings.push(
      'Task dependencies were not written — this database does not support the depends_on column. ' +
      'Sequence the tasks manually.'
    );
  }

  return created.map(({ item, taskId }) => ({ item, entityType: 'task', entityId: taskId }));
};

// ── Indicator commit ─────────────────────────────────────────────────────

const commitIndicators = async ({ items, project, transaction }) => {
  const results = [];

  // The indicators table differs between deployments — some carry
  // collection_method, others only responsible. Probe rather than assume.
  const hasCollectionMethod = await hasColumns('indicators', ['collection_method']);

  for (const item of items) {
    const p = payloadOf(item);

    const columns = [
      'project_id', 'name', 'type', 'unit', 'baseline', 'target', 'current',
      'status', 'frequency', 'data_source', 'created_at', 'updated_at'
    ];
    const values = [
      ':projectId', ':name', ':type', ':unit', ':baseline', ':target', '0',
      "'On Track'", ':frequency', ':dataSource', ':now', ':now'
    ];
    const replacements = {
      projectId: project.id,
      name: String(p.name ?? 'Indicator').slice(0, 500),
      type: p.type ?? 'Output',
      unit: p.unit ?? null,
      baseline: Number(p.baseline) || 0,
      target: Number(p.target) || 0,
      frequency: p.frequency ?? 'Quarterly',
      // Where collection_method has no column, fold it into data_source so the
      // reviewer's intent is not silently dropped.
      dataSource: hasCollectionMethod
        ? (p.dataSource ?? null)
        : [p.dataSource, p.collectionMethod].filter(Boolean).join(' — ') || null,
      now: new Date()
    };

    if (hasCollectionMethod) {
      columns.push('collection_method');
      values.push(':collectionMethod');
      replacements.collectionMethod = p.collectionMethod ?? null;
    }

    await sequelize.query(
      `INSERT INTO indicators (${columns.join(', ')}) VALUES (${values.join(', ')})`,
      { replacements, transaction }
    );

    const [row] = await sequelize.query(
      `SELECT id FROM indicators WHERE project_id = :projectId ORDER BY id DESC LIMIT 1`,
      { replacements: { projectId: project.id }, type: sequelize.QueryTypes.SELECT, transaction }
    );

    results.push({ item, entityType: 'indicator', entityId: Number(row.id) });
  }

  return results;
};

// ── Budget commit ────────────────────────────────────────────────────────

/**
 * Budget lines become a single Draft budget for the project, never an approved
 * one. Money always waits for a human in the existing approval workflow.
 */
const commitBudgetLines = async ({ items, project, userId, transaction, warnings }) => {
  if (items.length === 0) return [];

  const lines = items.map((item) => {
    const p = payloadOf(item);
    return {
      category: p.category,
      description: p.description,
      amount: Number(p.amount) || 0,
      justification: p.justification ?? null
    };
  });

  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  const fiscalYear = project.startDate ? String(project.startDate).slice(0, 4) : String(new Date().getUTCFullYear());

  if (!project.startDate || !project.endDate) {
    warnings.push('Budget was not created — the project has no start/end date, which the budget record requires.');
    return [];
  }

  await sequelize.query(
    `INSERT INTO budgets (
       budget_name, fiscal_year, start_date, end_date, project_id,
       total_budget, allocated_amount, spent_amount, remaining_amount,
       currency, status, line_items, notes, created_by, created_at, updated_at
     ) VALUES (
       :budgetName, :fiscalYear, :startDate, :endDate, :projectId,
       :total, :total, 0, :total,
       'LKR', 'Draft', :lineItems, :notes, :userId, :now, :now
     )`,
    {
      replacements: {
        budgetName: `${project.projectName ?? `Project ${project.id}`} — planned budget`.slice(0, 200),
        fiscalYear,
        startDate: project.startDate,
        endDate: project.endDate,
        projectId: project.id,
        total,
        lineItems: toJsonColumn(lines),
        notes: 'Generated by the AI Employee from the approved setup plan. Status is Draft — it still needs the normal budget approval.',
        userId: userId ?? null,
        now: new Date()
      },
      transaction
    }
  );

  const [row] = await sequelize.query(
    `SELECT id FROM budgets WHERE project_id = :projectId ORDER BY id DESC LIMIT 1`,
    { replacements: { projectId: project.id }, type: sequelize.QueryTypes.SELECT, transaction }
  );

  const budgetId = Number(row.id);
  return items.map((item) => ({ item, entityType: 'budget', entityId: budgetId }));
};

// ── Entry point ──────────────────────────────────────────────────────────

/**
 * Commit every accepted item on a plan. Idempotent by refusal: a plan that has
 * already been committed is rejected rather than duplicated.
 */
export const commitPlan = async ({ planId, userId }) => {
  const [plan] = await select(
    `SELECT id, project_id AS "projectId", status FROM ai_plans WHERE id = :planId`,
    { planId }
  );
  if (!plan) throw new Error(`Plan ${planId} not found`);
  if (plan.status === 'committed') throw new Error('This plan has already been committed');
  if (plan.status === 'rejected') throw new Error('This plan was rejected and cannot be committed');

  const [project] = await select(
    `SELECT id, name AS "projectName", project_code AS "projectCode",
            start_date AS "startDate", end_date AS "endDate"
       FROM projects WHERE id = :projectId`,
    { projectId: plan.projectId }
  );
  if (!project) throw new Error(`Project ${plan.projectId} no longer exists`);

  const items = await select(
    `SELECT id, kind, sequence, origin, ref, title, payload, edited_payload AS "editedPayload", status
       FROM ai_plan_items
      WHERE plan_id = :planId AND status IN ('proposed', 'accepted', 'edited')
      ORDER BY sequence ASC`,
    { planId }
  );

  if (items.length === 0) {
    throw new Error('Nothing to commit — every item on this plan was rejected');
  }

  const warnings = [];
  const byKind = (kind) => items.filter((i) => i.kind === kind);

  // Preflight the schema before opening a transaction. Discovering a missing
  // column halfway through a commit produces a correct rollback but a terrible
  // error message; checking up front says exactly what is wrong.
  const REQUIRED = {
    // Must list every column the unconditional part of each INSERT touches.
    // Optional columns (task_type, deliverables, …) are probed separately.
    tasks: [
      'project_id', 'task_code', 'title', 'description', 'status', 'priority',
      'start_date', 'due_date', 'created_by', 'requires_approval', 'progress',
      'created_at', 'updated_at'
    ],
    indicators: [
      'project_id', 'name', 'type', 'unit', 'baseline', 'target', 'current',
      'status', 'frequency', 'data_source', 'created_at', 'updated_at'
    ],
    budgets: [
      'project_id', 'budget_name', 'fiscal_year', 'start_date', 'end_date',
      'total_budget', 'allocated_amount', 'spent_amount', 'remaining_amount',
      'currency', 'status', 'line_items', 'notes', 'created_by', 'created_at', 'updated_at'
    ]
  };

  const needed = new Set(['tasks']);
  if (byKind('indicator').length > 0) needed.add('indicators');
  if (byKind('budget_line').length > 0) needed.add('budgets');

  for (const table of needed) {
    if (!(await hasColumns(table, REQUIRED[table]))) {
      throw new Error(
        `Cannot commit: the "${table}" table is missing columns this plan needs ` +
        `(expected ${REQUIRED[table].join(', ')}). Nothing was created.`
      );
    }
  }

  const transaction = await sequelize.transaction();
  let committed = [];

  try {
    committed = [
      ...(await commitTasks({ items: byKind('task'), project, userId, transaction, warnings })),
      ...(await commitIndicators({ items: byKind('indicator'), project, transaction })),
      ...(await commitBudgetLines({ items: byKind('budget_line'), project, userId, transaction, warnings }))
    ];

    const now = new Date();
    for (const { item, entityType, entityId } of committed) {
      await sequelize.query(
        `UPDATE ai_plan_items
            SET status = 'committed', committed_entity_type = :entityType,
                committed_entity_id = :entityId, updated_at = :now
          WHERE id = :id`,
        { replacements: { id: item.id, entityType, entityId, now }, transaction }
      );
    }

    await sequelize.query(
      `UPDATE ai_plans
          SET status = 'committed', approved_by = :userId, approved_at = :now,
              committed_at = :now, committed_count = :count, updated_at = :now
        WHERE id = :planId`,
      { replacements: { planId, userId: userId ?? null, now, count: committed.length }, transaction }
    );

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw new Error(`Commit failed and was rolled back — nothing was created. ${err.message}`);
  }

  const taskCount = committed.filter((c) => c.entityType === 'task').length;
  if (taskCount > 0) {
    warnings.push(
      `${taskCount} task${taskCount === 1 ? ' was' : 's were'} created unassigned. ` +
      `Assign them before work starts, or the Watcher will have nobody to remind.`
    );
  }

  return {
    planId,
    projectId: project.id,
    committed: committed.length,
    byType: {
      tasks: taskCount,
      indicators: committed.filter((c) => c.entityType === 'indicator').length,
      budgets: new Set(committed.filter((c) => c.entityType === 'budget').map((c) => c.entityId)).size
    },
    warnings
  };
};
