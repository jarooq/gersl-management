/**
 * AI Employee — plan schema and normalisation.
 *
 * The model is asked for *offsets*, never dates: `startOffsetDays` and
 * `durationDays` relative to the project start. Models are unreliable at date
 * arithmetic — they produce dates that drift past the project end, land on the
 * wrong year, or ignore the duration they just stated. Offsets are checkable
 * integers, and the real dates are computed here against the project's actual
 * start and end. Anything that would fall outside the project window is clamped.
 */

export const PROMPT_VERSION = 'plan-v1';

export const TASK_TYPES = [
  'Procurement',
  'Beneficiary Selection',
  'Mass Distribution',
  'Individual Distribution',
  'Meeting',
  'Construction',
  'Training',
  'Monitoring',
  'Administrative',
  'Other'
];

export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
export const INDICATOR_TYPES = ['Output', 'Outcome', 'Impact', 'Process'];
export const PHASES = ['Inception', 'Implementation', 'Monitoring', 'Closure'];

/** JSON Schema handed to the provider. Enforced by the API on Anthropic. */
export const PLAN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'assumptions', 'questions', 'tasks', 'indicators', 'budgetLines'],
  properties: {
    summary: {
      type: 'string',
      description: 'Two or three sentences describing the shape of this delivery plan.'
    },
    assumptions: {
      type: 'array',
      description: 'Assumptions you had to make because the brief did not say.',
      items: { type: 'string' }
    },
    questions: {
      type: 'array',
      description: 'Questions the project manager must answer before this plan is safe to run.',
      items: { type: 'string' }
    },
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['ref', 'title', 'description', 'taskType', 'phase', 'startOffsetDays', 'durationDays', 'priority', 'dependsOnRefs'],
        properties: {
          ref: { type: 'string', description: 'Short unique id for this task, e.g. "T1". Used for dependencies.' },
          title: { type: 'string' },
          description: { type: 'string' },
          taskType: { type: 'string', enum: TASK_TYPES },
          phase: { type: 'string', enum: PHASES },
          startOffsetDays: { type: 'integer', description: 'Days after project start when this task begins. 0 = day one.' },
          durationDays: { type: 'integer', description: 'Working duration in days. Must be at least 1.' },
          priority: { type: 'string', enum: PRIORITIES },
          dependsOnRefs: {
            type: 'array',
            description: 'refs of tasks that must finish first. Empty array if none.',
            items: { type: 'string' }
          },
          requiresProcurement: { type: 'boolean' },
          requiresApproval: { type: 'boolean' },
          estimatedCost: { type: 'number', description: '0 if this task has no direct cost.' },
          suggestedRole: { type: 'string', description: 'Role best suited to own this, e.g. "MEAL Officer".' },
          deliverables: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    indicators: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'type', 'unit', 'baseline', 'target', 'frequency'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: INDICATOR_TYPES },
          unit: { type: 'string', description: 'e.g. "people", "households", "%", "sessions".' },
          baseline: { type: 'number' },
          target: { type: 'number' },
          frequency: { type: 'string', description: 'e.g. "Monthly", "Quarterly", "Endline".' },
          dataSource: { type: 'string' },
          collectionMethod: { type: 'string' }
        }
      }
    },
    budgetLines: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['category', 'description', 'amount'],
        properties: {
          category: { type: 'string', description: 'e.g. Personnel, Supplies, Transport, Training, M&E, Overheads.' },
          description: { type: 'string' },
          amount: { type: 'number' },
          justification: { type: 'string' }
        }
      }
    }
  }
};

// ── Normalisation ────────────────────────────────────────────────────────

const clampToEnum = (value, allowed, fallback) =>
  allowed.includes(value) ? value : fallback;

const toInt = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
};

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const addDays = (isoDate, days) => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const daysBetween = (a, b) =>
  Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000);

/**
 * Turn a raw model response into items that are safe to commit.
 *
 * Returns { tasks, indicators, budgetLines, warnings }. Warnings record every
 * correction made, so the reviewer can see where the model was wrong rather than
 * having the fix applied silently.
 */
