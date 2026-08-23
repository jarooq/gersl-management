/**
 * AI Employee — command line operations.
 *
 *   node server/src/scripts/aiEmployee.js status
 *   node server/src/scripts/aiEmployee.js watch [--dry-run] [--rule task_overdue]
 *   node server/src/scripts/aiEmployee.js briefing
 *   node server/src/scripts/aiEmployee.js provision
 *
 *   node server/src/scripts/aiEmployee.js plan --project 12 [--brief "..."]
 *   node server/src/scripts/aiEmployee.js plan-show --plan 3
 *   node server/src/scripts/aiEmployee.js plan-commit --plan 3
 *
 * Run `watch --dry-run` first on a live database. It records everything it
 * would raise without sending a single notification, so you can read the
 * backlog before the whole organisation does.
 */

import dotenv from 'dotenv';
import sequelize from '../config/database.js';
import { runWatch } from '../services/aiEmployee/engine.js';
import { runBriefing } from '../services/aiEmployee/briefing.js';
import { getAiEmployee } from '../services/aiEmployee/identity.js';
import { getConfig } from '../services/aiEmployee/settings.js';
import { select, tableExists } from '../services/aiEmployee/db.js';
import { RULES } from '../services/aiEmployee/rules/index.js';
import { generatePlan } from '../services/aiEmployee/planner/generate.js';
import { commitPlan } from '../services/aiEmployee/planner/commit.js';
import { describeProviders } from '../services/aiEmployee/planner/provider.js';

dotenv.config();

const args = process.argv.slice(2);
const command = args[0] ?? 'status';
const flag = (name) => args.includes(`--${name}`);
const value = (name) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 ? args[i + 1] : null;
};

const requireTables = async () => {
  if (await tableExists('ai_alerts')) return true;
  console.error(
    '❌ AI Employee tables are missing.\n' +
    '   Run: node server/src/migrations/create_ai_employee_tables.js'
  );
  return false;
};

