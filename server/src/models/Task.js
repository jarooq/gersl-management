import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // Project Link
  projectId: {
    type: DataTypes.INTEGER,
    field: 'project_id'
  },

  // Task Information
  taskCode: {
    type: DataTypes.STRING(50),
    unique: true,
    field: 'task_code'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'title'
  },
  description: {
    type: DataTypes.TEXT,
    field: 'description'
  },

  // Assignment
  assignedTo: {
    type: DataTypes.INTEGER,
    field: 'assigned_to'
  },
  assignedBy: {
    type: DataTypes.INTEGER,
    field: 'assigned_by'
  },
  assignedAt: {
    type: DataTypes.DATE,
    field: 'assigned_at'
  },

  // Timeline
  dueDate: {
    type: DataTypes.DATEONLY,
    field: 'due_date'
  },
  startDate: {
    type: DataTypes.DATEONLY,
    field: 'start_date'
  },
  completionDate: {
    type: DataTypes.DATEONLY,
    field: 'completion_date'
  },

  // Status & Priority
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'Pending',
    field: 'status'
    // Pending, In Progress, Completed, On Hold, Cancelled
  },
  priority: {
    type: DataTypes.STRING(20),
    defaultValue: 'Medium',
    field: 'priority'
    // Low, Medium, High, Urgent
  },

  // Progress Tracking
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'progress'
    // 0-100
  },
  completionNotes: {
    type: DataTypes.TEXT,
    field: 'completion_notes'
  },

  // Dependencies
  dependsOn: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    defaultValue: [],
    field: 'depends_on'
    // Array of task IDs that must be completed first
  },
  blocks: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    defaultValue: [],
    field: 'blocks'
    // Array of task IDs that depend on this task
  },

  // Budget (if task has budget allocation)
  budgetAllocated: {
    type: DataTypes.DECIMAL(15, 2),
    field: 'budget_allocated'
  },
  budgetSpent: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    field: 'budget_spent'
  },

  // Deliverables
  deliverables: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'deliverables'
    // [{name: "Report", status: "pending", url: ""}]
  },

  // Approval (for tasks requiring approval)
  requiresApproval: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'requires_approval'
  },
  approvalStatus: {
    type: DataTypes.STRING(50),
    field: 'approval_status'
    // pending, approved, rejected
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    field: 'approved_by'
  },
  approvedAt: {
    type: DataTypes.DATE,
    field: 'approved_at'
  },

  // Audit
  createdBy: {
    type: DataTypes.INTEGER,
    field: 'created_by'
  },

  // ============================================
  // TASK TYPE & CLASSIFICATION
  // ============================================

  taskType: {
    type: DataTypes.ENUM(
      'Procurement',
      'Beneficiary Selection',
      'Mass Distribution',
      'Individual Distribution',
      'Meeting',
      'Construction',
      'Training',
      'Monitoring',
      'Administrative',
      'Other'
    ),
    defaultValue: 'Other',
    field: 'task_type'
  },

  taskCategory: {
    type: DataTypes.STRING(100),
    field: 'task_category'
  },

  // ============================================
  // PROCUREMENT FIELDS
  // ============================================

  requiresProcurement: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'requires_procurement'
  },

  procurementStatus: {
    type: DataTypes.ENUM(
      'Not Required',
      'Budget Requested',
      'Budget Approved',
      'Budget Rejected',
      'Quotations Pending',
      'Quotations Submitted',
      'Vendor Selected',
      'PO Issued',
      'Goods Received',
      'Completed'
    ),
    defaultValue: 'Not Required',
    field: 'procurement_status'
  },

  // ============================================
  // BUDGET REQUEST FIELDS
  // ============================================

  budgetRequestStatus: {
    type: DataTypes.STRING(50),
    field: 'budget_request_status'
  },

  budgetRequestedAmount: {
    type: DataTypes.DECIMAL(15, 2),
    field: 'budget_requested_amount'
  },

  budgetRequestedBy: {
    type: DataTypes.INTEGER,
    field: 'budget_requested_by'
  },

  budgetRequestedAt: {
    type: DataTypes.DATE,
    field: 'budget_requested_at'
  },

  budgetRequestNotes: {
    type: DataTypes.TEXT,
    field: 'budget_request_notes'
  },

  budgetApprovedBy: {
    type: DataTypes.INTEGER,
    field: 'budget_approved_by'
  },

  budgetApprovedAt: {
    type: DataTypes.DATE,
    field: 'budget_approved_at'
  },

  budgetApprovalNotes: {
    type: DataTypes.TEXT,
    field: 'budget_approval_notes'
  },

  budgetApprovalId: {
    type: DataTypes.INTEGER,
    field: 'budget_approval_id'
  },

  // ============================================
  // BENEFICIARY TRACKING
  // ============================================

  involvesBeneficiaries: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'involves_beneficiaries'
  },

  beneficiaryTrackingMode: {
    type: DataTypes.ENUM('None', 'Aggregate', 'Individual'),
    defaultValue: 'None',
    field: 'beneficiary_tracking_mode'
  },

  beneficiarySelectionMethod: {
    type: DataTypes.ENUM(
      'None',
      'Manual Selection',
      'Criteria Based',
      'Community Nomination',
      'Application Based',
      'Existing List'
    ),
    defaultValue: 'None',
    field: 'beneficiary_selection_method'
  },

  selectionCriteria: {
    type: DataTypes.JSONB,
    field: 'selection_criteria'
  },

  targetBeneficiaries: {
    type: DataTypes.INTEGER,
    field: 'target_beneficiaries'
  },

  actualBeneficiaries: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'actual_beneficiaries'
  },

  // ============================================
  // AGGREGATE DISTRIBUTION FIELDS
  // ============================================

  aggregateBeneficiaryCount: {
    type: DataTypes.INTEGER,
    field: 'aggregate_beneficiary_count'
  },

  aggregateBreakdown: {
    type: DataTypes.JSONB,
    field: 'aggregate_breakdown'
  },

  distributionEvidence: {
    type: DataTypes.JSONB,
    field: 'distribution_evidence'
  },

  // ============================================
  // DISTRIBUTION DETAILS
  // ============================================

  distributionType: {
    type: DataTypes.ENUM(
      'None',
      'Mass Distribution',
      'Individual',
      'Cash Transfer',
      'In-Kind',
      'Voucher'
    ),
    defaultValue: 'None',
    field: 'distribution_type'
  },

  distributionItems: {
    type: DataTypes.JSONB,
    field: 'distribution_items'
  },

  cashAmount: {
    type: DataTypes.DECIMAL(15, 2),
    field: 'cash_amount'
  },

  distributionDate: {
    type: DataTypes.DATEONLY,
    field: 'distribution_date'
  },

  distributionLocation: {
    type: DataTypes.STRING(255),
    field: 'distribution_location'
  },

  // ============================================
  // TRAINING FIELDS
  // ============================================

  trainingType: {
    type: DataTypes.STRING(100),
    field: 'training_type'
  },

  trainingDuration: {
    type: DataTypes.INTEGER,
    field: 'training_duration'
  },

  certificateProvided: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'certificate_provided'
  },

  // ============================================
  // MEDIA TEAM
  // ============================================

  mediaTeamAssigned: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    defaultValue: [],
    field: 'media_team_assigned'
  },

  mediaCoverageRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'media_coverage_required'
  },

  mediaCoverageType: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    field: 'media_coverage_type'
  },

  mediaCoverageStatus: {
    type: DataTypes.ENUM('Not Required', 'Pending', 'In Progress', 'Completed'),
    defaultValue: 'Not Required',
    field: 'media_coverage_status'
  },

  mediaCoverageCompletedAt: {
    type: DataTypes.DATE,
    field: 'media_coverage_completed_at'
  },

  mediaCoverageNotes: {
    type: DataTypes.TEXT,
    field: 'media_coverage_notes'
  }
}, {
  tableName: 'tasks',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['project_id'] },
    { fields: ['assigned_to'] },
    { fields: ['status'] },
    { fields: ['due_date'] },
    { fields: ['priority'] },
    { fields: ['task_type'] },
    { fields: ['procurement_status'] },
    { fields: ['involves_beneficiaries'] },
    { fields: ['beneficiary_tracking_mode'] },
    { fields: ['distribution_date'] }
  ]
});

export default Task;
