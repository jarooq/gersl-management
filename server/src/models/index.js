import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

// ============================================
// ORPHAN MODEL
// ============================================
const Orphan = sequelize.define('Orphan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  district: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  guardianName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  guardianNIC: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  contactNumber: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  schoolName: {
    type: DataTypes.STRING(200)
  },
  currentGrade: {
    type: DataTypes.STRING(20)
  },
  stipendAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 7)
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 7)
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Pending', 'Graduated'),
    defaultValue: 'Pending'
  },
  coordinatorId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  donor: {
    type: DataTypes.STRING(100)
  },
  approvalStatus: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending'
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approvalDate: {
    type: DataTypes.DATE
  },
  documents: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'orphans',
  timestamps: true
});

// ============================================
// PROJECT MODEL
// ============================================
const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  programmeArea: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  budget: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  spent: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('Planning', 'Implementation', 'Closing', 'Completed'),
    defaultValue: 'Planning'
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  beneficiaries: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  targetBeneficiaries: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  donor: {
    type: DataTypes.STRING(200)
  },
  description: {
    type: DataTypes.TEXT
  },
  managerId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  resultsFramework: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  beneficiaryBreakdown: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  theoryOfChange: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'projects',
  timestamps: true
});

// ============================================
// EXPENSE MODEL
// ============================================
const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  projectId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Paid', 'Rejected'),
    defaultValue: 'Pending'
  },
  paymentMethod: {
    type: DataTypes.STRING(50)
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approvalDate: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'expenses',
  timestamps: true
});

// ============================================
// STAFF MODEL
// ============================================
const Staff = sequelize.define('Staff', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  nic: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  position: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  salary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  joinDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Active', 'On Leave', 'Inactive', 'Resigned'),
    defaultValue: 'Active'
  },
  employmentType: {
    type: DataTypes.ENUM('Full-Time', 'Part-Time', 'Contract', 'Volunteer'),
    defaultValue: 'Full-Time'
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'staff',
  timestamps: true
});

// ============================================
// CBO PARTNER MODEL
// ============================================
const CBOPartner = sequelize.define('CBOPartner', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  acronym: {
    type: DataTypes.STRING(20)
  },
  type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  district: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  registrationNumber: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  registrationDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  contactPerson: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Pending Review', 'Suspended'),
    defaultValue: 'Pending Review'
  },
  focusAreas: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  capacity: {
    type: DataTypes.ENUM('High', 'Medium', 'Low'),
    defaultValue: 'Medium'
  }
}, {
  tableName: 'cbo_partners',
  timestamps: true
});

// ============================================
// PARTNER MODEL
// ============================================
const Partner = sequelize.define('Partner', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  contactPerson: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Prospective'),
    defaultValue: 'Prospective'
  },
  partnershipStart: {
    type: DataTypes.DATEONLY
  },
  totalContributions: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  }
}, {
  tableName: 'partners',
  timestamps: true
});

// ============================================
// INDICATOR MODEL (MEAL)
// ============================================
const Indicator = sequelize.define('Indicator', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('Output', 'Outcome', 'Impact', 'Activity'),
    defaultValue: 'Output'
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  projectId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  baseline: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  target: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  current: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  unit: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  frequency: {
    type: DataTypes.ENUM('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually'),
    defaultValue: 'Monthly'
  },
  dataSource: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  responsible: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('On Track', 'At Risk', 'Off Track'),
    defaultValue: 'On Track'
  }
}, {
  tableName: 'indicators',
  timestamps: true
});

// ============================================
// ASSOCIATIONS
// ============================================

// User associations
User.hasMany(Orphan, { as: 'coordinatedOrphans', foreignKey: 'coordinatorId' });
User.hasMany(Project, { as: 'managedProjects', foreignKey: 'managerId' });
User.hasMany(Expense, { as: 'approvedExpenses', foreignKey: 'approvedBy' });
User.hasOne(Staff, { as: 'staffProfile', foreignKey: 'userId' });

// Orphan associations
Orphan.belongsTo(User, { as: 'coordinator', foreignKey: 'coordinatorId' });
Orphan.belongsTo(User, { as: 'approver', foreignKey: 'approvedBy' });

// Project associations
Project.belongsTo(User, { as: 'manager', foreignKey: 'managerId' });
Project.hasMany(Expense, { as: 'expenses', foreignKey: 'projectId' });
Project.hasMany(Indicator, { as: 'indicators', foreignKey: 'projectId' });

// Expense associations
Expense.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });
Expense.belongsTo(User, { as: 'approver', foreignKey: 'approvedBy' });

// Staff associations
Staff.belongsTo(User, { as: 'user', foreignKey: 'userId' });

// Indicator associations
Indicator.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });

// ============================================
// EXPORTS
// ============================================

export {
  User,
  Orphan,
  Project,
  Expense,
  Staff,
  CBOPartner,
  Partner,
  Indicator
};

export default {
  User,
  Orphan,
  Project,
  Expense,
  Staff,
  CBOPartner,
  Partner,
  Indicator,
  sequelize
};
