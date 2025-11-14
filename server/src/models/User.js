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
  }
}, {
  tableName: 'users',
  timestamps: true,
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
  return values;
};

export default User;
