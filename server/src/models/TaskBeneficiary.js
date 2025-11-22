import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TaskBeneficiary = sequelize.define('TaskBeneficiary', {
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
    field: 'task_id'
  },

  beneficiaryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'beneficiary_id'
  },

  // ============================================
  // SELECTION PROCESS
  // ============================================

  selectionStatus: {
    type: DataTypes.ENUM(
      'Nominated',
      'Screened',
      'Verified',
      'Approved',
      'Rejected',
      'Waitlist'
    ),
    defaultValue: 'Nominated',
    field: 'selection_status'
  },

  selectionDate: {
    type: DataTypes.DATE,
    field: 'selection_date'
  },

  selectedBy: {
    type: DataTypes.INTEGER,
    field: 'selected_by'
  },

  selectionNotes: {
    type: DataTypes.TEXT,
    field: 'selection_notes'
  },

  // ============================================
  // DISTRIBUTION / RECEIPT (for distribution tasks)
  // ============================================

  receivedSupport: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'received_support'
  },

  receiptDate: {
    type: DataTypes.DATE,
    field: 'receipt_date'
  },

  receiptNumber: {
    type: DataTypes.STRING(100),
    field: 'receipt_number'
  },

  beneficiarySignature: {
    type: DataTypes.TEXT,
    field: 'beneficiary_signature'
  },

  verifiedBy: {
    type: DataTypes.INTEGER,
    field: 'verified_by'
  },

  verificationNotes: {
    type: DataTypes.TEXT,
    field: 'verification_notes'
  },

  // ============================================
  // TRAINING / ATTENDANCE (for training tasks)
  // ============================================

  attended: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'attended'
  },

  attendancePercentage: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'attendance_percentage'
  },

  attendanceDates: {
    type: DataTypes.JSONB,
    field: 'attendance_dates'
  },

  certificateIssued: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'certificate_issued'
  },

  certificateNumber: {
    type: DataTypes.STRING(100),
    field: 'certificate_number'
  },

  certificateIssuedDate: {
    type: DataTypes.DATEONLY,
    field: 'certificate_issued_date'
  },

  assessmentScore: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'assessment_score'
  },

  assessmentNotes: {
    type: DataTypes.TEXT,
    field: 'assessment_notes'
  },

  // ============================================
  // LINK TO SUPPORT RECORD
  // ============================================

  supportRecordId: {
    type: DataTypes.INTEGER,
    field: 'support_record_id'
  },

  // ============================================
  // ADDITIONAL DATA
  // ============================================

  metadata: {
    type: DataTypes.JSONB,
    field: 'metadata'
  },

  notes: {
    type: DataTypes.TEXT,
    field: 'notes'
  },

  // ============================================
  // AUDIT
  // ============================================

  createdBy: {
    type: DataTypes.INTEGER,
    field: 'created_by'
  }
}, {
  tableName: 'task_beneficiaries',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['task_id'] },
    { fields: ['beneficiary_id'] },
    { fields: ['selection_status'] },
    { fields: ['received_support'] },
    { fields: ['attended'] },
    { fields: ['support_record_id'] },
    { fields: ['selected_by'] },
    { fields: ['verified_by'] },
    { unique: true, fields: ['task_id', 'beneficiary_id'] }
  ]
});

export default TaskBeneficiary;
