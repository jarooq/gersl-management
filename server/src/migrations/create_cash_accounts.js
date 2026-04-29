import sequelize from '../config/database.js';

// Run with: node server/src/migrations/create_cash_accounts.js
// Idempotent.
async function run() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS cash_accounts (
        id                          SERIAL PRIMARY KEY,
        type                        VARCHAR(20) NOT NULL DEFAULT 'CashBook'
                                    CHECK (type IN ('Locker','CashBook','PettyCash')),
        name                        VARCHAR(200) NOT NULL,
        location                    VARCHAR(200),
        custodian_user_id           INTEGER REFERENCES users(id),
        alt_custodian_user_id       INTEGER REFERENCES users(id),
        currency                    VARCHAR(8) NOT NULL DEFAULT 'LKR',
        imprest_limit               NUMERIC(15,2),
        reorder_point               NUMERIC(15,2),
        current_balance             NUMERIC(15,2) NOT NULL DEFAULT 0,
        opening_balance             NUMERIC(15,2) NOT NULL DEFAULT 0,
        opening_date                DATE,
        coa_account_id              INTEGER,
        restricted_to_project_id    INTEGER,
        is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
        notes                       TEXT,
        created_by                  INTEGER REFERENCES users(id),
        created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS cash_accounts_type_idx       ON cash_accounts (type);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS cash_accounts_custodian_idx  ON cash_accounts (custodian_user_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS cash_accounts_active_idx     ON cash_accounts (is_active);`);

    console.log('cash_accounts ready');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
