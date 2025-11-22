import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // User Assignment
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },

  // Notification Content
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'type'
    // approval_request, task_assigned, deadline_reminder, project_update, etc.
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'title'
  },
  message: {
    type: DataTypes.TEXT,
    field: 'message'
  },

  // Related Entity (optional)
  relatedEntityType: {
    type: DataTypes.STRING(50),
    field: 'related_entity_type'
    // project, proposal, task, expense, approval
  },
  relatedEntityId: {
    type: DataTypes.INTEGER,
    field: 'related_entity_id'
  },

  // Priority & Category
  priority: {
    type: DataTypes.STRING(20),
    defaultValue: 'Medium',
    field: 'priority'
    // Low, Medium, High, Urgent
  },
  category: {
    type: DataTypes.STRING(50),
    field: 'category'
    // workflow, deadline, approval, assignment, update
  },

  // Read Status
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'read'
  },
  readAt: {
    type: DataTypes.DATE,
    field: 'read_at'
  },

  // Action Link (URL to navigate to when clicked)
  actionUrl: {
    type: DataTypes.STRING(500),
    field: 'action_url'
  },
  actionLabel: {
    type: DataTypes.STRING(100),
    field: 'action_label'
  },

  // Delivery Status
  deliveryMethod: {
    type: DataTypes.STRING(50),
    defaultValue: 'in_app',
    field: 'delivery_method'
    // in_app, email, sms, push
  },
  deliveredAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'delivered_at'
  },

  // Expiry
  expiresAt: {
    type: DataTypes.DATE,
    field: 'expires_at'
    // Auto-delete notifications after expiry
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false, // notifications table doesn't have updated_at column
  indexes: [
    { fields: ['user_id'] },
    { fields: ['read'] },
    { fields: ['type'] },
    { fields: ['created_at'] },
    { fields: ['related_entity_type', 'related_entity_id'] }
  ]
});

export default Notification;
