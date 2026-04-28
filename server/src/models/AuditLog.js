import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  action: {
    type: DataTypes.ENUM('create', 'update', 'delete', 'restore'),
    allowNull: false
  },
  entityType: {
    type: DataTypes.STRING(80),
    allowNull: false,
    field: 'entity_type'
  },
  entityId: {
    type: DataTypes.STRING(80),
    allowNull: false,
    field: 'entity_id'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'user_id'
  },
  userRole: {
    type: DataTypes.STRING(80),
    allowNull: true,
    field: 'user_role'
  },
  ip: {
    type: DataTypes.STRING(64),
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'user_agent'
  },
  changedFields: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    field: 'changed_fields'
  },
  beforeValues: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'before_values'
  },
  afterValues: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'after_values'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Free-form context (route, reason, override flag, etc.)'
  },
  occurredAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'occurred_at'
  }
}, {
  tableName: 'audit_logs',
  timestamps: false,
  underscored: true,
  indexes: [
    { fields: ['entity_type', 'entity_id'] },
    { fields: ['user_id'] },
    { fields: ['occurred_at'] },
    { fields: ['action'] }
  ]
});

export default AuditLog;
