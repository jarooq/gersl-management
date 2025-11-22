import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TaskAttachment = sequelize.define('TaskAttachment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // Task Reference
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

  // Uploader
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'uploaded_by',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },

  // File Information
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'file_name'
    // Unique file name stored on disk (with hash/timestamp)
  },
  originalName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'original_name'
    // Original filename uploaded by user
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'file_path'
    // Full path to file (relative or absolute)
  },
  fileSize: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'file_size'
    // File size in bytes
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'mime_type'
    // MIME type (e.g., image/jpeg, application/pdf)
  },

  // Categorization
  fileCategory: {
    type: DataTypes.STRING(50),
    field: 'file_category'
    // document, image, video, evidence, other
  },

  // Optional Description
  description: {
    type: DataTypes.TEXT,
    field: 'description'
  },

  // Timestamps
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'task_attachments',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['task_id'] },
    { fields: ['uploaded_by'] },
    { fields: ['created_at'] }
  ]
});

export default TaskAttachment;
