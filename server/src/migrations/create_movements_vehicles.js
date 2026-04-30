import sequelize from '../config/database.js';

// Run with: node server/src/migrations/create_movements_vehicles.js
// Idempotent.
async function run() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id                    SERIAL PRIMARY KEY,
        type                  VARCHAR(20) NOT NULL DEFAULT 'Bike',
        plate_no              VARCHAR(40),
        owner_user_id         INTEGER REFERENCES users(id),
        is_personal           BOOLEAN NOT NULL DEFAULT TRUE,
        fuel_efficiency_kmpl  NUMERIC(5,2),
        is_active             BOOLEAN NOT NULL DEFAULT TRUE,
        notes                 TEXT,
        created_by            INTEGER REFERENCES users(id),
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await sequelize.query(`CREATE UNIQUE INDEX IF NOT EXISTS vehicles_plate_uk ON vehicles (plate_no) WHERE plate_no IS NOT NULL;`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS vehicles_type_idx        ON vehicles (type);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS vehicles_owner_idx       ON vehicles (owner_user_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS vehicles_active_idx      ON vehicles (is_active);`);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS movement_log (
        id                     SERIAL PRIMARY KEY,
        user_id                INTEGER NOT NULL REFERENCES users(id),
        vehicle_id             INTEGER REFERENCES vehicles(id),
        project_id             INTEGER,
        task_id                INTEGER,
        from_location          VARCHAR(255) NOT NULL,
        to_location            VARCHAR(255) NOT NULL,
        purpose                TEXT,
        status                 VARCHAR(20) NOT NULL DEFAULT 'Planned'
                               CHECK (status IN ('Planned','Approved','InMovement','Arrived','Returned','Cancelled','Rejected')),
        planned_departure_at   TIMESTAMPTZ,
        planned_return_at      TIMESTAMPTZ,
        departure_at           TIMESTAMPTZ,
        arrival_at             TIMESTAMPTZ,
        return_at              TIMESTAMPTZ,
        distance_km            NUMERIC(10,2),
        approved_by            INTEGER REFERENCES users(id),
        approved_at            TIMESTAMPTZ,
        rejection_reason       TEXT,
        cancel_reason          TEXT,
        gps_track              JSONB DEFAULT '[]'::jsonb,
        is_passenger           BOOLEAN NOT NULL DEFAULT FALSE,
        primary_movement_id    INTEGER REFERENCES movement_log(id),
        notes                  TEXT,
        created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS movement_user_idx      ON movement_log (user_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS movement_status_idx    ON movement_log (status);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS movement_project_idx   ON movement_log (project_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS movement_departure_idx ON movement_log (departure_at);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS movement_vehicle_idx   ON movement_log (vehicle_id);`);

    console.log('vehicles + movement_log ready');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
