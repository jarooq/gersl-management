import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * TaskAssignee Model
 * Junction table to support multiple staff members assigned to a single task
 */
const TaskAssignee = sequelize.define('TaskAssignee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // ============================================
  // LINKS
  // ============================================

  taskId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'task_id',
    references: {
      model: 'tasks',
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

  // ============================================
  // ASSIGNMENT DETAILS
  // ============================================

  role: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'role',
    comment: 'Role/responsibility of this assignee (e.g., "Lead", "Support", "Reviewer")'
  },

  assignedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'assigned_by',
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who assigned this person to the task'
  },

  assignedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'assigned_at'
  },

  // ============================================
  // STATUS TRACKING
  // ============================================

  status: {
    type: DataTypes.ENUM('Pending', 'Accepted', 'In Progress', 'Completed', 'Declined'),
    defaultValue: 'Pending',
    field: 'status',
    comment: 'Status of this assignee\'s work on the task'
  },

  acceptedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'accepted_at'
  },

  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at'
  },

  // ============================================
  // PROGRESS
  // ============================================

  individualProgress: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: 'individual_progress',
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Individual progress percentage for this assignee (0-100)'
  },

  hoursSpent: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    field: 'hours_spent',
    comment: 'Hours spent by this assignee on the task'
  },

  // ============================================
  // NOTIFICATIONS
  // ============================================

  notificationSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'notification_sent'
  },

  lastNotifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_notified_at'
  },

  // ============================================
  // ADDITIONAL DATA
  // ============================================

  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'notes',
    comment: 'Additional notes about this assignment'
  },

  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'metadata',
    comment: 'Additional structured data for this assignment'
  }
}, {
  tableName: 'task_assignees',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['task_id'] },
    { fields: ['user_id'] },
    { fields: ['assigned_by'] },
    { fields: ['status'] },
    { fields: ['assigned_at'] },
    { fields: ['completed_at'] },
    // Prevent duplicate assignments
    { unique: true, fields: ['task_id', 'user_id'] }
  ]
});

export default TaskAssignee;
