import sequelize from '../config/database.js';

// Run with: node server/src/migrations/create_grn_three_way_match.js
// Idempotent.
async function run() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS goods_receipt_notes (
        id                SERIAL PRIMARY KEY,
        grn_number        VARCHAR(50) UNIQUE,
        po_id             INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
        delivery_note_no  VARCHAR(80),
        delivery_note_url VARCHAR(1000),
        photos            JSONB DEFAULT '[]'::jsonb,
        received_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        received_by       INTEGER REFERENCES users(id),
        location          VARCHAR(255),
        condition_notes   TEXT,
        status            VARCHAR(20) NOT NULL DEFAULT 'Draft',
        verified_by       INTEGER REFERENCES users(id),
        verified_at       TIMESTAMPTZ,
        rejection_reason  TEXT,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS grns_po_idx     ON goods_receipt_notes (po_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS grns_status_idx ON goods_receipt_notes (status);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS grns_receiver_idx ON goods_receipt_notes (received_by);`);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS grn_lines (
        id                SERIAL PRIMARY KEY,
        grn_id            INTEGER NOT NULL REFERENCES goods_receipt_notes(id) ON DELETE CASCADE,
        po_line_id        INTEGER REFERENCES po_lines(id) ON DELETE SET NULL,
        item_description  VARCHAR(500),
        qty_received      NUMERIC(15,2) NOT NULL DEFAULT 0,
        qty_accepted      NUMERIC(15,2) NOT NULL DEFAULT 0,
        qty_rejected      NUMERIC(15,2) NOT NULL DEFAULT 0,
        rejection_reason  TEXT,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS grn_lines_grn_idx     ON grn_lines (grn_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS grn_lines_po_line_idx ON grn_lines (po_line_id);`);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS three_way_matches (
        id               SERIAL PRIMARY KEY,
        po_id            INTEGER NOT NULL REFERENCES purchase_orders(id),
        grn_id           INTEGER NOT NULL REFERENCES goods_receipt_notes(id),
        invoice_id       INTEGER,
        qty_match        BOOLEAN NOT NULL DEFAULT FALSE,
        price_match      BOOLEAN NOT NULL DEFAULT FALSE,
        vendor_match     BOOLEAN NOT NULL DEFAULT FALSE,
        variance_amount  NUMERIC(15,2),
        variance_reason  TEXT,
        status           VARCHAR(20) NOT NULL DEFAULT 'Pending',
        override_reason  TEXT,
        matched_by       INTEGER REFERENCES users(id),
        matched_at       TIMESTAMPTZ,
        resolved_by      INTEGER REFERENCES users(id),
        resolved_at      TIMESTAMPTZ,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS twm_po_idx     ON three_way_matches (po_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS twm_grn_idx    ON three_way_matches (grn_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS twm_invoice_idx ON three_way_matches (invoice_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS twm_status_idx ON three_way_matches (status);`);

    console.log('goods_receipt_notes + grn_lines + three_way_matches ready');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
