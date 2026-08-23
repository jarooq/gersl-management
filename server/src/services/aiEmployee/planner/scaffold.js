/**
 * AI Employee — the deterministic scaffold.
 *
 * A large part of an NGO project plan is not creative work: the donor reporting
 * calendar follows from the start and end dates, closure activities are the same
 * every time, and safeguarding steps are mandatory. Deriving those from rules is
 * more reliable than asking a model to remember them, costs nothing, and means
 * the Planner still produces something useful with no API key configured.
 *
 * The model's job is the part that genuinely varies: the work breakdown for this
 * project's actual objectives and activities.
 */

const addDays = (isoDate, days) => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const daysBetween = (a, b) =>
  Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000);

const task = ({ ref, title, description, taskType, phase, startDate, dueDate, priority = 'Medium', requiresApproval = false, deliverables = [], suggestedRole = null, dependsOnRefs = [] }) => ({
  ref,
  title,
  description,
  taskType,
  phase,
  priority,
  startDate,
  dueDate,
  dependsOnRefs,
  requiresProcurement: false,
  requiresApproval,
  estimatedCost: 0,
  suggestedRole,
  deliverables
});

/**
 * Build the rule-derived half of the plan.
 * Every item returned is marked `origin: 'scaffold'` by the caller so a reviewer
 * can tell at a glance what came from policy and what came from the model.
 */
