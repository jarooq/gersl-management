import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * AI-Generated Report Model
 * Stores AI-generated reports for projects and proposals
 */
const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reportType: {
    type: DataTypes.ENUM(
      'DONOR_REPORT',
      'PROGRESS_REPORT',
      'COMPLETION_REPORT',
      'FINANCIAL_REPORT',
      'IMPACT_REPORT',
      'QUARTERLY_REPORT',
      'ANNUAL_REPORT',
      'PROPOSAL_NARRATIVE'
    ),
    allowNull: false,
    comment: 'Type of report generated'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Report title/name'
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'projects',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'Associated project (if any)'
  },
  projectName: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Cached project name for display'
  },
  proposalId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Associated proposal ID (if any)'
  },
  proposalTitle: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Cached proposal title for display'
  },
  donor: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Donor/Partner name'
  },
  reportingPeriod: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Reporting period (e.g., "Q1 2025", "January - March 2025")'
  },
  sections: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Array of report sections with AI-generated content'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional metadata (preparedBy, reviewedBy, additionalData, etc.)'
  },
  totalSections: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Total number of sections in the report'
  },
  successfulSections: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of successfully generated sections'
  },
  generationStatus: {
    type: DataTypes.ENUM('Pending', 'Generating', 'Completed', 'Failed', 'Partial'),
    defaultValue: 'Pending',
    comment: 'Overall generation status'
  },
  generationErrors: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of errors encountered during generation'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who generated the report'
  },
  lastEditedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who last edited the report'
  },
  sharedWith: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of user IDs who have access to this report'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether the report is publicly accessible within the organization'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Tags for categorization and search'
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Version number for tracking report iterations'
  },
  exportedFormats: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of formats this report has been exported to'
  },
  lastExportedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp of last export'
  }
}, {
  tableName: 'reports',
  timestamps: true,
  indexes: [
    {
      name: 'reports_type_idx',
      fields: ['reportType']
    },
    {
      name: 'reports_project_idx',
      fields: ['projectId']
    },
    {
      name: 'reports_proposal_idx',
      fields: ['proposalId']
    },
    {
      name: 'reports_created_by_idx',
      fields: ['createdBy']
    },
    {
      name: 'reports_status_idx',
      fields: ['generationStatus']
    },
    {
      name: 'reports_created_at_idx',
      fields: ['createdAt']
    }
  ]
});

// Instance methods
Report.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  // Calculate progress percentage
  if (values.totalSections > 0) {
    values.progressPercentage = Math.round((values.successfulSections / values.totalSections) * 100);
  } else {
    values.progressPercentage = 0;
  }
  return values;
};

// Static method to create report with initial sections
Report.createWithSections = async function(reportData, sections, userId) {
  return await Report.create({
    ...reportData,
    sections: sections,
    totalSections: sections.length,
    successfulSections: sections.filter(s => !s.error).length,
    generationStatus: sections.every(s => !s.error) ? 'Completed' :
                     sections.some(s => !s.error) ? 'Partial' : 'Failed',
    createdBy: userId
  });
};

// Static method to update section content
Report.updateSection = async function(reportId, sectionId, newContent, userId) {
  const report = await Report.findByPk(reportId);
  if (!report) {
    throw new Error('Report not found');
  }

  const sections = report.sections.map(section => {
    if (section.id === sectionId) {
      return {
        ...section,
        content: newContent,
        editedAt: new Date().toISOString()
      };
    }
    return section;
  });

  await report.update({
    sections,
    lastEditedBy: userId
  });

  return report;
};

export default Report;
