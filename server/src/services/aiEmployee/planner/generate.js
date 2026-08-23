/**
 * AI Employee — plan generation.
 *
 * Order of operations:
 *   1. load whatever the project record actually holds
 *   2. build the deterministic scaffold (reporting calendar, closure, compliance)
 *   3. ask the model for the work breakdown, telling it what the scaffold covers
 *   4. normalise the response, clamp it to the project window, dedupe it
 *   5. persist everything as a draft plan for a human to review
 *
 * Step 3 is the only step that can fail without failing the whole plan. If no
 * provider is configured, or the call errors, the scaffold is still saved and the
 * failure is recorded on the plan as a warning.
 */

import { select, execute, getColumns, toJsonColumn, fromJsonColumn } from '../db.js';
import { PLAN_SCHEMA, PROMPT_VERSION, normalizePlan } from './schema.js';
import { buildScaffold } from './scaffold.js';
import { generateJson, describeProviders } from './provider.js';

// Columns worth feeding the model, if the deployment has them.
const CONTEXT_COLUMNS = [
  'id', 'name', 'project_code', 'description', 'start_date', 'end_date',
  'budget', 'donor', 'funding_source', 'programme_area', 'location', 'status',
  'manager_id', 'target_beneficiaries', 'beneficiaries_target', 'sector_theme',
  'problem_statement', 'proposed_solution', 'overall_goal', 'objectives',
  'key_activities', 'results_framework', 'budget_breakdown', 'theory_of_change',
  'beneficiary_breakdown'
];

const CAMEL = {
  name: 'projectName', project_code: 'projectCode', start_date: 'startDate',
  end_date: 'endDate', funding_source: 'fundingSource', programme_area: 'programmeArea',
  manager_id: 'managerId', target_beneficiaries: 'targetBeneficiaries',
  beneficiaries_target: 'beneficiariesTarget', sector_theme: 'sectorTheme',
  problem_statement: 'problemStatement', proposed_solution: 'proposedSolution',
  overall_goal: 'overallGoal', key_activities: 'keyActivities',
  results_framework: 'resultsFramework', budget_breakdown: 'budgetBreakdown',
  theory_of_change: 'theoryOfChange', beneficiary_breakdown: 'beneficiaryBreakdown'
};

const JSON_FIELDS = new Set([
  'objectives', 'keyActivities', 'resultsFramework', 'budgetBreakdown',
  'theoryOfChange', 'beneficiaryBreakdown'
]);

/** Load a project using only the columns this deployment actually has. */
export const loadProjectContext = async (projectId) => {
  const available = await getColumns('projects');
  const columns = CONTEXT_COLUMNS.filter((c) => available.has(c));
  if (columns.length === 0) throw new Error('projects table is unavailable');

  const projection = columns
    .map((c) => (CAMEL[c] ? `${c} AS "${CAMEL[c]}"` : c))
    .join(', ');

  const [row] = await select(
    `SELECT ${projection} FROM projects WHERE id = :projectId`,
    { projectId }
  );
  if (!row) return null;

  for (const key of JSON_FIELDS) {
    if (key in row) row[key] = fromJsonColumn(row[key], null);
  }
  return row;
};

// ── Prompt ───────────────────────────────────────────────────────────────

const SYSTEM_PROMPT =
  'You are a programme planning specialist at Global Ehsan Relief Sri Lanka, an NGO delivering ' +
  'humanitarian and development projects. You turn an approved project into a realistic delivery ' +
  'plan: the tasks that must happen, in what order, with sensible durations.\n\n' +
  'Ground every task in the project actually described. Do not produce generic filler. If the brief ' +
  'is thin, say so in `questions` rather than inventing detail — a question the manager can answer ' +
  'is more useful than a confident guess.\n\n' +
  'Sequence work properly: assessment and beneficiary selection precede distribution; procurement ' +
  'precedes anything requiring goods; training precedes activities that depend on trained staff. ' +
  'Use dependsOnRefs to express this. Durations should reflect real field conditions in Sri Lanka, ' +
  'not best-case estimates.';

