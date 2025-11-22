import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Approval = sequelize.define('Approval', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // Workflow Type
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'type'
    // PROPOSAL_SUBMISSION, PROJECT_ACTIVITY, FINANCE_EXPENSE, HR_LEAVE_REQUEST, etc.
  },

  // Status
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending',
    field: 'status'
    // pending, approved, rejected
  },

  // Entity Reference (what is being approved)
  entityType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'entity_type'
    // proposal, project, expense, leave_request, etc.
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'entity_id'
  },

  // Financial threshold (for expense approvals)
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    field: 'amount'
  },

  // Approval Chain
  currentLevel: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'current_level'
  },
  approvalChain: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'approval_chain'
    // [{level: 0, role: "Programme Manager", approverId: null, approvedAt: null, status: "pending", comments: ""}]
  },

  // History
  approvalHistory: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'approval_history'
    // [{level: 0, action: "approved", approverId: 1, approverName: "John Doe", timestamp: "2025-01-18", comments: ""}]
  },

  // Initiator
  initiatedBy: {
    type: DataTypes.INTEGER,
    field: 'initiated_by'
  },
  initiatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'initiated_at'
  },

  // Completion
  completedAt: {
    type: DataTypes.DATE,
    field: 'completed_at'
  },

  // Additional workflow data
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'metadata'
    // {proposalTitle: "", projectName: "", etc.}
  }
}, {
  tableName: 'approvals',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['entity_type', 'entity_id'] },
    { fields: ['initiated_by'] }
  ]
});

export default Approval;
