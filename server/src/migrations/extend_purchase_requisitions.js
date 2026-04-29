import sequelize from '../config/database.js';

// Run with: node server/src/migrations/extend_purchase_requisitions.js
// Idempotent: each ADD COLUMN uses IF NOT EXISTS.
async function run() {
  const stmts = [
    `ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS estimated_amount       NUMERIC(15,2);`,
    `ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS currency               VARCHAR(8) DEFAULT 'LKR';`,
    `ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS project_id             INTEGER;`,
    `ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS task_id                INTEGER;`,
    `ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS procurement_method     VARCHAR(30);`,
    `ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS assigned_officer_id    INTEGER;`,
    `ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS assigned_at            TIMESTAMPTZ;`,
    `ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS assigned_by            INTEGER;`,
    `ALTER TABLE purchase_requisitions ADD COLUMN IF NOT EXISTS donor_compliance_check JSONB;`,
    `CREATE INDEX IF NOT EXISTS purchase_requisitions_status_idx           ON purchase_requisitions (status);`,
    `CREATE INDEX IF NOT EXISTS purchase_requisitions_assigned_officer_idx ON purchase_requisitions (assigned_officer_id);`,
    `CREATE INDEX IF NOT EXISTS purchase_requisitions_project_idx          ON purchase_requisitions (project_id);`
  ];
  try {
    for (const s of stmts) await sequelize.query(s);
    console.log('purchase_requisitions extended');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
