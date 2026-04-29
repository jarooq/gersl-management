import sequelize from '../config/database.js';

// Run with: node server/src/migrations/create_cash_transactions.js
// Idempotent: ADD COLUMN IF NOT EXISTS + CREATE TABLE IF NOT EXISTS.
async function run() {
  try {
    // Extend cash_accounts with threshold + voucher counter columns.
    const alters = [
      `ALTER TABLE cash_accounts ADD COLUMN IF NOT EXISTS approval_thresholds  JSONB DEFAULT '[]'::jsonb;`,
      `ALTER TABLE cash_accounts ADD COLUMN IF NOT EXISTS receipt_required_over NUMERIC(15,2) DEFAULT 1000;`,
      `ALTER TABLE cash_accounts ADD COLUMN IF NOT EXISTS voucher_counter      INTEGER NOT NULL DEFAULT 0;`
    ];
    for (const s of alters) await sequelize.query(s);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS cash_transactions (
        id                       SERIAL PRIMARY KEY,
        cash_account_id          INTEGER NOT NULL REFERENCES cash_accounts(id) ON DELETE RESTRICT,
        transaction_type         VARCHAR(20) NOT NULL
                                 CHECK (transaction_type IN ('Receipt','Payment','Transfer','Adjustment','Reconciliation')),
        direction                VARCHAR(4) NOT NULL CHECK (direction IN ('In','Out')),
        amount                   NUMERIC(15,2) NOT NULL CHECK (amount >= 0),
        currency                 VARCHAR(8) NOT NULL DEFAULT 'LKR',
        balance_after            NUMERIC(15,2),
        voucher_no               VARCHAR(50),
        reference_type           VARCHAR(40),
        reference_id             INTEGER,
        counterparty_account_id  INTEGER REFERENCES cash_accounts(id),
        pair_id                  INTEGER REFERENCES cash_transactions(id),
        payee_name               VARCHAR(200),
        receipt_url              VARCHAR(1000),
        description              TEXT,
        category_id              INTEGER,
        project_id               INTEGER,
        status                   VARCHAR(20) NOT NULL DEFAULT 'Posted'
                                 CHECK (status IN ('Pending-Approval','Posted','Rejected','Reversed')),
        performed_by             INTEGER REFERENCES users(id),
        approved_by              INTEGER REFERENCES users(id),
        approved_at              TIMESTAMPTZ,
        rejection_reason         TEXT,
        reversed_by_id           INTEGER REFERENCES cash_transactions(id),
        occurred_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (cash_account_id, voucher_no)
      );
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS cash_tx_account_idx     ON cash_transactions (cash_account_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS cash_tx_type_idx        ON cash_transactions (transaction_type);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS cash_tx_status_idx      ON cash_transactions (status);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS cash_tx_voucher_idx     ON cash_transactions (voucher_no);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS cash_tx_occurred_idx    ON cash_transactions (occurred_at);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS cash_tx_reference_idx   ON cash_transactions (reference_type, reference_id);`);

    console.log('cash_transactions ready + cash_accounts extended');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
