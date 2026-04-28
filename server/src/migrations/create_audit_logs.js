import sequelize from '../config/database.js';

// Run with: node server/src/migrations/create_audit_logs.js
// Idempotent: uses CREATE TABLE IF NOT EXISTS.
async function run() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id              BIGSERIAL PRIMARY KEY,
        action          VARCHAR(20) NOT NULL CHECK (action IN ('create','update','delete','restore')),
        entity_type     VARCHAR(80) NOT NULL,
        entity_id       VARCHAR(80) NOT NULL,
        user_id         INTEGER,
        user_role       VARCHAR(80),
        ip              VARCHAR(64),
        user_agent      VARCHAR(500),
        changed_fields  TEXT[],
        before_values   JSONB,
        after_values    JSONB,
        metadata        JSONB,
        occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs (entity_type, entity_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS audit_logs_user_idx   ON audit_logs (user_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS audit_logs_time_idx   ON audit_logs (occurred_at);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs (action);`);
    console.log('audit_logs table ready');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
