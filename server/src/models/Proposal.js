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
    unique: true
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  donor: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  programmeArea: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  district: {
    type: DataTypes.STRING(100)
  },

  // Financial
  budgetRequested: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },

  // Timeline
  duration: {
    type: DataTypes.STRING(50)
  },
  startDate: {
    type: DataTypes.DATEONLY
  },
  endDate: {
    type: DataTypes.DATEONLY
  },

  // Beneficiaries
  targetBeneficiaries: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  // Status & Priority
  status: {
    type: DataTypes.ENUM('Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Submitted to Donor', 'Donor Approved', 'Donor Rejected'),
    defaultValue: 'Draft'
  },
  priority: {
    type: DataTypes.ENUM('High', 'Medium', 'Low'),
    defaultValue: 'Medium'
  },

  // Description
  summary: {
    type: DataTypes.TEXT
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
    type: DataTypes.STRING(200)
  },
  submitterRole: {
    type: DataTypes.STRING(100)
  },
  submissionDate: {
    type: DataTypes.DATEONLY
  },

  // Metadata
  comments: {
    type: DataTypes.INTEGER,
    defaultValue: 0
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
    { fields: ['donor'] },
    { fields: ['programme_area'] },
    { fields: ['created_by'] },
    { fields: ['linked_project_id'] }
  ]
});

export default Proposal;
