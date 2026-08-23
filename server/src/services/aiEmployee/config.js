/**
 * AI Employee — configuration
 *
 * Every threshold the Watcher uses lives here. Values can be overridden at
 * runtime from the `ai_employee_settings` table (see settings.js), so an admin
 * can tune the AI Employee without a redeploy.
 */

export const DEFAULT_CONFIG = {
  // ── Identity ────────────────────────────────────────────────────────────
  identity: {
    name: process.env.AI_EMPLOYEE_NAME || 'Rafiq',
    email: process.env.AI_EMPLOYEE_EMAIL || 'rafiq@gersl.system',
    username: 'rafiq',
    employeeId: 'AI-001',
    role: 'Project Assistant',
    department: 'Programmes',
    title: 'AI Programme Assistant'
  },

  // ── Master switch ───────────────────────────────────────────────────────
  enabled: process.env.AI_EMPLOYEE_ENABLED !== 'false',

  // Dry run: detect and record alerts, but never send notifications.
  // Useful for the first week so you can see what it *would* have sent.
  dryRun: process.env.AI_EMPLOYEE_DRY_RUN === 'true',

  // ── Scheduling (cron expressions, evaluated in `timezone`) ──────────────
  timezone: process.env.AI_EMPLOYEE_TZ || 'Asia/Colombo',
  schedule: {
    // Sweep all rules every hour on the hour.
    watch: process.env.AI_EMPLOYEE_WATCH_CRON || '0 * * * *',
    // Personal daily briefing every working morning.
    briefing: process.env.AI_EMPLOYEE_BRIEFING_CRON || '0 8 * * 1-6'
  },

  // ── Quiet hours ─────────────────────────────────────────────────────────
  // Outside working hours only `critical` alerts are delivered; everything
  // else waits for the next run inside the window. Staff mute anything that
  // pings them at 3am, and a muted assistant is a dead assistant.
  quietHours: {
    enabled: true,
    startHour: 20, // 20:00 — stop sending
    endHour: 7,    // 07:00 — resume sending
    // 0 = Sunday. Fridays are half days at GER but still working days.
    nonWorkingDays: [0]
  },

  // ── Anti-spam ───────────────────────────────────────────────────────────
  limits: {
    // Never send the same person more than this many AI notifications per day.
    maxNotificationsPerUserPerDay: 12,
    // Minimum gap before re-notifying about the *same* open alert, by severity.
    reNotifyAfterHours: {
      info: 168,     // weekly
      warning: 72,   // every 3 days
      high: 24,      // daily
      critical: 12   // twice a day
    },
    // Cap on how many findings a single rule may raise in one run. Protects
    // against a schema/data problem turning into 5,000 notifications.
    maxFindingsPerRule: 200,
    // Hard ceiling on notifications per sweep. The first run against a backlog
    // of years-old overdue tasks would otherwise flood the whole organisation.
    maxNotificationsPerRun: 150
  },

  // ── Escalation ladder ───────────────────────────────────────────────────
  // Level is chosen by how many days an alert has been open. Each level adds
  // recipients — the owner keeps getting it, their manager joins, then the
  // project manager, then leadership.
  escalation: {
    levels: [
      { level: 0, afterDays: 0,  audience: ['owner'] },
      { level: 1, afterDays: 2,  audience: ['owner', 'line_manager'] },
      { level: 2, afterDays: 5,  audience: ['owner', 'line_manager', 'project_manager'] },
      { level: 3, afterDays: 10, audience: ['owner', 'line_manager', 'project_manager', 'leadership'] }
    ],
    // Roles treated as "leadership" for the final escalation rung.
    leadershipRoles: ['CEO', 'Director Programmes', 'Admin']
  },

  // ── Rule thresholds ─────────────────────────────────────────────────────
  rules: {
    taskDueSoon: {
      enabled: true,
      // Nudge when a task is this many days out. One alert per horizon crossed.
      horizons: [7, 3, 1]
    },
    taskOverdue: {
      enabled: true,
      // Severity climbs with how late the task is.
      severityByDaysOverdue: [
        { minDays: 0,  severity: 'warning' },
        { minDays: 3,  severity: 'high' },
        { minDays: 10, severity: 'critical' }
      ]
    },
    taskDependencyBlocked: {
      enabled: true
    },
    taskApprovalPending: {
      enabled: true,
      afterDays: 3
    },
    approvalPending: {
      enabled: true,
      afterDays: 3,
      // Approvals above this amount escalate faster.
      highValueAmount: 500000
    },
    projectBudgetBurn: {
      enabled: true,
      // Flag when % of budget spent exceeds % of timeline elapsed by this much.
      warningGapPercent: 20,
      criticalGapPercent: 35,
      // Ignore projects that have barely started — the ratio is noise early on.
      minElapsedPercent: 15,
      minBudget: 1000
    },
    projectEndingSoon: {
      enabled: true,
      horizons: [30, 14, 7],
      // Projects still Active past their end date.
      flagOverdue: true
    },
    documentExpiring: {
      enabled: true,
      horizons: [60, 30, 7]
    }
  },

  // ── Daily briefing ──────────────────────────────────────────────────────
  briefing: {
    enabled: true,
    // Skip sending an empty "you have nothing" briefing.
    skipIfEmpty: true,
    maxItems: 10
  },

  // ── Housekeeping ────────────────────────────────────────────────────────
  retention: {
    // Delete resolved alerts older than this.
    resolvedAlertDays: 90,
    // Delete run records older than this.
    runHistoryDays: 30
  }
};

/**
 * Statuses that mean a task/project is no longer worth chasing.
 *
 * `projects.status` is a Postgres ENUM (Planning | Implementation | Closing |
 * Completed) while `tasks.status` is a plain varchar, and the frontend uses a
 * wider vocabulary than either. Every comparison therefore runs through
 * CAST(status AS TEXT), so a value that does not exist in a given deployment
 * simply never matches instead of failing the query. That makes the extra
 * entries below harmless and forward-compatible.
 *
 * Note 'Closing' is deliberately absent — a project being closed out is still
 * live work that needs chasing.
 */
export const CLOSED_TASK_STATUSES = ['Completed', 'Cancelled'];
export const CLOSED_PROJECT_STATUSES = ['Completed', 'Cancelled', 'Closed'];

export const SEVERITY_ORDER = ['info', 'warning', 'high', 'critical'];

/** Map an AI severity onto the `notifications.priority` vocabulary. */
export const SEVERITY_TO_PRIORITY = {
  info: 'Low',
  warning: 'Medium',
  high: 'High',
  critical: 'Urgent'
};
