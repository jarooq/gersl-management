import sequelize from '../config/database.js';

// Run with: node server/src/migrations/create_ai_planner_tables.js
// Idempotent: uses CREATE TABLE IF NOT EXISTS.
//
// Phase 2 of the AI Employee ("The Planner"):
//   ai_plans       - one generated setup plan per project, held in draft until a
//                    human approves it.
//   ai_plan_items  - the individual proposed things (tasks, indicators, budget
//                    lines). Each is accepted, edited or rejected on its own, and
//                    records which real row it became once committed.

const isPostgres = sequelize.getDialect() === 'postgres';

const pk = isPostgres ? 'BIGSERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
const json = isPostgres ? 'JSONB' : 'TEXT';
const ts = isPostgres ? 'TIMESTAMPTZ' : 'DATETIME';
const now = isPostgres ? 'NOW()' : 'CURRENT_TIMESTAMP';

async function run() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ai_plans (
        id               ${pk},
        project_id       INTEGER,
        title            VARCHAR(255),
        status           VARCHAR(20)  NOT NULL DEFAULT 'draft',
        source           VARCHAR(20)  NOT NULL DEFAULT 'project',
        brief            TEXT,
        summary          TEXT,
        assumptions      ${json},
        questions        ${json},
        generator        VARCHAR(30),
        model            VARCHAR(80),
        prompt_version   VARCHAR(20),
        ai_available     BOOLEAN      NOT NULL DEFAULT FALSE,
        generation_ms    INTEGER,
        item_count       INTEGER      NOT NULL DEFAULT 0,
        accepted_count   INTEGER      NOT NULL DEFAULT 0,
        committed_count  INTEGER      NOT NULL DEFAULT 0,
        warnings         ${json},
        generated_by     INTEGER,
        generated_at     ${ts}        NOT NULL DEFAULT ${now},
        approved_by      INTEGER,
        approved_at      ${ts},
        committed_at     ${ts},
        rejected_reason  TEXT,
        raw_response     TEXT,
        created_at       ${ts}        NOT NULL DEFAULT ${now},
        updated_at       ${ts}        NOT NULL DEFAULT ${now}
      );
    `);

    await sequelize.query(`CREATE INDEX IF NOT EXISTS ai_plans_project_idx ON ai_plans (project_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS ai_plans_status_idx  ON ai_plans (status);`);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ai_plan_items (
        id                    ${pk},
        plan_id               INTEGER      NOT NULL,
        kind                  VARCHAR(30)  NOT NULL,
        sequence              INTEGER      NOT NULL DEFAULT 0,
        origin                VARCHAR(20)  NOT NULL DEFAULT 'ai',
        ref                   VARCHAR(60),
        title                 VARCHAR(255),
        payload               ${json}      NOT NULL,
        edited_payload        ${json},
        status                VARCHAR(20)  NOT NULL DEFAULT 'proposed',
        rejected_reason       TEXT,
        committed_entity_type VARCHAR(50),
        committed_entity_id   INTEGER,
        commit_error          TEXT,
        notes                 TEXT,
        created_at            ${ts}        NOT NULL DEFAULT ${now},
        updated_at            ${ts}        NOT NULL DEFAULT ${now}
      );
    `);

    await sequelize.query(`CREATE INDEX IF NOT EXISTS ai_plan_items_plan_idx   ON ai_plan_items (plan_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS ai_plan_items_kind_idx   ON ai_plan_items (kind);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS ai_plan_items_status_idx ON ai_plan_items (status);`);

    console.log('✅ ai_plans, ai_plan_items tables ready');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

run();
