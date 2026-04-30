import sequelize from '../config/database.js';

// Run with: node server/src/migrations/create_petty_cash_replenishments.js
// Idempotent.
async function run() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS petty_cash_replenishments (
        id                       SERIAL PRIMARY KEY,
        petty_cash_account_id    INTEGER NOT NULL REFERENCES cash_accounts(id) ON DELETE CASCADE,
        source_account_id        INTEGER REFERENCES cash_accounts(id),
        requested_amount         NUMERIC(15,2) NOT NULL,
        approved_amount          NUMERIC(15,2),
        currency                 VARCHAR(8) NOT NULL DEFAULT 'LKR',
        status                   VARCHAR(20) NOT NULL DEFAULT 'Requested'
                                 CHECK (status IN ('Requested','Approved','Rejected','Disbursed','Cancelled')),
        voucher_ids              INTEGER[] DEFAULT '{}',
        requested_by             INTEGER REFERENCES users(id),
        requested_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        approved_by              INTEGER REFERENCES users(id),
        approved_at              TIMESTAMPTZ,
        disbursed_by             INTEGER REFERENCES users(id),
        disbursed_at             TIMESTAMPTZ,
        disbursement_tx_id       INTEGER REFERENCES cash_transactions(id),
        rejection_reason         TEXT,
        notes                    TEXT,
        created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS pcr_petty_idx  ON petty_cash_replenishments (petty_cash_account_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS pcr_source_idx ON petty_cash_replenishments (source_account_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS pcr_status_idx ON petty_cash_replenishments (status);`);

    console.log('petty_cash_replenishments ready');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
