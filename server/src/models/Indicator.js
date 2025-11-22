import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Indicator = sequelize.define('Indicator', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // Link to Project
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'project_id'
  },

  // Indicator Information
  code: {
    type: DataTypes.STRING(100),
    field: 'code'
  },
  name: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'name'
  },
  description: {
    type: DataTypes.TEXT,
    field: 'description'
  },

  // Type & Category
  type: {
    type: DataTypes.ENUM('Output', 'Outcome', 'Impact', 'Process'),
    allowNull: false,
    defaultValue: 'Output',
    field: 'type'
  },
  category: {
    type: DataTypes.STRING(100),
    field: 'category'
  },

  // Measurement
  unit: {
    type: DataTypes.STRING(100),
    field: 'unit'
  },
  baseline: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    field: 'baseline'
  },
  target: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'target'
  },
  current: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    field: 'current'
  },

  // Status & Tracking
  status: {
    type: DataTypes.ENUM('On Track', 'At Risk', 'Off Track', 'Achieved'),
    defaultValue: 'On Track',
    field: 'status'
  },
  frequency: {
    type: DataTypes.STRING(50),
    field: 'frequency'
  },

  // Data Source & Collection
  dataSource: {
    type: DataTypes.STRING(200),
    field: 'data_source'
  },
  collectionMethod: {
    type: DataTypes.STRING(200),
    field: 'collection_method'
  },
  responsiblePerson: {
    type: DataTypes.STRING(200),
    field: 'responsible_person'
  },

  // Disaggregation
  disaggregation: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'disaggregation'
  }
}, {
  tableName: 'indicators',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['project_id'] },
    { fields: ['type'] },
    { fields: ['status'] }
  ]
});

export default Indicator;