export const buildScaffold = (project) => {
  const tasks = [];
  const budgetLines = [];
  const indicators = [];
  const notes = [];

  const start = project.startDate ?? null;
  const end = project.endDate ?? null;
  const span = start && end ? daysBetween(start, end) : null;

  if (!start || !end) {
    notes.push(
      'Project has no start and/or end date, so the reporting calendar and closure ' +
      'schedule could not be generated. Set the dates and regenerate.'
    );
  }

  // ── Inception ─────────────────────────────────────────────────────────
  if (start) {
    tasks.push(task({
      ref: 'S-INC-1',
      title: 'Project kickoff meeting',
      description:
        'Bring the project team together to confirm roles, deliverables, reporting lines and the ' +
        'delivery schedule before implementation starts.',
      taskType: 'Meeting',
      phase: 'Inception',
      priority: 'High',
      startDate: start,
      dueDate: addDays(start, 5),
      deliverables: ['Kickoff minutes', 'Confirmed team roles']
    }));

    tasks.push(task({
      ref: 'S-INC-2',
      title: 'Safeguarding and code of conduct briefing',
      description:
        'All project staff and volunteers are briefed on safeguarding, PSEA, the code of conduct ' +
        'and the complaints and feedback mechanism. Signed acknowledgements filed.',
      taskType: 'Administrative',
      phase: 'Inception',
      priority: 'High',
      startDate: start,
      dueDate: addDays(start, 10),
      deliverables: ['Signed acknowledgements', 'Attendance register'],
      suggestedRole: 'HR Manager'
    }));

    tasks.push(task({
      ref: 'S-INC-3',
      title: 'Establish complaints and feedback mechanism',
      description:
        'Set up and publicise the CFM channels for this project so beneficiaries can raise concerns ' +
        'from the first day of activity.',
      taskType: 'Administrative',
      phase: 'Inception',
      startDate: start,
      dueDate: addDays(start, 14),
      deliverables: ['CFM channels published'],
      suggestedRole: 'MEAL Officer'
    }));

    tasks.push(task({
      ref: 'S-INC-4',
      title: 'Baseline data collection',
      description:
        'Collect baseline values for every indicator in the results framework. Without a baseline ' +
        'the endline cannot demonstrate change.',
      taskType: 'Monitoring',
      phase: 'Inception',
      priority: 'High',
      startDate: addDays(start, 7),
      dueDate: addDays(start, 30),
      dependsOnRefs: ['S-INC-1'],
      deliverables: ['Baseline dataset', 'Baseline report'],
      suggestedRole: 'MEAL Officer'
    }));
  }

  // ── Donor reporting calendar ──────────────────────────────────────────
  // Quarterly interim reports for anything longer than four months, plus the
  // final narrative and financial reports after closure.
  if (start && end && span > 0) {
    if (span > 120) {
      const quarters = Math.floor(span / 90);
      for (let q = 1; q <= quarters; q += 1) {
        const periodEnd = addDays(start, q * 90);
        if (daysBetween(periodEnd, end) < 30) break; // too close to the final report

        tasks.push(task({
          ref: `S-REP-Q${q}`,
          title: `Interim donor report — quarter ${q}`,
          description:
            `Narrative and financial report covering the quarter ending ${periodEnd}. ` +
            `Include indicator progress, beneficiary numbers reached and expenditure to date.`,
          taskType: 'Administrative',
          phase: 'Monitoring',
          priority: 'High',
          startDate: addDays(periodEnd, -14),
          dueDate: addDays(periodEnd, 14),
          requiresApproval: true,
          deliverables: ['Narrative report', 'Financial report'],
          suggestedRole: 'Programme Manager'
        }));
      }
    }

    tasks.push(task({
      ref: 'S-REP-FIN',
      title: 'Final donor narrative report',
      description:
        'Final report to the donor covering the whole project: results against the framework, ' +
        'beneficiaries reached, lessons learned and evidence.',
      taskType: 'Administrative',
      phase: 'Closure',
      priority: 'High',
      startDate: addDays(end, -21),
      dueDate: addDays(end, 30),
      requiresApproval: true,
      deliverables: ['Final narrative report'],
      suggestedRole: 'Programme Manager'
    }));

    tasks.push(task({
      ref: 'S-REP-FINANCE',
      title: 'Final financial reconciliation',
      description:
        'Reconcile all project expenditure against budget lines, clear advances, and prepare the ' +
        'final financial report for the donor.',
      taskType: 'Administrative',
      phase: 'Closure',
      priority: 'High',
      startDate: addDays(end, -21),
      dueDate: addDays(end, 30),
      requiresApproval: true,
      deliverables: ['Final financial report', 'Reconciliation sheet'],
      suggestedRole: 'Finance Manager'
    }));
  }

  // ── Closure ───────────────────────────────────────────────────────────
  if (end && span !== null && span > 45) {
    tasks.push(task({
      ref: 'S-CLO-1',
      title: 'Compile beneficiary distribution evidence',
      description:
        'Collect and file signed distribution lists, photographs and any consent forms for every ' +
        'activity. Missing evidence is the most common audit finding.',
      taskType: 'Monitoring',
      phase: 'Closure',
      priority: 'High',
      startDate: addDays(end, -45),
      dueDate: addDays(end, -14),
      deliverables: ['Evidence pack'],
      suggestedRole: 'MEAL Officer'
    }));

    tasks.push(task({
      ref: 'S-CLO-2',
      title: 'Endline data collection and indicator close-out',
      description:
        'Collect endline values for all indicators and record final achievement against target.',
      taskType: 'Monitoring',
      phase: 'Closure',
      priority: 'High',
      startDate: addDays(end, -45),
      dueDate: addDays(end, -7),
      deliverables: ['Endline dataset'],
      suggestedRole: 'MEAL Officer'
    }));

    tasks.push(task({
      ref: 'S-CLO-3',
      title: 'Asset handover and inventory reconciliation',
      description:
        'Account for every asset purchased under this project and record its disposal or handover ' +
        'in line with the donor agreement.',
      taskType: 'Administrative',
      phase: 'Closure',
      startDate: addDays(end, -30),
      dueDate: addDays(end, -7),
      deliverables: ['Signed handover forms', 'Updated asset register']
    }));

    tasks.push(task({
      ref: 'S-CLO-4',
      title: 'Lessons learned review',
      description:
        'Hold an after-action review with the project team and partners, and record what should be ' +
        'carried into the next project.',
      taskType: 'Meeting',
      phase: 'Closure',
      startDate: addDays(end, -21),
      dueDate: end,
      deliverables: ['Lessons learned note'],
      suggestedRole: 'Programme Manager'
    }));
  }

  // ── Carry across anything the proposal already defined ────────────────
  // If the project was created from a proposal it may already hold a results
  // framework and a budget breakdown. Reusing those is strictly better than
  // asking a model to reinvent them.
  const framework = Array.isArray(project.resultsFramework) ? project.resultsFramework : [];
  for (const row of framework) {
    if (!row?.indicator) continue;
    indicators.push({
      name: String(row.indicator).slice(0, 500),
      type: 'Output',
      unit: null,
      baseline: Number(row.baseline) || 0,
      target: Number(row.target) || 0,
      frequency: String(row.frequency ?? 'Quarterly').slice(0, 50),
      dataSource: row.meansOfVerification ? String(row.meansOfVerification).slice(0, 200) : null,
      collectionMethod: null
    });
  }
  if (indicators.length > 0) {
    notes.push(`Reused ${indicators.length} indicator(s) from the project's existing results framework.`);
  }

  const breakdown = Array.isArray(project.budgetBreakdown) ? project.budgetBreakdown : [];
  for (const row of breakdown) {
    if (!row?.category && !row?.description) continue;
    budgetLines.push({
      category: String(row.category ?? 'Uncategorised').slice(0, 100),
      description: String(row.description ?? row.category ?? ''),
      amount: Number(row.cost) || 0,
      justification: row.justification ? String(row.justification) : null
    });
  }
  if (budgetLines.length > 0) {
    notes.push(`Reused ${budgetLines.length} budget line(s) from the project's existing breakdown.`);
  }

  return { tasks, indicators, budgetLines, notes };
};
