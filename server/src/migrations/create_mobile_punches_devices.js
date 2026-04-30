import sequelize from '../config/database.js';

// Run with: node server/src/migrations/create_mobile_punches_devices.js
// Idempotent.
async function run() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS attendance_punches (
        id              SERIAL PRIMARY KEY,
        user_id         INTEGER NOT NULL REFERENCES users(id),
        punch_type      VARCHAR(10) NOT NULL CHECK (punch_type IN ('In','Out','BreakIn','BreakOut')),
        occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        latitude        NUMERIC(10,7),
        longitude       NUMERIC(10,7),
        accuracy_m      NUMERIC(8,2),
        selfie_url      VARCHAR(1000),
        device_id       VARCHAR(120),
        geofence_match  BOOLEAN NOT NULL DEFAULT FALSE,
        source          VARCHAR(20) NOT NULL DEFAULT 'mobile',
        notes           TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS punches_user_idx     ON attendance_punches (user_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS punches_type_idx     ON attendance_punches (punch_type);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS punches_occurred_idx ON attendance_punches (occurred_at);`);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS device_registrations (
        id            SERIAL PRIMARY KEY,
        user_id       INTEGER NOT NULL REFERENCES users(id),
        device_id     VARCHAR(120) NOT NULL,
        platform      VARCHAR(20),
        push_token    VARCHAR(500),
        app_version   VARCHAR(40),
        last_seen     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        is_active     BOOLEAN NOT NULL DEFAULT TRUE,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, device_id)
      );
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS devices_user_idx ON device_registrations (user_id);`);

    console.log('attendance_punches + device_registrations ready');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
