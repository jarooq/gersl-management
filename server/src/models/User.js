import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM(
      'Admin',
      'BOD',
      'CEO',
      'Director Programmes',
      'Programme Manager',
      'Finance Manager',
      'Finance Officer',
      'Fundraising Manager',
      'HR Manager',
      'HR Officer',
      'Project Officer WASH',
      'Project Officer Orphans',
      'Project Officer Livelihoods',
      'Project Officer Infrastructure',
      'Project Officer Education',
      'Project Officer Women',
      'Project Officer',
      'Field Officer',
      'MEAL Officer',
      'Media Production Officer',
      'Media Officer',
      'Accountant',
      'Project Assistant',
      'Finance Assistant',
      'Fundraising Assistant',
      'HR Assistant',
      'Orphan Coordinator',
      'Guest'
    ),
    defaultValue: 'Guest',
    allowNull: false
  },
  department: {
    type: DataTypes.ENUM(
      'Governance',
      'Executive',
      'Programmes',
      'Finance',
      'Fundraising',
      'HR',
      'MEAL',
      'IT'
    ),
    allowNull: true
  },
  hierarchyLevel: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Organizational hierarchy level (1=highest, 7=lowest)'
  },
  specialization: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Role specialization (e.g., WASH, Orphans, etc.)'
  },
  reportingTo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User ID of the supervisor this user reports to'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Suspended'),
    defaultValue: 'Active'
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  passwordResetToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Token for password reset requests'
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Expiration time for password reset token (1 hour)'
  },
  failedLoginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of consecutive failed login attempts'
  },
  accountLockedUntil: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Account locked until this timestamp after too many failed attempts'
  },

  // HR-specific fields for Staff Profile
  employeeId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
    field: 'employee_id',
    comment: 'Unique employee identifier'
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'date_of_birth',
    comment: 'Employee date of birth'
  },
  gender: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Employee gender (Male, Female, Other)'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Employee residential address'
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Employee biography/profile description'
  },
  joiningDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'joining_date',
    comment: 'Date when employee joined the organization'
  },
  salary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Employee monthly salary'
  },
  contractType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'contract_type',
    comment: 'Type of employment contract (Permanent, Contract, Part-time, etc.)'
  },
  workHours: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'work_hours',
    comment: 'Working hours (e.g., 9:00 AM - 5:00 PM)'
  },
  leaveBalance: {
    type: DataTypes.INTEGER,
    defaultValue: 21,
    field: 'leave_balance',
    comment: 'Number of leave days available'
  },
  emergencyContact: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'emergency_contact',
    comment: 'Emergency contact name and phone number'
  },
  position: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Job position/title'
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  delete values.refreshToken;
  delete values.passwordResetToken;
  delete values.passwordResetExpires;
  delete values.failedLoginAttempts;
  delete values.accountLockedUntil;

  // Assign permissions based on role
  if (values.role === 'Admin') {
    // Admin gets all permissions
    values.permissions = [{permissionKey: '*'}];
  } else if (values.role === 'Orphan Coordinator') {
    // Orphan Coordinators have limited permissions - cannot assign coordinators or donors
    values.permissions = [
      {permissionKey: 'dashboard:view'},
      {permissionKey: 'orphans:view'},
      {permissionKey: 'orphans:edit'},
      {permissionKey: 'orphans:create'}
      // Note: Does NOT include 'orphans:assign_coordinator'
    ];
  } else {
    values.permissions = [];
  }

  return values;
};

export default User;
