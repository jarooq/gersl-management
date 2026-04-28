import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // Basic Information
  projectName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'name'
  },
  projectCode: {
    type: DataTypes.STRING(100),
    unique: true,
    field: 'project_code'
  },
  description: {
    type: DataTypes.TEXT,
    field: 'description'
  },

  // Timeline
  startDate: {
    type: DataTypes.DATEONLY,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATEONLY,
    field: 'end_date'
  },

  // Status & Phase
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'Planning',
    field: 'status'
  },
  phase: {
    type: DataTypes.STRING(50),
    field: 'phase'
  },

  // Financial
  budget: {
    type: DataTypes.DECIMAL(15, 2),
    field: 'budget'
  },
  spent: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    field: 'spent'
  },
  fundingSource: {
    type: DataTypes.STRING(200),
    field: 'funding_source'
  },
  donor: {
    type: DataTypes.STRING(255),
    field: 'donor'
  },

  // Programme & Management
  programmeArea: {
    type: DataTypes.STRING(100),
    field: 'programme_area'
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'department'
  },
  projectManager: {
    type: DataTypes.STRING(150),
    field: 'project_manager'
  },
  managerId: {
    type: DataTypes.INTEGER,
    field: 'manager_id'
  },

  // Location & Beneficiaries
  location: {
    type: DataTypes.STRING(255),
    field: 'location'
  },
  beneficiariesTarget: {
    type: DataTypes.INTEGER,
    field: 'beneficiaries_target'
  },
  targetBeneficiaries: {
    type: DataTypes.INTEGER,
    field: 'target_beneficiaries'
  },
  beneficiaries: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'beneficiaries'
  },

  // Progress
  progress: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    field: 'progress'
  },

  // GER Enhanced Fields
  projectTier: {
    type: DataTypes.STRING(50),
    field: 'project_tier'
  },
  sectorTheme: {
    type: DataTypes.STRING(100),
    field: 'sector_theme'
  },
  problemStatement: {
    type: DataTypes.TEXT,
    field: 'problem_statement'
  },
  proposedSolution: {
    type: DataTypes.TEXT,
    field: 'proposed_solution'
  },
  overallGoal: {
    type: DataTypes.TEXT,
    field: 'overall_goal'
  },
  strategicAlignment: {
    type: DataTypes.TEXT,
    field: 'strategic_alignment'
  },

  // Objectives & Activities (TEXT for now, can be JSON)
  objectives: {
    type: DataTypes.TEXT,
    field: 'objectives',
    get() {
      const rawValue = this.getDataValue('objectives');
      if (!rawValue) return [];
      if (typeof rawValue === 'string') {
        try {
          return JSON.parse(rawValue);
        } catch (e) {
          return [];
        }
      }
      return rawValue;
    }
  },
  keyActivities: {
    type: DataTypes.TEXT,
    field: 'key_activities',
    get() {
      const rawValue = this.getDataValue('keyActivities');
      if (!rawValue) return [];
      if (typeof rawValue === 'string') {
        try {
          return JSON.parse(rawValue);
        } catch (e) {
          return [];
        }
      }
      return rawValue;
    }
  },

  // MEAL Data
  resultsFramework: {
    type: DataTypes.TEXT,
    field: 'results_framework',
    get() {
      const rawValue = this.getDataValue('resultsFramework');
      if (!rawValue) return [];
      if (typeof rawValue === 'string') {
        try {
          return JSON.parse(rawValue);
        } catch (e) {
          return [];
        }
      }
      return rawValue;
    }
  },
  beneficiaryBreakdown: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'beneficiary_breakdown'
  },

  // Theory of Change
  theoryOfChange: {
    type: DataTypes.TEXT,
    field: 'theory_of_change',
    get() {
      const rawValue = this.getDataValue('theoryOfChange');
      if (!rawValue) return {};
      if (typeof rawValue === 'string') {
        try {
          return JSON.parse(rawValue);
        } catch (e) {
          return {};
        }
      }
      return rawValue;
    }
  },

  // Budget Breakdown
  budgetBreakdown: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'budget_breakdown'
  },

  // Safeguarding
  safeguarding: {
    type: DataTypes.STRING(255),
    field: 'safeguarding'
  },

  // Link to Proposal (for conversion tracking)
  proposalId: {
    type: DataTypes.INTEGER,
    field: 'proposal_id'
  },

  // Audit fields
  createdBy: {
    type: DataTypes.INTEGER,
    field: 'created_by'
  },

  // Copy of project_name for backwards compatibility
  name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'name'
  }
}, {
  tableName: 'projects',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['project_code'] },
    { fields: ['status'] },
    { fields: ['programme_area'] },
    { fields: ['department'] },
    { fields: ['manager_id'] },
    { fields: ['proposal_id'] }
  ]
});

export default Project;
