import sequelize from '../config/database.js';

// Run with: node server/src/migrations/add_procurement_roles.js
// Postgres ENUMs need ALTER TYPE ... ADD VALUE; this is idempotent via IF NOT EXISTS.
// Sequelize names the enum "enum_<table>_<column>" by default → enum_users_role.
async function run() {
  try {
    await sequelize.query(
      `ALTER TYPE enum_users_role ADD VALUE IF NOT EXISTS 'Procurement Manager';`
    );
    await sequelize.query(
      `ALTER TYPE enum_users_role ADD VALUE IF NOT EXISTS 'Procurement Officer';`
    );
    console.log('Procurement roles added to enum_users_role');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
