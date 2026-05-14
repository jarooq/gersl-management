import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Proposal = sequelize.define('Proposal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // Basic Information
  proposalCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'proposal_code'
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'proposal_title'
  },
  donor: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'donor_name'
  },
  programmeArea: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'project_area'
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'department'
  },
  district: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'district'
  },

  // Financial
  budgetRequested: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'requested_amount'
  },
  totalBudget: {
    type: DataTypes.DECIMAL(15, 2),
    field: 'total_budget'
  },

  // Timeline
  duration: {
    type: DataTypes.STRING(50),
    field: 'duration'
  },
  startDate: {
    type: DataTypes.DATEONLY,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATEONLY,
    field: 'end_date'
  },

  // Beneficiaries
  targetBeneficiaries: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'target_beneficiaries'
  },

  // Status & Priority
  status: {
    type: DataTypes.ENUM('Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Submitted to Donor', 'Donor Approved', 'Donor Rejected'),
    defaultValue: 'Draft',
    field: 'status'
  },
  priority: {
    type: DataTypes.ENUM('High', 'Medium', 'Low'),
    defaultValue: 'Medium',
    field: 'priority'
  },

  // Description
  summary: {
    type: DataTypes.TEXT,
    field: 'narrative'
  },

  // GER Enhanced Fields
  projectTier: {
    type: DataTypes.STRING(50)
  },
  sectorTheme: {
    type: DataTypes.STRING(100)
  },
  problemStatement: {
    type: DataTypes.TEXT
  },
  proposedSolution: {
    type: DataTypes.TEXT
  },
  overallGoal: {
    type: DataTypes.TEXT
  },
  strategicAlignment: {
    type: DataTypes.TEXT
  },
  needsAssessmentData: {
    type: DataTypes.TEXT
  },
  keyBeneficiariesDescription: {
    type: DataTypes.TEXT
  },

  // Objectives & Activities (stored as JSON arrays)
  objectives: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  keyActivities: {
    type: DataTypes.JSON,
    defaultValue: []
  },

  // MEAL Data
  resultsFramework: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  beneficiaryBreakdown: {
    type: DataTypes.JSON,
    defaultValue: {
      directMale: 0,
      directFemale: 0,
      directChildren: 0,
      directPWD: 0,
      indirectTotal: 0
    }
  },

  // Theory of Change
  theoryOfChange: {
    type: DataTypes.JSON,
    defaultValue: {
      inputs: [],
      activities: [],
      outputs: [],
      outcomes: [],
      impact: '',
      assumptions: [],
      risks: []
    }
  },

  // Budget Breakdown
  budgetBreakdown: {
    type: DataTypes.JSON,
    defaultValue: []
  },

  // Safeguarding
  safeguarding: {
    type: DataTypes.JSON,
    defaultValue: {
      dataProtection: false,
      informedConsent: false,
      childSafeguarding: false,
      incidentReporting: false,
      backgroundChecks: false,
      codeOfConduct: false,
      safeguardingFocalPerson: '',
      cfmChannels: []
    }
  },

  // Submission Info
  leadWriter: {
    type: DataTypes.STRING(200)
  },
  submittedBy: {
    type: DataTypes.INTEGER  // User ID who submitted
  },
  submitterRole: {
    type: DataTypes.STRING(100)
  },
  submissionDate: {
    type: DataTypes.DATEONLY
  },

  // Metadata
  comments: {
    type: DataTypes.TEXT  // Comment text content
  },
  attachments: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  // CBO Information
  cboId: {
    type: DataTypes.INTEGER
  },
  cboName: {
    type: DataTypes.STRING(200)
  },

  // Project Linking
  linkedProjectId: {
    type: DataTypes.INTEGER
  },
  linkedProjectCode: {
    type: DataTypes.STRING(50)
  },
  convertedToProjectDate: {
    type: DataTypes.DATEONLY
  },

  // ============================================================================
  // WASH / IGP extensions (added 2026 — backed by create_wash_igp_modules.sql)
  // ============================================================================
  // proposalType: 'WASH' | 'IGP' | 'Orphan' | 'General' | 'Mixed' — enables
  //               typed line-item editing in the proposal builder.
  // proposalLineItems: JSONB array, e.g.
  //   [{type:'SewingMachine', qty:15, unit:45000}, ...]
  // standingProposal: framework/umbrella proposal (B-pattern, recurring donors)
  // totalQuantityCap: ceiling for standing proposals (200 hand pumps/year)
  // namedBeneficiaries: when true, conversion pre-stubs N empty items
  // convertedOrderType / convertedOrderId: bidirectional pointer to the WASH
  //   or IGP order created via convert-to-order. Without these, the UI's
  //   "Open WASH/IGP order" shortcut and the "already converted" check are
  //   silently broken.
  proposalType:        { type: DataTypes.STRING(20),  field: 'proposal_type' },
  proposalLineItems:   { type: DataTypes.JSONB,        field: 'proposal_line_items' },
  standingProposal:    { type: DataTypes.BOOLEAN,      field: 'standing_proposal',    defaultValue: false },
  totalQuantityCap:    { type: DataTypes.INTEGER,      field: 'total_quantity_cap' },
  namedBeneficiaries:  { type: DataTypes.BOOLEAN,      field: 'named_beneficiaries',  defaultValue: false },
  convertedOrderType:  { type: DataTypes.STRING(20),  field: 'converted_order_type' },
  convertedOrderId:    { type: DataTypes.INTEGER,      field: 'converted_order_id' },

  // Audit fields
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  lastEditedBy: {
    type: DataTypes.INTEGER
  }
}, {
  tableName: 'proposals',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['proposal_code'] },
    { fields: ['status'] },
    { fields: ['donor_name'] },
    { fields: ['project_area'] },
    { fields: ['created_by'] },
    { fields: ['linked_project_id'] }
  ]
});

export default Proposal;
