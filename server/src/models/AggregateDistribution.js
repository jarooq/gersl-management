import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AggregateDistribution = sequelize.define('AggregateDistribution', {
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

  projectId: {
    type: DataTypes.INTEGER,
    field: 'project_id'
  },

  // ============================================
  // DISTRIBUTION DETAILS
  // ============================================

  distributionDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'distribution_date'
  },

  distributionLocation: {
    type: DataTypes.STRING(255),
    field: 'distribution_location'
  },

  // Location breakdown
  district: {
    type: DataTypes.STRING(100),
    field: 'district'
  },

  city: {
    type: DataTypes.STRING(100),
    field: 'city'
  },

  gnDivision: {
    type: DataTypes.STRING(100),
    field: 'gn_division'
  },

  // Total count
  totalBeneficiaries: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'total_beneficiaries'
  },

  // Demographic breakdown (JSONB for flexibility)
  demographicBreakdown: {
    type: DataTypes.JSONB,
    field: 'demographic_breakdown',
    comment: 'JSON breakdown: { "male": 250, "female": 200, "children": 50, "elderly": 30, "disabled": 20 }'
  },

  // ============================================
  // ITEMS DISTRIBUTED
  // ============================================

  itemsDistributed: {
    type: DataTypes.JSONB,
    field: 'items_distributed',
    comment: 'JSON array: [{"item": "Ifthar meal", "quantity": 500, "unit": "packets"}]'
  },

  cashAmount: {
    type: DataTypes.DECIMAL(15, 2),
    field: 'cash_amount'
  },

  // ============================================
  // EVIDENCE / DOCUMENTATION
  // ============================================

  photos: {
    type: DataTypes.JSONB,
    field: 'photos',
    comment: 'JSON array: [{"url": "https://...", "caption": "Distribution in progress"}]'
  },

  videos: {
    type: DataTypes.JSONB,
    field: 'videos',
    comment: 'JSON array: [{"url": "https://...", "duration": 120, "caption": "Event coverage"}]'
  },

  mediaCoverageDetails: {
    type: DataTypes.TEXT,
    field: 'media_coverage_details'
  },

  // ============================================
  // STAFF & VERIFICATION
  // ============================================

  distributedBy: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    defaultValue: [],
    field: 'distributed_by',
    comment: 'Array of user IDs who conducted distribution'
  },

  verifiedBy: {
    type: DataTypes.INTEGER,
    field: 'verified_by'
  },

  verificationDate: {
    type: DataTypes.DATE,
    field: 'verification_date'
  },

  verificationNotes: {
    type: DataTypes.TEXT,
    field: 'verification_notes'
  },

  mediaTeamPresent: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    defaultValue: [],
    field: 'media_team_present',
    comment: 'Array of user IDs from media team who covered the event'
  },

  // ============================================
  // ADDITIONAL DATA
  // ============================================

  distributionType: {
    type: DataTypes.STRING(100),
    field: 'distribution_type',
    comment: 'Examples: "Community Meal", "Ifthar Distribution", "Emergency Relief"'
  },

  partnerOrganizations: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    field: 'partner_organizations',
    comment: 'Array of partner organization names involved'
  },

  communityFeedback: {
    type: DataTypes.TEXT,
    field: 'community_feedback'
  },

  challengesFaced: {
    type: DataTypes.TEXT,
    field: 'challenges_faced'
  },

  notes: {
    type: DataTypes.TEXT,
    field: 'notes'
  },

  metadata: {
    type: DataTypes.JSONB,
    field: 'metadata'
  },

  // ============================================
  // AUDIT
  // ============================================

  createdBy: {
    type: DataTypes.INTEGER,
    field: 'created_by'
  }
}, {
  tableName: 'aggregate_distributions',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['task_id'] },
    { fields: ['project_id'] },
    { fields: ['distribution_date'] },
    { fields: ['district'] },
    { fields: ['verified_by'] },
    { fields: ['created_by'] }
  ]
});

export default AggregateDistribution;
