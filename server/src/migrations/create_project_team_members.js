import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

/**
 * Migration: Create project_team_members table
 * Enables assigning multiple staff members to projects with specific roles
 */

const createProjectTeamMembers = async () => {
  try {
    console.log('🔄 Starting migration: Create project_team_members table...');

    // Create project_team_members table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS project_team_members (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(100),
        responsibilities TEXT,
        joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        left_at TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_project_user UNIQUE (project_id, user_id)
      );
    `, { type: QueryTypes.RAW });

    console.log('✅ Created project_team_members table');

    // Create indexes for better query performance
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_project_team_project_id
      ON project_team_members(project_id);
    `, { type: QueryTypes.RAW });

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_project_team_user_id
      ON project_team_members(user_id);
    `, { type: QueryTypes.RAW });

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_project_team_is_active
      ON project_team_members(is_active);
    `, { type: QueryTypes.RAW });

    console.log('✅ Created indexes on project_team_members table');

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createProjectTeamMembers()
    .then(() => {
      console.log('✅ All migrations completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export default createProjectTeamMembers;
