import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

/**
 * Migration: Add department field to proposals table
 * This enables department-based proposal filtering for Project Officers
 */

const addDepartmentToProposals = async () => {
  try {
    console.log('🔄 Starting migration: Add department to proposals...');

    // Add department column
    await sequelize.query(`
      ALTER TABLE proposals
      ADD COLUMN IF NOT EXISTS department VARCHAR(100);
    `, { type: QueryTypes.RAW });

    console.log('✅ Added department column to proposals table');

    // Create index for better query performance
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_proposals_department
      ON proposals(department);
    `, { type: QueryTypes.RAW });

    console.log('✅ Created index on department column');

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addDepartmentToProposals()
    .then(() => {
      console.log('✅ All migrations completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export default addDepartmentToProposals;