const listOf = (value, limit = 12) => {
  if (!Array.isArray(value) || value.length === 0) return null;
  return value
    .slice(0, limit)
    .map((v) => `  - ${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join('\n');
};

const buildPrompt = ({ project, scaffold, brief }) => {
  const lines = ['# PROJECT', ''];

  const field = (label, value) => {
    if (value === null || value === undefined || value === '') return;
    lines.push(`${label}: ${value}`);
  };

  field('Name', project.projectName);
  field('Code', project.projectCode);
  field('Programme area', project.programmeArea);
  field('Sector', project.sectorTheme);
  field('Donor', project.donor ?? project.fundingSource);
  field('Location', project.location);
  field('Start date', project.startDate);
  field('End date', project.endDate);
  field('Budget', project.budget);
  field('Target beneficiaries', project.targetBeneficiaries ?? project.beneficiariesTarget);

  const narrative = [
    ['Description', project.description],
    ['Problem statement', project.problemStatement],
    ['Proposed solution', project.proposedSolution],
    ['Overall goal', project.overallGoal]
  ];
  for (const [label, text] of narrative) {
    if (text) lines.push('', `## ${label}`, String(text).slice(0, 2500));
  }

  const objectives = listOf(project.objectives);
  if (objectives) lines.push('', '## Objectives', objectives);

  const activities = listOf(project.keyActivities, 20);
  if (activities) lines.push('', '## Key activities named in the proposal', activities);

  const framework = listOf(project.resultsFramework, 15);
  if (framework) lines.push('', '## Existing results framework', framework);

  if (brief) {
    lines.push('', '## Additional briefing from the project manager', String(brief).slice(0, 4000));
  }

  // Tell the model what it must NOT regenerate. Without this it duplicates the
  // reporting and closure tasks the scaffold already produced.
  if (scaffold.tasks.length > 0) {
    lines.push(
      '',
      '# ALREADY COVERED — DO NOT REPEAT THESE',
      '',
      'The following tasks are generated automatically from policy and are already in the plan.',
      'Do not produce these or near-duplicates of them:',
      scaffold.tasks.map((t) => `  - ${t.title}`).join('\n')
    );
  }

  lines.push(
    '',
    '# YOUR TASK',
    '',
    'Produce the delivery work breakdown for this project — the implementation tasks that are',
    'specific to what it is actually delivering. Aim for 8 to 20 tasks: enough to be a real plan,',
    'few enough that a manager will read it.',
    '',
    'Rules:',
    '  - startOffsetDays and durationDays are integers counted from the project start date.',
    '    Never write calendar dates. Everything must fit inside the project period.',
    '  - Every task needs a unique `ref`. Use dependsOnRefs to sequence them.',
    '  - Set requiresProcurement true for any task needing goods or services bought in.',
    '  - Set requiresApproval true for anything a manager must sign off before it proceeds.',
    '  - Propose indicators only where the results framework above does not already cover them.',
    '  - Propose budget lines only if the project has no existing budget breakdown.',
    '  - Put anything you had to assume in `assumptions`, and anything you genuinely need',
    '    answered in `questions`.'
  );

  return lines.join('\n');
};

// ── Merge ────────────────────────────────────────────────────────────────

const fingerprint = (title) =>
  String(title).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Combine scaffold and model output, dropping model tasks that restate a
 * scaffold task. Scaffold always wins — it encodes policy.
 */
const merge = (scaffold, ai) => {
  const scaffoldPrints = new Set(scaffold.tasks.map((t) => fingerprint(t.title)));
  const warnings = [...(ai?.warnings ?? [])];

  const aiTasks = (ai?.tasks ?? []).filter((t) => {
    if (scaffoldPrints.has(fingerprint(t.title))) {
      warnings.push(`Dropped "${t.title}" — the scaffold already covers it`);
      return false;
    }
    return true;
  });

  // Only take model indicators / budget lines where the project had none.
  const indicators = scaffold.indicators.length > 0
    ? scaffold.indicators
    : (ai?.indicators ?? []);
  const budgetLines = scaffold.budgetLines.length > 0
    ? scaffold.budgetLines
    : (ai?.budgetLines ?? []);

  return {
    summary: ai?.summary ?? '',
    assumptions: ai?.assumptions ?? [],
    questions: ai?.questions ?? [],
    scaffoldTasks: scaffold.tasks,
    aiTasks,
    indicators,
    indicatorsOrigin: scaffold.indicators.length > 0 ? 'scaffold' : 'ai',
    budgetLines,
    budgetLinesOrigin: scaffold.budgetLines.length > 0 ? 'scaffold' : 'ai',
    warnings: [...warnings, ...scaffold.notes]
  };
};

// ── Persistence ──────────────────────────────────────────────────────────

const insertItem = async (planId, { kind, sequence, origin, ref, title, payload }) => {
  await execute(
    `INSERT INTO ai_plan_items (plan_id, kind, sequence, origin, ref, title, payload, status, created_at, updated_at)
     VALUES (:planId, :kind, :sequence, :origin, :ref, :title, :payload, 'proposed', :now, :now)`,
    {
      planId,
      kind,
      sequence,
      origin,
      ref: ref ?? null,
      title: title ? String(title).slice(0, 255) : null,
      payload: toJsonColumn(payload),
      now: new Date()
    }
  );
};

