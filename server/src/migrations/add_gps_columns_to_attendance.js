import sequelize from '../config/database.js';

// =============================================================================
// GPS-based attendance support.
//
// Run with: node server/src/migrations/add_gps_columns_to_attendance.js
// Idempotent — safe to re-run.
//
// Adds latitude / longitude / distance / verification columns to the
// `attendance` table so a record created via a GPS check-in carries the
// captured coordinates.
// =============================================================================

async function run() {
  try {
    await sequelize.query(`
      ALTER TABLE attendance
        ADD COLUMN IF NOT EXISTS latitude             NUMERIC(10,7),
        ADD COLUMN IF NOT EXISTS longitude            NUMERIC(10,7),
        ADD COLUMN IF NOT EXISTS distance_from_office VARCHAR(50),
        ADD COLUMN IF NOT EXISTS gps_verified         BOOLEAN NOT NULL DEFAULT FALSE;
    `);
    console.log('✅ GPS columns added to attendance');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

run();
