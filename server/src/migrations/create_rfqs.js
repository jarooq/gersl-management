import sequelize from '../config/database.js';

// Run with: node server/src/migrations/create_rfqs.js
// Idempotent: CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS.
async function run() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS rfqs (
        id                  SERIAL PRIMARY KEY,
        rfq_number          VARCHAR(50) UNIQUE,
        requisition_id      INTEGER NOT NULL REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
        scope_of_work       TEXT,
        closing_date        TIMESTAMPTZ,
        terms_of_delivery   TEXT,
        payment_terms       VARCHAR(255),
        attachments         JSONB DEFAULT '[]'::jsonb,
        status              VARCHAR(20) NOT NULL DEFAULT 'Draft',
        sent_at             TIMESTAMPTZ,
        sent_by             INTEGER REFERENCES users(id),
        closed_at           TIMESTAMPTZ,
        cancel_reason       TEXT,
        created_by          INTEGER REFERENCES users(id),
        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS rfqs_requisition_idx  ON rfqs (requisition_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS rfqs_status_idx       ON rfqs (status);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS rfqs_closing_date_idx ON rfqs (closing_date);`);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS rfq_vendors (
        id                    SERIAL PRIMARY KEY,
        rfq_id                INTEGER NOT NULL REFERENCES rfqs(id)    ON DELETE CASCADE,
        vendor_id             INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
        invited_at            TIMESTAMPTZ,
        sent_at               TIMESTAMPTZ,
        response_received_at  TIMESTAMPTZ,
        declined              BOOLEAN NOT NULL DEFAULT FALSE,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (rfq_id, vendor_id)
      );
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS rfq_vendors_rfq_idx    ON rfq_vendors (rfq_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS rfq_vendors_vendor_idx ON rfq_vendors (vendor_id);`);

    console.log('rfqs + rfq_vendors ready');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
