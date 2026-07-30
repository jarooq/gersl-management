import sequelize from '../config/database.js';

// =============================================================================
// Drop the `_gerhr_migrations` idempotency ledger from the one-shot Firestore →
// Postgres migration. That migration is complete and the ledger has no more
// consumers (the migrate-gerhr scripts have been removed).
//
// Run: node server/src/migrations/drop_gerhr_migrations_ledger.js
// Idempotent — safe to re-run.
// =============================================================================

async function run() {
  try {
    await sequelize.query('DROP TABLE IF EXISTS _gerhr_migrations;');
    console.log('✅ Dropped _gerhr_migrations ledger.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

run();
