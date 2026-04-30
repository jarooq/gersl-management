import sequelize from '../config/database.js';

// Run with: node server/src/migrations/create_attendance_corrections.js
// Idempotent.
async function run() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS attendance_corrections (
        id                SERIAL PRIMARY KEY,
        attendance_id     INTEGER REFERENCES attendance(id) ON DELETE CASCADE,
        staff_id          INTEGER NOT NULL REFERENCES staff(id),
        attendance_date   DATE NOT NULL,
        field             VARCHAR(40) NOT NULL,
        old_value         VARCHAR(255),
        new_value         VARCHAR(255),
        reason            TEXT NOT NULL,
        status            VARCHAR(20) NOT NULL DEFAULT 'Pending'
                          CHECK (status IN ('Pending','Approved','Rejected','Cancelled')),
        requested_by      INTEGER REFERENCES users(id),
        requested_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        reviewed_by       INTEGER REFERENCES users(id),
        reviewed_at       TIMESTAMPTZ,
        rejection_reason  TEXT,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS atc_attendance_idx ON attendance_corrections (attendance_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS atc_staff_idx      ON attendance_corrections (staff_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS atc_status_idx     ON attendance_corrections (status);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS atc_date_idx       ON attendance_corrections (attendance_date);`);

    console.log('attendance_corrections ready');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