/**
 * Generate a draft plan for a project.
 *
 * Always returns a plan. `aiAvailable: false` on the result means the model half
 * was skipped or failed — check `warnings` for why.
 */
export const generatePlan = async ({ projectId, brief = null, userId = null, provider = null }) => {
  const startedAt = Date.now();

  const project = await loadProjectContext(projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);

  const scaffold = buildScaffold(project);

  let ai = null;
  let generator = 'scaffold';
  let model = null;
  let rawResponse = null;
  const failures = [];

  const providers = describeProviders();
  if (providers.misconfigured) {
    failures.push(
      `AI_PLANNER_PROVIDER is set to "${providers.misconfigured}" but that provider has no API key configured.`
    );
  }

  if (providers.selected || provider) {
    try {
      const result = await generateJson({
        system: SYSTEM_PROMPT,
        prompt: buildPrompt({ project, scaffold, brief }),
        schema: PLAN_SCHEMA,
        provider
      });
      ai = normalizePlan(result.data, project);
      generator = result.provider;
      model = result.model;
      rawResponse = result.raw;
    } catch (err) {
      console.error('[AI Employee] Plan generation failed:', err.message);
      failures.push(`Model generation failed (${err.message}). The scaffold below was still produced.`);
    }
  } else {
    failures.push(
      'No AI provider is configured, so only the rule-based scaffold was generated. ' +
      'Set ANTHROPIC_API_KEY or GROQ_API_KEY to get a full work breakdown.'
    );
  }

  const merged = merge(scaffold, ai);
  const warnings = [...failures, ...merged.warnings];
  const itemCount =
    merged.scaffoldTasks.length + merged.aiTasks.length +
    merged.indicators.length + merged.budgetLines.length;

  // ── persist ──
  const now = new Date();
  await execute(
    `INSERT INTO ai_plans (
       project_id, title, status, source, brief, summary, assumptions, questions,
       generator, model, prompt_version, ai_available, generation_ms, item_count,
       warnings, generated_by, generated_at, raw_response, created_at, updated_at
     ) VALUES (
       :projectId, :title, 'draft', :source, :brief, :summary, :assumptions, :questions,
       :generator, :model, :promptVersion, :aiAvailable, :generationMs, :itemCount,
       :warnings, :userId, :now, :rawResponse, :now, :now
     )`,
    {
      projectId,
      title: `Setup plan — ${project.projectName ?? `Project ${projectId}`}`.slice(0, 255),
      source: brief ? 'brief' : 'project',
      brief,
      summary: merged.summary || null,
      assumptions: toJsonColumn(merged.assumptions),
      questions: toJsonColumn(merged.questions),
      generator,
      model,
      promptVersion: PROMPT_VERSION,
      aiAvailable: ai !== null,
      generationMs: Date.now() - startedAt,
      itemCount,
      warnings: toJsonColumn(warnings),
      userId,
      now,
      rawResponse: rawResponse ? String(rawResponse).slice(0, 200000) : null
    }
  );

  const [{ id: planId }] = await select(`SELECT id FROM ai_plans ORDER BY id DESC LIMIT 1`);

  let sequence = 0;
  for (const t of merged.scaffoldTasks) {
    await insertItem(planId, { kind: 'task', sequence: sequence++, origin: 'scaffold', ref: t.ref, title: t.title, payload: t });
  }
  for (const t of merged.aiTasks) {
    await insertItem(planId, { kind: 'task', sequence: sequence++, origin: 'ai', ref: t.ref, title: t.title, payload: t });
  }
  for (const ind of merged.indicators) {
    await insertItem(planId, { kind: 'indicator', sequence: sequence++, origin: merged.indicatorsOrigin, ref: null, title: ind.name, payload: ind });
  }
  for (const line of merged.budgetLines) {
    await insertItem(planId, { kind: 'budget_line', sequence: sequence++, origin: merged.budgetLinesOrigin, ref: null, title: `${line.category}: ${line.description}`, payload: line });
  }

  return {
    planId,
    projectName: project.projectName,
    generator,
    model,
    aiAvailable: ai !== null,
    itemCount,
    counts: {
      scaffoldTasks: merged.scaffoldTasks.length,
      aiTasks: merged.aiTasks.length,
      indicators: merged.indicators.length,
      budgetLines: merged.budgetLines.length
    },
    warnings,
    questions: merged.questions,
    generationMs: Date.now() - startedAt
  };
};
