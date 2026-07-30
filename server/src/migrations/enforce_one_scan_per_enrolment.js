import sequelize from '../config/database.js';

// =============================================================================
// Enforce one-scan-per-project-enrolment.
//
// Run with: node server/src/migrations/enforce_one_scan_per_enrolment.js
// Idempotent — safe to re-run.
//
// Why: a beneficiary enrolled in a project (e.g. "Ramadan Project — 500
// families, 1 food pack each") must receive aid for that project exactly
// once. The original schema allowed the same enrolment to be scanned at
// any number of distinct distribution events; this migration tightens the
// uniqueness to the enrolment itself.
//
// Steps:
//   1. SAFETY: refuse to run if any project_beneficiary already has 2+ scans.
//      Without this, ALTER INDEX would crash with a constraint violation
//      and leave the schema half-changed.
//   2. Drop the old composite unique index (event_id, project_beneficiary_id).
//   3. Create the new unique index on (project_beneficiary_id).
// =============================================================================

async function run() {
  try {
    // Safety check first.
    const [dups] = await sequelize.query(`
      SELECT project_beneficiary_id, COUNT(*) AS n
      FROM distribution_scans
      GROUP BY project_beneficiary_id
      HAVING COUNT(*) > 1
      LIMIT 5;
    `);
    if (dups.length > 0) {
      console.error('❌ Refusing to run: the following project_beneficiary_id rows already have multiple scans.');
      console.error('   Investigate and resolve manually before tightening the constraint:');
      for (const row of dups) {
        console.error(`     project_beneficiary_id=${row.project_beneficiary_id}  scans=${row.n}`);
      }
      console.error('   (Showing up to 5; rerun once these are cleaned up.)');
      process.exit(1);
    }

    // Drop the old composite unique index. PG accepts the index name from
    // the original migration ("distribution_scans_event_id_project_benefi_idx"
    // by default, but we may not know the exact name). Try both common
    // variants the original migration could have produced.
    await sequelize.query(`DROP INDEX IF EXISTS distribution_scans_event_id_project_beneficiary_id_uniq;`);
    await sequelize.query(`DROP INDEX IF EXISTS distribution_scans_event_id_project_benefi_idx;`);
    await sequelize.query(`DROP INDEX IF EXISTS distribution_scans_event_project_benef_idx;`);
    // Fallback: drop any unique constraint on the exact column pair, by name.
    // Sequelize's default for an `indexes: [{ unique, fields: [...] }]` is
    // table_field1_field2 — match a few possible spellings.

    // Add the new unique index. IF NOT EXISTS keeps the migration idempotent.
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS distribution_scans_project_beneficiary_uniq
        ON distribution_scans (project_beneficiary_id);
    `);

    console.log('✅ One-scan-per-enrolment constraint applied.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

run();
