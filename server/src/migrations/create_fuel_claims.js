import sequelize from '../config/database.js';

// Run with: node server/src/migrations/create_fuel_claims.js
// Idempotent.
async function run() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS fuel_rates (
        id              SERIAL PRIMARY KEY,
        vehicle_type    VARCHAR(20) NOT NULL,
        rate_per_km     NUMERIC(10,4) NOT NULL,
        currency        VARCHAR(8) NOT NULL DEFAULT 'LKR',
        effective_from  DATE NOT NULL,
        effective_to    DATE,
        notes           TEXT,
        created_by      INTEGER REFERENCES users(id),
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS fuel_rates_type_idx       ON fuel_rates (vehicle_type);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS fuel_rates_effective_idx  ON fuel_rates (effective_from, effective_to);`);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS fuel_claims (
        id                   SERIAL PRIMARY KEY,
        user_id              INTEGER NOT NULL REFERENCES users(id),
        movement_id          INTEGER NOT NULL REFERENCES movement_log(id) ON DELETE CASCADE,
        vehicle_id           INTEGER REFERENCES vehicles(id),
        vehicle_type         VARCHAR(20),
        distance_km          NUMERIC(10,2),
        rate_per_km          NUMERIC(10,4),
        fuel_rate_id         INTEGER REFERENCES fuel_rates(id),
        currency             VARCHAR(8) NOT NULL DEFAULT 'LKR',
        gross_amount         NUMERIC(15,2),
        lunch_deduction      NUMERIC(15,2) DEFAULT 0,
        net_amount           NUMERIC(15,2),
        bypass_lunch_reason  TEXT,
        status               VARCHAR(20) NOT NULL DEFAULT 'Draft'
                             CHECK (status IN ('Draft','Submitted','Approved','Rejected','Paid','Merged','Cancelled')),
        approved_by          INTEGER REFERENCES users(id),
        approved_at          TIMESTAMPTZ,
        rejection_reason     TEXT,
        primary_claim_id     INTEGER REFERENCES fuel_claims(id),
        paid_with_bill_id    INTEGER,
        paid_with_cash_tx_id INTEGER,
        paid_at              TIMESTAMPTZ,
        notes                TEXT,
        created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (movement_id)
      );
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS fuel_claims_user_idx     ON fuel_claims (user_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS fuel_claims_status_idx   ON fuel_claims (status);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS fuel_claims_primary_idx  ON fuel_claims (primary_claim_id);`);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS fuel_claim_passengers (
        id                     SERIAL PRIMARY KEY,
        fuel_claim_id          INTEGER NOT NULL REFERENCES fuel_claims(id) ON DELETE CASCADE,
        passenger_user_id      INTEGER NOT NULL REFERENCES users(id),
        passenger_movement_id  INTEGER REFERENCES movement_log(id),
        share_pct              NUMERIC(5,2) DEFAULT 0,
        created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS fcp_claim_idx     ON fuel_claim_passengers (fuel_claim_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS fcp_passenger_idx ON fuel_claim_passengers (passenger_user_id);`);

    console.log('fuel_rates + fuel_claims + fuel_claim_passengers ready');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
