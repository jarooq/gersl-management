import sequelize from '../config/database.js';

// Run with: node server/src/migrations/extend_vendors_thresholds.js
// Idempotent.
async function run() {
  try {
    const vendorStmts = [
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vendor_code                  VARCHAR(50);`,
      `CREATE UNIQUE INDEX IF NOT EXISTS vendors_vendor_code_uk ON vendors (vendor_code) WHERE vendor_code IS NOT NULL;`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS district                     VARCHAR(100);`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS country                      VARCHAR(100) DEFAULT 'Sri Lanka';`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vat_no                       VARCHAR(50);`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS registration_no              VARCHAR(80);`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_account_name            VARCHAR(200);`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_name                    VARCHAR(200);`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS branch                       VARCHAR(200);`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS account_no                   VARCHAR(80);`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS swift                        VARCHAR(40);`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS categories                   TEXT[] DEFAULT '{}';`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS rating                       NUMERIC(3,2);`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS due_diligence_status         VARCHAR(20) DEFAULT 'Pending';`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS due_diligence_checked_by     INTEGER;`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS due_diligence_checked_at     TIMESTAMPTZ;`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS due_diligence_notes          TEXT;`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS tax_certificate_url          VARCHAR(1000);`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS registration_certificate_url VARCHAR(1000);`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS other_docs                   JSONB DEFAULT '[]'::jsonb;`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS blacklist_reason             TEXT;`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS blacklisted_by               INTEGER;`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS blacklisted_at               TIMESTAMPTZ;`,
      `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS related_user_ids             INTEGER[] DEFAULT '{}';`,
      `CREATE INDEX IF NOT EXISTS vendors_status_idx       ON vendors (status);`,
      `CREATE INDEX IF NOT EXISTS vendors_dd_status_idx    ON vendors (due_diligence_status);`,
      `CREATE INDEX IF NOT EXISTS vendors_vendor_name_idx  ON vendors (vendor_name);`
    ];
    for (const s of vendorStmts) await sequelize.query(s);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS procurement_thresholds (
        id                  SERIAL PRIMARY KEY,
        scope_type          VARCHAR(20) NOT NULL DEFAULT 'global',
        scope_id            INTEGER,
        min_amount          NUMERIC(15,2) NOT NULL DEFAULT 0,
        max_amount          NUMERIC(15,2),
        currency            VARCHAR(8) DEFAULT 'LKR',
        required_method     VARCHAR(30),
        approver_role       VARCHAR(80),
        requires_committee  BOOLEAN NOT NULL DEFAULT FALSE,
        effective_from      DATE,
        effective_to        DATE,
        notes               TEXT,
        created_by          INTEGER REFERENCES users(id),
        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS pt_scope_idx  ON procurement_thresholds (scope_type, scope_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS pt_amount_idx ON procurement_thresholds (min_amount, max_amount);`);

    console.log('vendors extended + procurement_thresholds ready');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
