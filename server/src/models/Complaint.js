import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Complaint = sequelize.define('Complaint', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // Ticket Information
  ticketNumber: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    field: 'ticket_number'
  },
  submittedDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'submitted_date'
  },

  // Complainant Information
  complainantName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'complainant_name'
  },
  contactMethod: {
    type: DataTypes.STRING(100),
    field: 'contact_method'
  },
  contactDetails: {
    type: DataTypes.STRING(255),
    field: 'contact_details'
  },

  // Complaint Details
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'category'
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
    defaultValue: 'Medium',
    field: 'priority'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'description'
  },

  // Project Link
  projectId: {
    type: DataTypes.INTEGER,
    field: 'project_id'
  },
  projectName: {
    type: DataTypes.STRING(255),
    field: 'project_name'
  },

  // Status & Assignment
  status: {
    type: DataTypes.ENUM('Open', 'Under Investigation', 'Resolved', 'Closed'),
    defaultValue: 'Open',
    field: 'status'
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    field: 'assigned_to'
  },

  // Resolution
  investigationNotes: {
    type: DataTypes.TEXT,
    field: 'investigation_notes'
  },
  resolution: {
    type: DataTypes.TEXT,
    field: 'resolution'
  },
  resolvedDate: {
    type: DataTypes.DATEONLY,
    field: 'resolved_date'
  },
  closedDate: {
    type: DataTypes.DATEONLY,
    field: 'closed_date'
  },

  // Satisfaction & Follow-up
  satisfactionRating: {
    type: DataTypes.INTEGER,
    field: 'satisfaction_rating'
  },
  followUpRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'follow_up_required'
  },
  followUpDate: {
    type: DataTypes.DATEONLY,
    field: 'follow_up_date'
  },

  // Confidentiality
  confidential: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'confidential'
  }
}, {
  tableName: 'complaints',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['ticket_number'] },
    { fields: ['status'] },
    { fields: ['project_id'] },
    { fields: ['assigned_to'] }
  ]
});

export default Complaint;
