import sequelize from '../config/database.js';

// =============================================================================
// Drop the `payables` and `generated_orphan_reports` tables.
//
// Run: node server/src/migrations/drop_payables_and_generated_orphan_reports.js
// Idempotent — safe to re-run.
//
// Why: both tables' models had zero call sites in the whole codebase
// (controllers, services, routes, middleware, utils, scripts, mobile).
//   • payables — the Payable model + route + controller had no UI consumers.
//     Accounts-payable UX uses the Bill model. FinancePage's "Accounts
//     Payable" number is computed from Bills.
//   • generated_orphan_reports — the model was never queried anywhere and had
//     no routes; presumably an early sketch that was superseded by the
//     regular Report model + report.controller.js.
// =============================================================================

async function run() {
  try {
    await sequelize.query('DROP TABLE IF EXISTS payables CASCADE;');
    console.log('✅ Dropped payables.');
    await sequelize.query('DROP TABLE IF EXISTS generated_orphan_reports CASCADE;');
    console.log('✅ Dropped generated_orphan_reports.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

run();
