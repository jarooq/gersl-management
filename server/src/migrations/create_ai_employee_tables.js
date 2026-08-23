import sequelize from '../config/database.js';

// Run with: node server/src/migrations/create_ai_employee_tables.js
// Idempotent: uses CREATE TABLE IF NOT EXISTS.
//
// Phase 1 of the AI Employee ("The Watcher"):
//   ai_alerts           - ledger of every issue the AI Employee has detected, with
//                         escalation state so we nudge instead of spamming.
//   ai_employee_runs    - execution history of the rule engine (observability).
//   ai_employee_settings- single-row tunable config (thresholds, quiet hours).

const isPostgres = sequelize.getDialect() === 'postgres';

const pk = isPostgres ? 'BIGSERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
const json = isPostgres ? 'JSONB' : 'TEXT';
const ts = isPostgres ? 'TIMESTAMPTZ' : 'DATETIME';
const now = isPostgres ? 'NOW()' : "CURRENT_TIMESTAMP";

async function run() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ai_alerts (
        id                 ${pk},
        rule_key           VARCHAR(64)  NOT NULL,
        severity           VARCHAR(20)  NOT NULL DEFAULT 'warning',
        category           VARCHAR(50),
        entity_type        VARCHAR(50),
        entity_id          INTEGER,
        project_id         INTEGER,
        owner_user_id      INTEGER,
        dedupe_key         VARCHAR(255) NOT NULL UNIQUE,
        title              VARCHAR(255) NOT NULL,
        message            TEXT,
        action_url         VARCHAR(500),
        action_label       VARCHAR(100),
        status             VARCHAR(20)  NOT NULL DEFAULT 'open',
        escalation_level   INTEGER      NOT NULL DEFAULT 0,
        notify_count       INTEGER      NOT NULL DEFAULT 0,
        first_detected_at  ${ts}        NOT NULL DEFAULT ${now},
        last_seen_at       ${ts}        NOT NULL DEFAULT ${now},
        last_notified_at   ${ts},
        snoozed_until      ${ts},
        resolved_at        ${ts},
        resolution         VARCHAR(50),
        notified_user_ids  ${json},
        metadata           ${json},
        created_at         ${ts}        NOT NULL DEFAULT ${now},
        updated_at         ${ts}        NOT NULL DEFAULT ${now}
      );
    `);

    await sequelize.query(`CREATE INDEX IF NOT EXISTS ai_alerts_status_idx  ON ai_alerts (status);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS ai_alerts_rule_idx    ON ai_alerts (rule_key);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS ai_alerts_owner_idx   ON ai_alerts (owner_user_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS ai_alerts_project_idx ON ai_alerts (project_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS ai_alerts_entity_idx  ON ai_alerts (entity_type, entity_id);`);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ai_employee_runs (
        id                 ${pk},
        trigger            VARCHAR(20)  NOT NULL DEFAULT 'cron',
        job                VARCHAR(50)  NOT NULL DEFAULT 'watch',
        status             VARCHAR(20)  NOT NULL DEFAULT 'running',
        started_at         ${ts}        NOT NULL DEFAULT ${now},
        finished_at        ${ts},
        duration_ms        INTEGER,
        rules_run          INTEGER      NOT NULL DEFAULT 0,
        findings           INTEGER      NOT NULL DEFAULT 0,
        alerts_opened      INTEGER      NOT NULL DEFAULT 0,
        alerts_resolved    INTEGER      NOT NULL DEFAULT 0,
        alerts_escalated   INTEGER      NOT NULL DEFAULT 0,
        notifications_sent INTEGER      NOT NULL DEFAULT 0,
        errors             ${json},
        triggered_by       INTEGER,
        created_at         ${ts}        NOT NULL DEFAULT ${now}
      );
    `);

    await sequelize.query(`CREATE INDEX IF NOT EXISTS ai_employee_runs_time_idx ON ai_employee_runs (started_at);`);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ai_employee_settings (
        id          INTEGER PRIMARY KEY,
        config      ${json},
        updated_by  INTEGER,
        updated_at  ${ts} NOT NULL DEFAULT ${now}
      );
    `);

    console.log('✅ ai_alerts, ai_employee_runs, ai_employee_settings tables ready');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

run();
