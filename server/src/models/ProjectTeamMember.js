import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * ProjectTeamMember Model
 * Manages staff assignments to projects with roles
 */
const ProjectTeamMember = sequelize.define('ProjectTeamMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'project_id',
    references: {
      model: 'projects',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  role: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Role of the team member in this project (e.g., Field Officer, Coordinator, M&E Officer)'
  },
  responsibilities: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Specific responsibilities for this team member on the project'
  },
  joinedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'joined_at'
  },
  leftAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'left_at',
    comment: 'Date when team member left the project (null if still active)'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'project_team_members',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['project_id'] },
    { fields: ['user_id'] },
    { fields: ['is_active'] },
    { fields: ['project_id', 'user_id'], unique: true, name: 'unique_project_user' }
  ]
});

export default ProjectTeamMember;
