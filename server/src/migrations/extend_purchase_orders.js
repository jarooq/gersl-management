import sequelize from '../config/database.js';

// Run with: node server/src/migrations/extend_purchase_orders.js
// Idempotent: ADD COLUMN IF NOT EXISTS + CREATE TABLE IF NOT EXISTS.
async function run() {
  const stmts = [
    // New procurement-chain links
    `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS requisition_id   INTEGER;`,
    `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS bid_analysis_id  INTEGER;`,
    `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_id        INTEGER;`,
    `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS quotation_id     INTEGER;`,
    `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS donor_id         INTEGER;`,
    // Money + terms
    `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS subtotal         NUMERIC(15,2);`,
    `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tax              NUMERIC(15,2) DEFAULT 0;`,
    `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_terms    VARCHAR(255);`,
    `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS delivery_date    DATE;`,
    // Issuance + lifecycle
    `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS approval_notes   TEXT;`,
    `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS issued_at        TIMESTAMPTZ;`,
    `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS issued_by        INTEGER;`,
    `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS signed_pdf_url   VARCHAR(1000);`,
    `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS acknowledged_at  TIMESTAMPTZ;`,
    `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS cancel_reason    TEXT;`,
    // Indexes
    `CREATE INDEX IF NOT EXISTS po_status_idx        ON purchase_orders (status);`,
    `CREATE INDEX IF NOT EXISTS po_vendor_idx        ON purchase_orders (vendor_id);`,
    `CREATE INDEX IF NOT EXISTS po_requisition_idx   ON purchase_orders (requisition_id);`,
    `CREATE INDEX IF NOT EXISTS po_bid_analysis_idx  ON purchase_orders (bid_analysis_id);`
  ];

  try {
    for (const s of stmts) await sequelize.query(s);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS po_lines (
        id                SERIAL PRIMARY KEY,
        po_id             INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
        item_description  VARCHAR(500) NOT NULL,
        qty               NUMERIC(15,2) NOT NULL DEFAULT 1,
        unit              VARCHAR(40),
        unit_price        NUMERIC(15,2) NOT NULL,
        line_total        NUMERIC(15,2),
        gl_account_id     INTEGER,
        project_id        INTEGER,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS po_lines_po_idx ON po_lines (po_id);`);

    console.log('purchase_orders extended + po_lines ready');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
