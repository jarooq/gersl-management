import sequelize from '../config/database.js';

// Run with:
//   node server/src/migrations/create_quotations_bid_analyses.js
// Idempotent: CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS.
async function run() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS quotations (
        id                          SERIAL PRIMARY KEY,
        rfq_id                      INTEGER NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
        vendor_id                   INTEGER NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
        total_amount                NUMERIC(15,2) NOT NULL,
        currency                    VARCHAR(8) NOT NULL DEFAULT 'LKR',
        delivery_days               INTEGER,
        validity_days               INTEGER,
        payment_terms               VARCHAR(255),
        technical_compliance_score  NUMERIC(5,2),
        attachments                 JSONB DEFAULT '[]'::jsonb,
        notes                       TEXT,
        received_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        recorded_by                 INTEGER REFERENCES users(id),
        is_locked                   BOOLEAN NOT NULL DEFAULT FALSE,
        created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (rfq_id, vendor_id)
      );
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS quotations_rfq_idx    ON quotations (rfq_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS quotations_vendor_idx ON quotations (vendor_id);`);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS quotation_lines (
        id                SERIAL PRIMARY KEY,
        quotation_id      INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
        item_description  VARCHAR(500) NOT NULL,
        qty               NUMERIC(15,2) NOT NULL DEFAULT 1,
        unit              VARCHAR(40),
        unit_price        NUMERIC(15,2) NOT NULL,
        line_total        NUMERIC(15,2),
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS quotation_lines_quotation_idx ON quotation_lines (quotation_id);`);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS bid_analyses (
        id                     SERIAL PRIMARY KEY,
        requisition_id         INTEGER NOT NULL REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
        rfq_id                 INTEGER REFERENCES rfqs(id) ON DELETE SET NULL,
        scoring_criteria       JSONB,
        recommended_vendor_id  INTEGER REFERENCES vendors(id),
        rationale              TEXT,
        status                 VARCHAR(20) NOT NULL DEFAULT 'Draft',
        prepared_by            INTEGER REFERENCES users(id),
        submitted_at           TIMESTAMPTZ,
        reviewed_by            INTEGER REFERENCES users(id),
        approved_by            INTEGER REFERENCES users(id),
        approved_at            TIMESTAMPTZ,
        rejection_reason       TEXT,
        created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS bid_analyses_requisition_idx ON bid_analyses (requisition_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS bid_analyses_rfq_idx         ON bid_analyses (rfq_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS bid_analyses_status_idx      ON bid_analyses (status);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS bid_analyses_recommended_idx ON bid_analyses (recommended_vendor_id);`);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS bid_analysis_scores (
        id                SERIAL PRIMARY KEY,
        bid_analysis_id   INTEGER NOT NULL REFERENCES bid_analyses(id) ON DELETE CASCADE,
        vendor_id         INTEGER NOT NULL REFERENCES vendors(id),
        quotation_id      INTEGER REFERENCES quotations(id) ON DELETE SET NULL,
        criterion_key     VARCHAR(50) NOT NULL,
        raw_score         NUMERIC(6,2) NOT NULL,
        weighted_score    NUMERIC(7,3),
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (bid_analysis_id, vendor_id, criterion_key)
      );
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS bid_analysis_scores_ba_idx     ON bid_analysis_scores (bid_analysis_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS bid_analysis_scores_vendor_idx ON bid_analysis_scores (vendor_id);`);

    console.log('quotations + quotation_lines + bid_analyses + bid_analysis_scores ready');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
