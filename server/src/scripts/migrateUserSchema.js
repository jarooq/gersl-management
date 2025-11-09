import sequelize from '../config/database.js';
import User from '../models/User.js';

/**
 * Migrate User table to add new columns for RBAC hierarchy
 */

async function migrateUserSchema() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    console.log('Adding new columns to users table...');

    // Use alter to add new columns
    await User.sync({ alter: true });

    console.log('\n✓ User table schema updated successfully!');
    console.log('New columns added:');
    console.log('  - hierarchy_level (INTEGER)');
    console.log('  - specialization (VARCHAR)');
    console.log('  - reporting_to (INTEGER)');
    console.log('\nDatabase is now ready for RBAC hierarchy.');

  } catch (error) {
    console.error('Error migrating schema:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrateUserSchema();