export const normalizePlan = (raw, project) => {
  const warnings = [];
  const startDate = project.startDate;
  const endDate = project.endDate;
  const window = startDate && endDate ? daysBetween(startDate, endDate) : null;

  // ── tasks ──
  const seenRefs = new Set();
  const rawTasks = Array.isArray(raw?.tasks) ? raw.tasks : [];

  const tasks = rawTasks.map((t, i) => {
    let ref = String(t?.ref ?? `T${i + 1}`).trim() || `T${i + 1}`;
    if (seenRefs.has(ref)) {
      const unique = `${ref}_${i + 1}`;
      warnings.push(`Duplicate task ref "${ref}" renamed to "${unique}"`);
      ref = unique;
    }
    seenRefs.add(ref);

    const title = String(t?.title ?? '').trim() || `Untitled task ${i + 1}`;

    let startOffset = Math.max(0, toInt(t?.startOffsetDays, 0));
    let duration = Math.max(1, toInt(t?.durationDays, 7));

    // Keep the task inside the project window. A plan whose tasks run past the
    // end date is worse than useless — it immediately triggers overdue alerts.
    if (window !== null && window > 0) {
      if (startOffset > window) {
        warnings.push(`"${title}" started after the project ends; moved to the final week`);
        startOffset = Math.max(0, window - 7);
      }
      if (startOffset + duration > window) {
        const trimmed = Math.max(1, window - startOffset);
        if (trimmed !== duration) {
          warnings.push(`"${title}" ran past the project end; duration trimmed to ${trimmed} days`);
        }
        duration = trimmed;
      }
    }

    return {
      ref,
      title: title.slice(0, 255),
      description: String(t?.description ?? '').trim(),
      taskType: clampToEnum(t?.taskType, TASK_TYPES, 'Other'),
      phase: clampToEnum(t?.phase, PHASES, 'Implementation'),
      priority: clampToEnum(t?.priority, PRIORITIES, 'Medium'),
      startOffsetDays: startOffset,
      durationDays: duration,
      startDate: startDate ? addDays(startDate, startOffset) : null,
      dueDate: startDate ? addDays(startDate, startOffset + duration) : null,
      dependsOnRefs: Array.isArray(t?.dependsOnRefs)
        ? t.dependsOnRefs.map((r) => String(r).trim()).filter(Boolean)
        : [],
      requiresProcurement: Boolean(t?.requiresProcurement),
      requiresApproval: Boolean(t?.requiresApproval),
      estimatedCost: Math.max(0, toNumber(t?.estimatedCost, 0)),
      suggestedRole: String(t?.suggestedRole ?? '').trim() || null,
      deliverables: Array.isArray(t?.deliverables)
        ? t.deliverables.map((d) => String(d)).filter(Boolean)
        : []
    };
  });

  // Drop dependencies pointing at refs that don't exist — a common model error,
  // and one that would produce permanently-blocked tasks if committed.
  const validRefs = new Set(tasks.map((t) => t.ref));
  for (const task of tasks) {
    const kept = task.dependsOnRefs.filter((r) => validRefs.has(r) && r !== task.ref);
    if (kept.length !== task.dependsOnRefs.length) {
      warnings.push(`"${task.title}" referenced unknown dependencies; those were dropped`);
    }
    task.dependsOnRefs = kept;
  }

  // ── indicators ──
  const indicators = (Array.isArray(raw?.indicators) ? raw.indicators : []).map((ind, i) => ({
    name: String(ind?.name ?? `Indicator ${i + 1}`).slice(0, 500),
    type: clampToEnum(ind?.type, INDICATOR_TYPES, 'Output'),
    unit: String(ind?.unit ?? '').slice(0, 100) || null,
    baseline: toNumber(ind?.baseline, 0),
    target: toNumber(ind?.target, 0),
    frequency: String(ind?.frequency ?? 'Quarterly').slice(0, 50),
    dataSource: String(ind?.dataSource ?? '').slice(0, 200) || null,
    collectionMethod: String(ind?.collectionMethod ?? '').slice(0, 200) || null
  }));

  // ── budget lines ──
  const budgetLines = (Array.isArray(raw?.budgetLines) ? raw.budgetLines : []).map((line, i) => ({
    category: String(line?.category ?? 'Uncategorised').slice(0, 100),
    description: String(line?.description ?? `Budget line ${i + 1}`),
    amount: Math.max(0, toNumber(line?.amount, 0)),
    justification: String(line?.justification ?? '') || null
  }));

  // Budget lines that exceed the project budget are a planning error worth
  // surfacing loudly — but not worth silently rewriting.
  const lineTotal = budgetLines.reduce((sum, l) => sum + l.amount, 0);
  const projectBudget = toNumber(project.budget, 0);
  if (projectBudget > 0 && lineTotal > projectBudget * 1.001) {
    warnings.push(
      `Proposed budget lines total ${lineTotal.toLocaleString()}, which exceeds the ` +
      `project budget of ${projectBudget.toLocaleString()}. Review before approving.`
    );
  }

  return {
    summary: String(raw?.summary ?? '').trim(),
    assumptions: (Array.isArray(raw?.assumptions) ? raw.assumptions : []).map(String),
    questions: (Array.isArray(raw?.questions) ? raw.questions : []).map(String),
    tasks,
    indicators,
    budgetLines,
    warnings
  };
};
