/**
 * AI Employee — scheduler.
 *
 * Registers the two recurring jobs and guarantees they never overlap: a sweep
 * that runs long (a big backlog on first run) must not have a second sweep
 * start on top of it, or alerts get double-notified.
 */

import cron from 'node-cron';
import { getConfig } from './settings.js';
import { runWatch, purgeOldRecords } from './engine.js';
import { runBriefing } from './briefing.js';
import { getAiEmployee } from './identity.js';
import { tableExists } from './db.js';

const tasks = [];
const running = new Set();

/** Run `fn` unless a previous invocation of the same job is still going. */
const withLock = (name, fn) => async () => {
  if (running.has(name)) {
    console.warn(`[AI Employee] Skipping "${name}" — previous run still in progress`);
    return;
  }
  running.add(name);
  try {
    await fn();
  } catch (err) {
    console.error(`[AI Employee] Job "${name}" threw:`, err);
  } finally {
    running.delete(name);
  }
};

/**
 * Wire up the AI Employee's recurring jobs. Called once at server startup.
 * Returns false (with a reason logged) rather than throwing, so a problem here
 * can never stop the API from booting.
 */
export const startAiEmployee = async () => {
  try {
    const config = await getConfig({ fresh: true });

    if (!config.enabled) {
      console.log('[AI Employee] Disabled (AI_EMPLOYEE_ENABLED=false) — scheduler not started');
      return false;
    }

    // Same guard the rest of this server's cron jobs use: serverless has no
    // long-running process to hold a scheduler, and tests should not sweep.
    // On Vercel, drive the sweep through POST /api/cron/ai-employee-watch.
    if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'test') {
      console.log('[AI Employee] In-process scheduler skipped (serverless or test). Use /api/cron/ai-employee-* instead.');
      return false;
    }

    if (!(await tableExists('ai_alerts'))) {
      console.warn(
        '[AI Employee] Tables missing — run `node server/src/migrations/create_ai_employee_tables.js`. Scheduler not started.'
      );
      return false;
    }

    // Provision the employee account up front so the first alert is attributable.
    await getAiEmployee();

    if (!cron.validate(config.schedule.watch)) {
      console.error(`[AI Employee] Invalid watch cron "${config.schedule.watch}" — scheduler not started`);
      return false;
    }

    tasks.push(
      cron.schedule(
        config.schedule.watch,
        withLock('watch', async () => {
          await runWatch({ trigger: 'cron' });
          await purgeOldRecords();
        }),
        { timezone: config.timezone }
      )
    );

    if (config.briefing.enabled && cron.validate(config.schedule.briefing)) {
      tasks.push(
        cron.schedule(
          config.schedule.briefing,
          withLock('briefing', () => runBriefing({ trigger: 'cron' })),
          { timezone: config.timezone }
        )
      );
    }

    console.log(
      `[AI Employee] ${config.identity.name} is on duty — ` +
      `sweep "${config.schedule.watch}", briefing "${config.schedule.briefing}" (${config.timezone})` +
      (config.dryRun ? ' [DRY RUN — no notifications will be sent]' : '')
    );

    return true;
  } catch (err) {
    console.error('[AI Employee] Failed to start scheduler:', err.message);
    return false;
  }
};

/**
 * Stop all jobs — used on graceful shutdown.
 * node-cron v4 returns a promise from stop(); swallow it rather than let a
 * rejection reach the process-level unhandledRejection handler mid-shutdown.
 */
export const stopAiEmployee = () => {
  for (const task of tasks) {
    try {
      const result = task.stop();
      if (result && typeof result.catch === 'function') result.catch(() => {});
    } catch {
      /* already stopped */
    }
  }
  tasks.length = 0;
};

export const isJobRunning = (name) => running.has(name);
