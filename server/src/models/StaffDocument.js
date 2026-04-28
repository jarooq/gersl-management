import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const StaffDocument = sequelize.define('StaffDocument', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // Employee Reference
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

  // Document Information
  documentName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'document_name'
  },
  documentType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'document_type'
    // Types: 'Employment Contract', 'ID Proof', 'Educational Certificate',
    // 'Medical Certificate', 'Background Check', 'Police Clearance', 'CV/Resume',
    // 'Tax Documents', 'Other'
  },

  // File Details
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'file_name'
    // Unique file name stored on disk
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
    // Full path to file
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
    // MIME type (e.g., application/pdf, image/jpeg)
  },

  // Document Status
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'Pending',
    field: 'status'
    // Status: 'Pending', 'Verified', 'Rejected', 'Expired'
  },
  verificationDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'verification_date'
  },
  verifiedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'verified_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  expiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'expiry_date'
  },

  // Additional Information
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  // Uploader
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'uploaded_by',
    references: {
      model: 'users',
      key: 'id'
    }
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
  tableName: 'staff_documents',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['document_type'] },
    { fields: ['status'] },
    { fields: ['verified_by'] },
    { fields: ['uploaded_by'] },
    { fields: ['expiry_date'] }
  ]
});

export default StaffDocument;
