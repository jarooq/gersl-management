import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // Link to Project
  projectId: {
    type: DataTypes.INTEGER,
    field: 'project_id'
  },

  // Expense Information
  description: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'description'
  },
  category: {
    type: DataTypes.STRING(100),
    field: 'category'
  },

  // Financial
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'amount'
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'LKR',
    field: 'currency'
  },

  // Date
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'date'
  },

  // Status & Approval
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Paid'),
    defaultValue: 'Pending',
    field: 'status'
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    field: 'approved_by'
  },
  approvedDate: {
    type: DataTypes.DATEONLY,
    field: 'approved_date'
  },

  // Receipt & Documentation
  receiptNumber: {
    type: DataTypes.STRING(100),
    field: 'receipt_number'
  },
  attachmentUrl: {
    type: DataTypes.STRING(500),
    field: 'attachment_url'
  },

  // Vendor
  vendorName: {
    type: DataTypes.STRING(200),
    field: 'vendor_name'
  },

  // Notes
  notes: {
    type: DataTypes.TEXT,
    field: 'notes'
  }
}, {
  tableName: 'expenses',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['project_id'] },
    { fields: ['status'] },
    { fields: ['date'] }
  ]
});

export default Expense;