const commands = {
  async status() {
    const config = await getConfig();
    const employee = await getAiEmployee();

    console.log(`\n${config.identity.name} — AI Employee (Phase 1: the Watcher)`);
    console.log('─'.repeat(58));
    console.log(`Account        : ${employee ? `#${employee.id} ${employee.fullName} <${employee.email}>` : 'not provisioned'}`);
    console.log(`Enabled        : ${config.enabled}`);
    console.log(`Dry run        : ${config.dryRun}`);
    console.log(`Timezone       : ${config.timezone}`);
    console.log(`Sweep schedule : ${config.schedule.watch}`);
    console.log(`Briefing       : ${config.schedule.briefing}`);
    console.log(`Quiet hours    : ${config.quietHours.startHour}:00 → ${config.quietHours.endHour}:00`);

    if (!(await requireTables())) return;

    const counts = await select(
      `SELECT status, COUNT(*) AS count FROM ai_alerts GROUP BY status`
    );
    console.log('\nAlerts');
    console.log('─'.repeat(58));
    if (counts.length === 0) {
      console.log('  (none yet — run `watch` to take a first look)');
    } else {
      for (const row of counts) console.log(`  ${String(row.status).padEnd(10)} ${row.count}`);
    }

    const [lastRun] = await select(
      `SELECT job, status, started_at AS "startedAt", findings, notifications_sent AS "sent"
         FROM ai_employee_runs ORDER BY started_at DESC LIMIT 1`
    );
    if (lastRun) {
      console.log(
        `\nLast run: ${lastRun.job} — ${lastRun.status} at ${lastRun.startedAt} ` +
        `(${lastRun.findings} findings, ${lastRun.sent} notifications)`
      );
    }

    console.log('\nRules');
    console.log('─'.repeat(58));
    for (const rule of RULES) {
      const available = await rule.isAvailable();
      console.log(`  ${available ? '✓' : '−'} ${rule.key.padEnd(26)} ${rule.name}${available ? '' : '  (schema missing — skipped)'}`);
    }
    console.log('');
  },

  async watch() {
    if (!(await requireTables())) return;
    if (flag('dry-run')) {
      process.env.AI_EMPLOYEE_DRY_RUN = 'true';
      console.log('🔍 Dry run — alerts will be recorded, no notifications sent.\n');
    }

    const rule = value('rule');
    const result = await runWatch({
      trigger: 'manual',
      ruleKeys: rule ? [rule] : null
    });

    console.log('\nResult');
    console.log('─'.repeat(58));
    console.log(JSON.stringify(result, null, 2));
  },

  async briefing() {
    if (!(await requireTables())) return;
    const result = await runBriefing({ trigger: 'manual' });
    console.log(JSON.stringify(result, null, 2));
  },

  async provision() {
    const employee = await getAiEmployee();
    if (employee) {
      console.log(`✅ ${employee.fullName} is user #${employee.id} (${employee.role}, ${employee.department})`);
    } else {
      console.error('❌ Could not provision the AI Employee account — see the error above.');
    }
  },

  // ── Planner (Phase 2) ─────────────────────────────────────────────────

  async plan() {
    if (!(await tableExists('ai_plans'))) {
      console.error('❌ Planner tables missing. Run: node server/src/migrations/create_ai_planner_tables.js');
      return;
    }

    const projectId = parseInt(value('project'), 10);
    if (!projectId) {
      console.error('Usage: plan --project <projectId> [--brief "extra context"]');
      return;
    }

    const providers = describeProviders();
    console.log(
      providers.selected
        ? `Generating with ${providers.selected} (${providers.models[providers.selected]})…\n`
        : 'No AI provider configured — generating the rule-based scaffold only.\n'
    );

    const result = await generatePlan({
      projectId,
      brief: value('brief'),
      provider: value('provider')
    });

    console.log(`✅ Plan #${result.planId} — ${result.projectName}`);
    console.log(`   generator : ${result.generator}${result.model ? ` (${result.model})` : ''}`);
    console.log(`   items     : ${result.itemCount}  ` +
      `(${result.counts.scaffoldTasks} scaffold tasks, ${result.counts.aiTasks} AI tasks, ` +
      `${result.counts.indicators} indicators, ${result.counts.budgetLines} budget lines)`);
    console.log(`   took      : ${result.generationMs}ms`);

    if (result.questions.length > 0) {
      console.log('\n❓ Questions for the project manager:');
      for (const q of result.questions) console.log(`   • ${q}`);
    }
    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      for (const w of result.warnings) console.log(`   • ${w}`);
    }
    console.log(`\nReview it: plan-show --plan ${result.planId}`);
  },

  async 'plan-show'() {
    const planId = parseInt(value('plan'), 10);
    if (!planId) {
      console.error('Usage: plan-show --plan <planId>');
      return;
    }

    const [plan] = await select(
      `SELECT id, title, status, generator, model, summary, warnings, questions
         FROM ai_plans WHERE id = :planId`,
      { planId }
    );
    if (!plan) {
      console.error(`Plan ${planId} not found`);
      return;
    }

    console.log(`\n${plan.title}`);
    console.log('═'.repeat(70));
    console.log(`Status: ${plan.status}   Generator: ${plan.generator}${plan.model ? ` (${plan.model})` : ''}`);
    if (plan.summary) console.log(`\n${plan.summary}`);

    const items = await select(
      `SELECT kind, sequence, origin, ref, title, status, payload
         FROM ai_plan_items WHERE plan_id = :planId ORDER BY sequence ASC`,
      { planId }
    );

    for (const kind of ['task', 'indicator', 'budget_line']) {
      const group = items.filter((i) => i.kind === kind);
      if (group.length === 0) continue;

      console.log(`\n── ${kind.toUpperCase()}S (${group.length}) ${'─'.repeat(40)}`);
      for (const i of group) {
        const p = typeof i.payload === 'string' ? JSON.parse(i.payload) : i.payload;
        const tag = i.origin === 'scaffold' ? '[rule]' : '[ai]  ';
        const mark = i.status === 'rejected' ? '✗' : i.status === 'committed' ? '✓' : ' ';
        const when = p.startDate && p.dueDate ? `  ${p.startDate} → ${p.dueDate}` : '';
        const deps = p.dependsOnRefs?.length ? `  ⟵ ${p.dependsOnRefs.join(', ')}` : '';
        console.log(` ${mark} ${tag} ${String(i.ref ?? '').padEnd(9)} ${i.title}${when}${deps}`);
      }
    }
    console.log('');
  },

  async 'plan-commit'() {
    const planId = parseInt(value('plan'), 10);
    if (!planId) {
      console.error('Usage: plan-commit --plan <planId>');
      return;
    }

    const result = await commitPlan({ planId, userId: null });
    console.log(`✅ Committed plan #${result.planId}`);
    console.log(`   ${result.byType.tasks} tasks, ${result.byType.indicators} indicators, ${result.byType.budgets} budget(s)`);
    for (const w of result.warnings) console.log(`   ⚠️  ${w}`);
  }
};

const run = async () => {
  const handler = commands[command];
  if (!handler) {
    console.error(`Unknown command "${command}". Try: ${Object.keys(commands).join(', ')}`);
    process.exit(1);
  }

  try {
    await handler();
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err);
    process.exit(1);
  }
};

run();
