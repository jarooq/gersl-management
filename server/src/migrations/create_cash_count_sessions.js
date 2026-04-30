import sequelize from '../config/database.js';

// Run with: node server/src/migrations/create_cash_count_sessions.js
// Idempotent.
async function run() {
  try {
    await sequelize.query(`ALTER TABLE cash_accounts ADD COLUMN IF NOT EXISTS count_variance_tolerance NUMERIC(15,2) DEFAULT 100;`);
    await sequelize.query(`ALTER TABLE cash_accounts ADD COLUMN IF NOT EXISTS last_count_at            TIMESTAMPTZ;`);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS cash_count_sessions (
        id                       SERIAL PRIMARY KEY,
        cash_account_id          INTEGER NOT NULL REFERENCES cash_accounts(id) ON DELETE CASCADE,
        expected_balance         NUMERIC(15,2) NOT NULL,
        counted_balance          NUMERIC(15,2),
        variance                 NUMERIC(15,2),
        denomination_breakdown   JSONB,
        status                   VARCHAR(20) NOT NULL DEFAULT 'Pending'
                                 CHECK (status IN ('Pending','Submitted','Approved','Disputed')),
        notes                    TEXT,
        counted_by               INTEGER REFERENCES users(id),
        witness_user_id          INTEGER REFERENCES users(id),
        approved_by              INTEGER REFERENCES users(id),
        approved_at              TIMESTAMPTZ,
        adjustment_tx_id         INTEGER REFERENCES cash_transactions(id),
        dispute_reason           TEXT,
        occurred_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS cash_count_account_idx  ON cash_count_sessions (cash_account_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS cash_count_status_idx   ON cash_count_sessions (status);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS cash_count_occurred_idx ON cash_count_sessions (occurred_at);`);

    console.log('cash_count_sessions ready');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
