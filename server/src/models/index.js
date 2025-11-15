import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
import Report from './Report.js';
import Proposal from './Proposal.js';
// import OrphanNeed from './OrphanNeed.js'; // Temporarily disabled - table already exists in Supabase

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
  // Location fields
  province: {
    type: DataTypes.STRING(100)
  },
  dsDivision: {
    type: DataTypes.STRING(150)
  },
  gnDivision: {
    type: DataTypes.STRING(150)
  },
  // Guardian additional fields
  guardianRelationship: {
    type: DataTypes.STRING(100)
  },
  guardianContact: {
    type: DataTypes.STRING(50)
  },
  // Orphan type and parent information
  orphanType: {
    type: DataTypes.STRING(50)
  },
  gender: {
    type: DataTypes.STRING(20)
  },
  // Mother information
  motherName: {
    type: DataTypes.STRING(100)
  },
  motherNIC: {
    type: DataTypes.STRING(20)
  },
  motherOccupation: {
    type: DataTypes.STRING(100)
  },
  motherMonthlyIncome: {
    type: DataTypes.DECIMAL(10, 2)
  },
  motherCauseOfDeath: {
    type: DataTypes.STRING(200)
  },
  motherDateOfDeath: {
    type: DataTypes.DATEONLY
  },
  motherPlaceOfDeath: {
    type: DataTypes.STRING(200)
  },
  motherDCNo: {
    type: DataTypes.STRING(50)
  },
  // Father information
  fatherName: {
    type: DataTypes.STRING(100)
  },
  fatherCauseOfDeath: {
    type: DataTypes.STRING(200)
  },
  fatherDateOfDeath: {
    type: DataTypes.DATEONLY
  },
  fatherPlaceOfDeath: {
    type: DataTypes.STRING(200)
  },
  fatherDCNo: {
    type: DataTypes.STRING(50)
  },
  fatherPreviousOccupation: {
    type: DataTypes.STRING(100)
  },
  // Education fields
  educationLevel: {
    type: DataTypes.STRING(50)
  },
  schoolAddress: {
    type: DataTypes.TEXT
  },
  schoolContact: {
    type: DataTypes.STRING(50)
  },
  favouriteSubjects: {
    type: DataTypes.TEXT
  },
  childDreamAmbition: {
    type: DataTypes.TEXT
  },
  academicPerformance: {
    type: DataTypes.STRING(50)
  },
  // Social and living conditions
  levelOfLife: {
    type: DataTypes.STRING(50)
  },
  houseType: {
    type: DataTypes.STRING(50)
  },
  houseStatus: {
    type: DataTypes.STRING(50)
  },
  socialConcerns: {
    type: DataTypes.TEXT
  },
  // Health information
  generalHealthStatus: {
    type: DataTypes.STRING(50)
  },
  healthCondition: {
    type: DataTypes.TEXT
  },
  specialNeeds: {
    type: DataTypes.TEXT
  },
  existingIllness: {
    type: DataTypes.TEXT
  },
  treatmentCost: {
    type: DataTypes.DECIMAL(10, 2)
  },
  treatmentPayer: {
    type: DataTypes.STRING(100)
  },
  hasDisabilities: {
    type: DataTypes.STRING(10)
  },
  disabilityDetails: {
    type: DataTypes.TEXT
  },
  immunizationStatus: {
    type: DataTypes.STRING(50)
  },
  // Support and enrollment
  enrollmentDate: {
    type: DataTypes.DATEONLY
  },
  monthlySupportAmount: {
    type: DataTypes.DECIMAL(10, 2)
  },
  supportType: {
    type: DataTypes.STRING(100)
  },
  notes: {
    type: DataTypes.TEXT
  },
  photoUrl: {
    type: DataTypes.STRING(500)
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
  timestamps: true,
  underscored: true
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
  projectCode: {
    type: DataTypes.STRING(100)
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
  },
  // Additional project fields from form
  phase: {
    type: DataTypes.STRING(50)
  },
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
  objectives: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  keyActivities: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  budgetBreakdown: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  safeguarding: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'projects',
  timestamps: true,
  underscored: true
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
  timestamps: true,
  underscored: true
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
  timestamps: true,
  underscored: true
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
  timestamps: true,
  underscored: true
});

// ============================================
// CBO VOLUNTEER MODEL
// ============================================
const CBOVolunteer = sequelize.define('CBOVolunteer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  cboAffiliation: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  cboPartnerId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'cbo_partners',
      key: 'id'
    }
  },
  district: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100)
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  skills: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  joinedDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  hoursContributed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  projectsParticipated: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1)
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Pending Orientation'),
    defaultValue: 'Pending Orientation'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'cbo_volunteers',
  timestamps: true,
  underscored: true
});

// ============================================
// CBO ACTIVITY MODEL
// ============================================
const CBOActivity = sequelize.define('CBOActivity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  activityName: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  activityType: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  cboPartnerId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'cbo_partners',
      key: 'id'
    }
  },
  activityDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING(200)
  },
  participants: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  volunteersInvolved: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  budget: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  actualCost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('Upcoming', 'In Progress', 'Completed', 'Cancelled'),
    defaultValue: 'Upcoming'
  },
  outcomes: {
    type: DataTypes.TEXT
  },
  createdBy: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'cbo_activities',
  timestamps: true,
  underscored: true
});

// ============================================
// CBO DUE DILIGENCE MODEL
// ============================================
const CBODueDiligence = sequelize.define('CBODueDiligence', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cboPartnerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'cbo_partners',
      key: 'id'
    }
  },
  assessmentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  assessor: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  overallScore: {
    type: DataTypes.DECIMAL(5, 2)
  },
  financialScore: {
    type: DataTypes.DECIMAL(5, 2)
  },
  governanceScore: {
    type: DataTypes.DECIMAL(5, 2)
  },
  technicalScore: {
    type: DataTypes.DECIMAL(5, 2)
  },
  safeguardingScore: {
    type: DataTypes.DECIMAL(5, 2)
  },
  findings: {
    type: DataTypes.TEXT
  },
  recommendations: {
    type: DataTypes.TEXT
  },
  riskLevel: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
    defaultValue: 'Medium'
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'),
    defaultValue: 'Draft'
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approvalDate: {
    type: DataTypes.DATEONLY
  },
  nextAssessmentDate: {
    type: DataTypes.DATEONLY
  },
  createdBy: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'cbo_due_diligence',
  timestamps: true,
  underscored: true
});

// ============================================
// CBO PROPOSAL MODEL
// ============================================
const CBOProposal = sequelize.define('CBOProposal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cboPartnerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'cbo_partners',
      key: 'id'
    }
  },
  proposalTitle: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  programmeArea: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  district: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  duration: {
    type: DataTypes.STRING(50)
  },
  requestedBudget: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  approvedBudget: {
    type: DataTypes.DECIMAL(12, 2)
  },
  targetBeneficiaries: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  objectives: {
    type: DataTypes.TEXT
  },
  activities: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  expectedOutcomes: {
    type: DataTypes.TEXT
  },
  submissionDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  submittedBy: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(
      'Submitted',
      'CEO Approval',
      'Donor Pending',
      'Donor Approved - Ready for Conversion',
      'Rejected by Fundraising',
      'Rejected by CEO',
      'Rejected by Donor',
      'Converted to Project'
    ),
    defaultValue: 'Submitted'
  },
  workflowStage: {
    type: DataTypes.ENUM('fundraising', 'ceo', 'donor', 'approved', 'converted'),
    defaultValue: 'fundraising'
  },
  fundraisingStatus: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending'
  },
  fundraisingReviewer: {
    type: DataTypes.STRING(100)
  },
  fundraisingReviewDate: {
    type: DataTypes.DATEONLY
  },
  fundraisingScore: {
    type: DataTypes.DECIMAL(5, 2)
  },
  fundraisingComments: {
    type: DataTypes.TEXT
  },
  ceoStatus: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending'
  },
  ceoApprover: {
    type: DataTypes.STRING(100)
  },
  ceoApprovalDate: {
    type: DataTypes.DATEONLY
  },
  ceoComments: {
    type: DataTypes.TEXT
  },
  donorStatus: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending'
  },
  donorName: {
    type: DataTypes.STRING(200)
  },
  donorApprovalDate: {
    type: DataTypes.DATEONLY
  },
  convertedToProject: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  projectId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'cbo_projects',
      key: 'id'
    }
  },
  projectStartDate: {
    type: DataTypes.DATEONLY
  },
  createdBy: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'cbo_proposals',
  timestamps: true,
  underscored: true
});

// ============================================
// CBO PROJECT MODEL
// ============================================
const CBOProject = sequelize.define('CBOProject', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cboPartnerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'cbo_partners',
      key: 'id'
    }
  },
  projectTitle: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  programmeArea: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  district: {
    type: DataTypes.STRING(50),
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
  budget: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  spent: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('Active', 'Completed', 'On Hold', 'Cancelled'),
    defaultValue: 'Active'
  },
  targetBeneficiaries: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  actualBeneficiaries: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  projectManager: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  gerslFocalPerson: {
    type: DataTypes.STRING(100)
  },
  lastReportDate: {
    type: DataTypes.DATEONLY
  },
  nextReportDue: {
    type: DataTypes.DATEONLY
  },
  milestones: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  issues: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  cfmFeedback: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  createdBy: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'cbo_projects',
  timestamps: true,
  underscored: true
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
  logo: {
    type: DataTypes.TEXT
  },
  category: {
    type: DataTypes.STRING(100)
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
    allowNull: false,
    field: 'contact_person'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'contact_email'
  },
  phone: {
    type: DataTypes.STRING(20),
    field: 'contact_phone'
  },
  address: {
    type: DataTypes.TEXT
  },
  website: {
    type: DataTypes.STRING(255)
  },
  focusAreas: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'focus_areas'
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Prospective'),
    defaultValue: 'Prospective'
  },
  partnershipStart: {
    type: DataTypes.DATEONLY,
    field: 'partnership_start'
  },
  totalContributions: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    field: 'total_contributions'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'partners',
  timestamps: true,
  underscored: true
});

// ============================================
// PARTNER CONTRIBUTION MODEL
// ============================================
const PartnerContribution = sequelize.define('PartnerContribution', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  partnerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'partner_id',
    references: {
      model: 'partners',
      key: 'id'
    }
  },
  contributionType: {
    type: DataTypes.ENUM('Financial', 'In-Kind', 'Technical', 'Other'),
    allowNull: false,
    field: 'contribution_type'
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'LKR'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  contributionDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'contribution_date'
  },
  projectId: {
    type: DataTypes.INTEGER,
    field: 'project_id',
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  receiptNumber: {
    type: DataTypes.STRING(100),
    field: 'receipt_number'
  },
  status: {
    type: DataTypes.ENUM('Pledged', 'Received', 'Pending'),
    defaultValue: 'Pending'
  },
  notes: {
    type: DataTypes.TEXT
  },
  createdBy: {
    type: DataTypes.INTEGER,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'partner_contributions',
  timestamps: true,
  underscored: true
});

// ============================================
// PARTNER COMMUNICATION MODEL
// ============================================
const PartnerCommunication = sequelize.define('PartnerCommunication', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  partnerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'partner_id',
    references: {
      model: 'partners',
      key: 'id'
    }
  },
  communicationType: {
    type: DataTypes.ENUM('Email', 'Phone', 'Meeting', 'Video Call', 'Other'),
    allowNull: false,
    field: 'communication_type'
  },
  subject: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  communicationDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'communication_date'
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
  status: {
    type: DataTypes.ENUM('Completed', 'Pending', 'Follow-up Required'),
    defaultValue: 'Completed'
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  createdBy: {
    type: DataTypes.INTEGER,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'partner_communications',
  timestamps: true,
  underscored: true
});

// ============================================
// BENEFICIARY MODEL
// ============================================
const Beneficiary = sequelize.define('Beneficiary', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fullName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'full_name'
  },
  beneficiaryId: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    field: 'beneficiary_id'
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    field: 'date_of_birth'
  },
  age: {
    type: DataTypes.INTEGER
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other'),
    allowNull: false
  },
  nic: {
    type: DataTypes.STRING(20),
    field: 'nic'
  },
  contactNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'contact_number'
  },
  email: {
    type: DataTypes.STRING(100)
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  province: {
    type: DataTypes.STRING(100)
  },
  district: {
    type: DataTypes.STRING(100)
  },
  dsDivision: {
    type: DataTypes.STRING(150),
    field: 'ds_division'
  },
  gnDivision: {
    type: DataTypes.STRING(150),
    field: 'gn_division'
  },
  category: {
    type: DataTypes.ENUM('Individual', 'Family', 'Community', 'Institution'),
    allowNull: false,
    defaultValue: 'Individual'
  },
  beneficiaryType: {
    type: DataTypes.STRING(100),
    field: 'beneficiary_type'
  },
  vulnerabilityScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'vulnerability_score'
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Graduated', 'Suspended'),
    defaultValue: 'Active'
  },
  registrationDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'registration_date'
  },
  exitDate: {
    type: DataTypes.DATEONLY,
    field: 'exit_date'
  },
  exitReason: {
    type: DataTypes.TEXT,
    field: 'exit_reason'
  },
  householdSize: {
    type: DataTypes.INTEGER,
    field: 'household_size'
  },
  monthlyIncome: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'monthly_income'
  },
  employmentStatus: {
    type: DataTypes.STRING(100),
    field: 'employment_status'
  },
  educationLevel: {
    type: DataTypes.STRING(100),
    field: 'education_level'
  },
  healthStatus: {
    type: DataTypes.STRING(100),
    field: 'health_status'
  },
  disabilities: {
    type: DataTypes.TEXT
  },
  notes: {
    type: DataTypes.TEXT
  },
  photoUrl: {
    type: DataTypes.TEXT,
    field: 'photo_url'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'beneficiaries',
  timestamps: true,
  underscored: true
});

// ============================================
// BENEFICIARY SUPPORT MODEL
// ============================================
const BeneficiarySupport = sequelize.define('BeneficiarySupport', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  beneficiaryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'beneficiary_id',
    references: {
      model: 'beneficiaries',
      key: 'id'
    }
  },
  supportType: {
    type: DataTypes.ENUM('Financial', 'Material', 'Service', 'Training', 'Healthcare', 'Education', 'Other'),
    allowNull: false,
    field: 'support_type'
  },
  supportCategory: {
    type: DataTypes.STRING(100),
    field: 'support_category'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'LKR'
  },
  quantity: {
    type: DataTypes.INTEGER
  },
  unit: {
    type: DataTypes.STRING(50)
  },
  providedDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'provided_date'
  },
  projectId: {
    type: DataTypes.INTEGER,
    field: 'project_id',
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  partnerId: {
    type: DataTypes.INTEGER,
    field: 'partner_id',
    references: {
      model: 'partners',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('Planned', 'In Progress', 'Completed', 'Cancelled'),
    defaultValue: 'Planned'
  },
  deliveryMethod: {
    type: DataTypes.STRING(100),
    field: 'delivery_method'
  },
  receiptNumber: {
    type: DataTypes.STRING(100),
    field: 'receipt_number'
  },
  verificationStatus: {
    type: DataTypes.ENUM('Pending', 'Verified', 'Not Verified'),
    defaultValue: 'Pending',
    field: 'verification_status'
  },
  verifiedBy: {
    type: DataTypes.INTEGER,
    field: 'verified_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  verifiedDate: {
    type: DataTypes.DATEONLY,
    field: 'verified_date'
  },
  notes: {
    type: DataTypes.TEXT
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  createdBy: {
    type: DataTypes.INTEGER,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'beneficiary_support',
  timestamps: true,
  underscored: true
});

// ============================================
// ONBOARDING RECORD MODEL
// ============================================
const OnboardingRecord = sequelize.define('OnboardingRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  staffId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'staff_id',
    references: {
      model: 'staff',
      key: 'id'
    }
  },
  onboardingDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'onboarding_date'
  },
  completionDate: {
    type: DataTypes.DATEONLY,
    field: 'completion_date'
  },
  status: {
    type: DataTypes.ENUM('Not Started', 'In Progress', 'Completed', 'On Hold'),
    defaultValue: 'Not Started'
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    field: 'assigned_to',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  checklist: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  documents: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT
  },
  createdBy: {
    type: DataTypes.INTEGER,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'onboarding_records',
  timestamps: true,
  underscored: true
});

// ============================================
// APPRAISAL RECORD MODEL
// ============================================
const AppraisalRecord = sequelize.define('AppraisalRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  staffId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'staff_id',
    references: {
      model: 'staff',
      key: 'id'
    }
  },
  appraisalPeriod: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'appraisal_period'
  },
  appraisalDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'appraisal_date'
  },
  appraisalType: {
    type: DataTypes.ENUM('Probation', 'Annual', 'Mid-Year', 'Project-Based'),
    allowNull: false,
    field: 'appraisal_type'
  },
  appraiser: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  reviewer: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  overallRating: {
    type: DataTypes.DECIMAL(3, 2),
    field: 'overall_rating',
    validate: {
      min: 0,
      max: 5
    }
  },
  performanceRatings: {
    type: DataTypes.JSON,
    defaultValue: {},
    field: 'performance_ratings'
  },
  strengths: {
    type: DataTypes.TEXT
  },
  areasOfImprovement: {
    type: DataTypes.TEXT,
    field: 'areas_of_improvement'
  },
  goals: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  trainingNeeds: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'training_needs'
  },
  employeeComments: {
    type: DataTypes.TEXT,
    field: 'employee_comments'
  },
  appraiserComments: {
    type: DataTypes.TEXT,
    field: 'appraiser_comments'
  },
  reviewerComments: {
    type: DataTypes.TEXT,
    field: 'reviewer_comments'
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Submitted', 'Under Review', 'Completed', 'Acknowledged'),
    defaultValue: 'Draft'
  },
  submittedDate: {
    type: DataTypes.DATEONLY,
    field: 'submitted_date'
  },
  acknowledgedDate: {
    type: DataTypes.DATEONLY,
    field: 'acknowledged_date'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'appraisal_records',
  timestamps: true,
  underscored: true
});

// ============================================
// ORPHAN VISIT LOG MODEL
// ============================================
const OrphanVisitLog = sequelize.define('OrphanVisitLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orphanId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orphans',
      key: 'id'
    }
  },
  visitDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  coordinatorId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  visitNotes: {
    type: DataTypes.TEXT
  },
  observations: {
    type: DataTypes.TEXT
  },
  photos: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  drawings: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  letters: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  needsAssessment: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  tableName: 'orphan_visit_logs',
  timestamps: true,
  underscored: true
});

// ============================================
// ORPHAN PROGRESS RATING MODEL
// ============================================
const OrphanProgressRating = sequelize.define('OrphanProgressRating', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  visitLogId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orphan_visit_logs',
      key: 'id'
    }
  },
  orphanId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orphans',
      key: 'id'
    }
  },
  ratingDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  educationalProgress: {
    type: DataTypes.INTEGER
  },
  healthWellbeing: {
    type: DataTypes.INTEGER
  },
  socialDevelopment: {
    type: DataTypes.INTEGER
  },
  behavioralProgress: {
    type: DataTypes.INTEGER
  },
  overallRating: {
    type: DataTypes.DECIMAL(3, 2)
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'orphan_progress_ratings',
  timestamps: true,
  underscored: true
});

// ============================================
// GENERATED ORPHAN REPORT MODEL
// ============================================
const GeneratedOrphanReport = sequelize.define('GeneratedOrphanReport', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orphanId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orphans',
      key: 'id'
    }
  },
  reportType: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  reportPeriodStart: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  reportPeriodEnd: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  generatedBy: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  partnerId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'partners',
      key: 'id'
    }
  },
  selectedPhotos: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  selectedDrawings: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  selectedLetters: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  aiGeneratedSummary: {
    type: DataTypes.TEXT
  },
  aiGeneratedAnalysis: {
    type: DataTypes.TEXT
  },
  aiGeneratedRecommendations: {
    type: DataTypes.TEXT
  },
  pdfUrl: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'draft'
  }
}, {
  tableName: 'generated_orphan_reports',
  timestamps: true,
  underscored: true
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
  timestamps: true,
  underscored: true
});

// ============================================
// EVALUATION MODEL
// ============================================
const Evaluation = sequelize.define('Evaluation', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  evaluationCode: { type: DataTypes.STRING(50), unique: true, allowNull: false, field: 'evaluation_code' },
  title: { type: DataTypes.STRING(200), allowNull: false },
  type: { type: DataTypes.ENUM('Baseline', 'Midterm', 'Endline', 'Impact'), allowNull: false },
  projectId: { type: DataTypes.INTEGER, references: { model: 'projects', key: 'id' }, field: 'project_id' },
  projectName: { type: DataTypes.STRING(200), field: 'project_name' },
  evaluator: { type: DataTypes.STRING(100), allowNull: false },
  startDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'start_date' },
  endDate: { type: DataTypes.DATEONLY, field: 'end_date' },
  status: { type: DataTypes.ENUM('Planned', 'In Progress', 'Completed', 'Cancelled'), defaultValue: 'Planned' },
  methodology: { type: DataTypes.TEXT },
  objectives: { type: DataTypes.JSON, defaultValue: [] },
  findings: { type: DataTypes.TEXT },
  recommendations: { type: DataTypes.TEXT },
  reportStatus: { type: DataTypes.ENUM('Pending', 'Draft', 'Final', 'Published'), defaultValue: 'Pending', field: 'report_status' },
  reportUrl: { type: DataTypes.STRING(500), field: 'report_url' },
  attachments: { type: DataTypes.INTEGER, defaultValue: 0 },
  budget: { type: DataTypes.DECIMAL(12, 2) },
  createdBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'created_by' }
}, {
  tableName: 'evaluations',
  timestamps: true,
  underscored: true
});

// ============================================
// LEARNING EVENT MODEL
// ============================================
const LearningEvent = sequelize.define('LearningEvent', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  eventCode: { type: DataTypes.STRING(50), unique: true, field: 'event_code' },
  title: { type: DataTypes.STRING(200), allowNull: false },
  type: { type: DataTypes.ENUM('Workshop', 'Training', 'Webinar', 'Conference', 'Community of Practice', 'Lesson Learned Session'), allowNull: false },
  eventDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'event_date' },
  facilitator: { type: DataTypes.STRING(100) },
  participants: { type: DataTypes.JSON, defaultValue: [] },
  totalParticipants: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_participants' },
  description: { type: DataTypes.TEXT },
  keyLearnings: { type: DataTypes.TEXT, field: 'key_learnings' },
  actionPoints: { type: DataTypes.JSON, defaultValue: [], field: 'action_points' },
  status: { type: DataTypes.ENUM('Scheduled', 'Completed', 'Cancelled'), defaultValue: 'Scheduled' },
  venue: { type: DataTypes.STRING(200) },
  duration: { type: DataTypes.INTEGER },
  materials: { type: DataTypes.JSON, defaultValue: [] },
  followUpRequired: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'follow_up_required' },
  followUpDate: { type: DataTypes.DATEONLY, field: 'follow_up_date' },
  createdBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'created_by' }
}, {
  tableName: 'learning_events',
  timestamps: true,
  underscored: true
});

// ============================================
// COMPLAINT/FEEDBACK MODEL
// ============================================
const Complaint = sequelize.define('Complaint', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ticketNumber: { type: DataTypes.STRING(50), unique: true, allowNull: false, field: 'ticket_number' },
  submittedDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'submitted_date' },
  complainantName: { type: DataTypes.STRING(100), field: 'complainant_name' },
  contactMethod: { type: DataTypes.ENUM('Phone', 'Email', 'In-Person', 'Online Form', 'Letter'), field: 'contact_method' },
  contactDetails: { type: DataTypes.STRING(200), field: 'contact_details' },
  category: { type: DataTypes.ENUM('Service Quality', 'Staff Behavior', 'Project Implementation', 'Finance', 'Safeguarding', 'Other'), allowNull: false },
  priority: { type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'), defaultValue: 'Medium' },
  description: { type: DataTypes.TEXT, allowNull: false },
  projectId: { type: DataTypes.INTEGER, references: { model: 'projects', key: 'id' }, field: 'project_id' },
  projectName: { type: DataTypes.STRING(200), field: 'project_name' },
  status: { type: DataTypes.ENUM('Open', 'Under Investigation', 'In Progress', 'Resolved', 'Closed'), defaultValue: 'Open' },
  assignedTo: { type: DataTypes.STRING(100), field: 'assigned_to' },
  investigationNotes: { type: DataTypes.TEXT, field: 'investigation_notes' },
  resolution: { type: DataTypes.TEXT },
  resolvedDate: { type: DataTypes.DATEONLY, field: 'resolved_date' },
  closedDate: { type: DataTypes.DATEONLY, field: 'closed_date' },
  satisfactionRating: { type: DataTypes.INTEGER, field: 'satisfaction_rating' },
  followUpRequired: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'follow_up_required' },
  followUpDate: { type: DataTypes.DATEONLY, field: 'follow_up_date' },
  confidential: { type: DataTypes.BOOLEAN, defaultValue: false },
  createdBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'created_by' }
}, {
  tableName: 'complaints',
  timestamps: true,
  underscored: true
});

// ============================================
// ASSOCIATIONS
// ============================================

// User associations
User.hasMany(Orphan, { as: 'coordinatedOrphans', foreignKey: 'coordinatorId' });
User.hasMany(Project, { as: 'managedProjects', foreignKey: 'managerId' });
User.hasMany(Expense, { as: 'approvedExpenses', foreignKey: 'approvedBy' });
User.hasOne(Staff, { as: 'staffProfile', foreignKey: 'userId' });
User.hasMany(Report, { as: 'createdReports', foreignKey: 'createdBy' });
User.hasMany(Report, { as: 'editedReports', foreignKey: 'lastEditedBy' });
User.hasMany(Proposal, { as: 'createdProposals', foreignKey: 'createdBy' });
User.hasMany(Proposal, { as: 'editedProposals', foreignKey: 'lastEditedBy' });
// User.hasMany(OrphanNeed, { as: 'recordedNeeds', foreignKey: 'recordedBy' });
// User.hasMany(OrphanNeed, { as: 'approvedNeeds', foreignKey: 'approvedBy' });

// Orphan associations
Orphan.belongsTo(User, { as: 'coordinator', foreignKey: 'coordinatorId' });
Orphan.belongsTo(User, { as: 'approver', foreignKey: 'approvedBy' });
Orphan.hasMany(OrphanVisitLog, { as: 'visitLogs', foreignKey: 'orphanId' });
Orphan.hasMany(OrphanProgressRating, { as: 'progressRatings', foreignKey: 'orphanId' });
Orphan.hasMany(GeneratedOrphanReport, { as: 'reports', foreignKey: 'orphanId' });
// Orphan.hasMany(OrphanNeed, { as: 'needs', foreignKey: 'orphanId' });

// Project associations
Project.belongsTo(User, { as: 'manager', foreignKey: 'managerId' });
Project.hasMany(Expense, { as: 'expenses', foreignKey: 'projectId' });
Project.hasMany(Indicator, { as: 'indicators', foreignKey: 'projectId' });
Project.hasMany(Report, { as: 'reports', foreignKey: 'projectId' });

// Expense associations
Expense.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });
Expense.belongsTo(User, { as: 'approver', foreignKey: 'approvedBy' });

// Staff associations
Staff.belongsTo(User, { as: 'user', foreignKey: 'userId' });

// Indicator associations
Indicator.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });

// Report associations
Report.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Report.belongsTo(User, { as: 'editor', foreignKey: 'lastEditedBy' });
Report.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });

// Proposal associations
Proposal.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Proposal.belongsTo(User, { as: 'editor', foreignKey: 'lastEditedBy' });
Proposal.belongsTo(Project, { as: 'linkedProject', foreignKey: 'linkedProjectId' });

// OrphanNeed associations - Temporarily disabled
// OrphanNeed.belongsTo(Orphan, { as: 'orphan', foreignKey: 'orphanId' });
// OrphanNeed.belongsTo(User, { as: 'recorder', foreignKey: 'recordedBy' });
// OrphanNeed.belongsTo(User, { as: 'approver', foreignKey: 'approvedBy' });

// OrphanVisitLog associations
OrphanVisitLog.belongsTo(Orphan, { as: 'orphan', foreignKey: 'orphanId' });
OrphanVisitLog.belongsTo(User, { as: 'coordinator', foreignKey: 'coordinatorId' });
OrphanVisitLog.hasOne(OrphanProgressRating, { as: 'rating', foreignKey: 'visitLogId' });

// OrphanProgressRating associations
OrphanProgressRating.belongsTo(OrphanVisitLog, { as: 'visitLog', foreignKey: 'visitLogId' });
OrphanProgressRating.belongsTo(Orphan, { as: 'orphan', foreignKey: 'orphanId' });

// GeneratedOrphanReport associations
GeneratedOrphanReport.belongsTo(Orphan, { as: 'orphan', foreignKey: 'orphanId' });
GeneratedOrphanReport.belongsTo(User, { as: 'generator', foreignKey: 'generatedBy' });
GeneratedOrphanReport.belongsTo(Partner, { as: 'partner', foreignKey: 'partnerId' });

// ============================================
// CAMPAIGN MODEL
// ============================================
const Campaign = sequelize.define('Campaign', {
  campaignCode: { type: DataTypes.STRING(50), unique: true, allowNull: false, field: 'campaign_code' },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  type: { type: DataTypes.STRING(100) },
  category: { type: DataTypes.STRING(100) },
  targetAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'target_amount' },
  raisedAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'raised_amount' },
  status: { type: DataTypes.STRING(50), defaultValue: 'Draft' },
  startDate: { type: DataTypes.DATEONLY, field: 'start_date' },
  endDate: { type: DataTypes.DATEONLY, field: 'end_date' },
  imageUrl: { type: DataTypes.STRING(500), field: 'image_url' },
  videoUrl: { type: DataTypes.STRING(500), field: 'video_url' },
  location: { type: DataTypes.STRING(200) },
  beneficiaries: { type: DataTypes.INTEGER, defaultValue: 0 },
  approvalStatus: { type: DataTypes.STRING(50), defaultValue: 'Pending', field: 'approval_status' },
  approvedBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'approved_by' },
  approvalDate: { type: DataTypes.DATE, field: 'approval_date' },
  createdBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'created_by' }
}, {
  tableName: 'campaigns',
  timestamps: true,
  underscored: true
});

// ============================================
// DONATION MODEL
// ============================================
const Donation = sequelize.define('Donation', {
  donationCode: { type: DataTypes.STRING(50), unique: true, allowNull: false, field: 'donation_code' },
  campaignId: { type: DataTypes.INTEGER, references: { model: 'campaigns', key: 'id' }, field: 'campaign_id' },
  donorName: { type: DataTypes.STRING(200), allowNull: false, field: 'donor_name' },
  donorEmail: { type: DataTypes.STRING(100), field: 'donor_email' },
  donorPhone: { type: DataTypes.STRING(20), field: 'donor_phone' },
  donorType: { type: DataTypes.STRING(50), field: 'donor_type' },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  currency: { type: DataTypes.STRING(10), defaultValue: 'LKR' },
  paymentMethod: { type: DataTypes.STRING(50), field: 'payment_method' },
  paymentStatus: { type: DataTypes.STRING(50), defaultValue: 'Pending', field: 'payment_status' },
  transactionId: { type: DataTypes.STRING(100), field: 'transaction_id' },
  receiptNumber: { type: DataTypes.STRING(50), field: 'receipt_number' },
  isAnonymous: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_anonymous' },
  message: { type: DataTypes.TEXT },
  donationDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'donation_date' }
}, {
  tableName: 'donations',
  timestamps: true,
  underscored: true
});

// ============================================
// JOB POSTING MODEL
// ============================================
const JobPosting = sequelize.define('JobPosting', {
  jobCode: { type: DataTypes.STRING(50), unique: true, allowNull: false, field: 'job_code' },
  title: { type: DataTypes.STRING(200), allowNull: false },
  department: { type: DataTypes.STRING(100) },
  location: { type: DataTypes.STRING(200) },
  employmentType: { type: DataTypes.STRING(50), field: 'employment_type' },
  salaryRange: { type: DataTypes.STRING(100), field: 'salary_range' },
  positionsAvailable: { type: DataTypes.INTEGER, defaultValue: 1, field: 'positions_available' },
  description: { type: DataTypes.TEXT },
  requirements: { type: DataTypes.TEXT },
  responsibilities: { type: DataTypes.TEXT },
  qualifications: { type: DataTypes.TEXT },
  benefits: { type: DataTypes.TEXT },
  applicationDeadline: { type: DataTypes.DATEONLY, field: 'application_deadline' },
  status: { type: DataTypes.STRING(50), defaultValue: 'Open' },
  postedDate: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW, field: 'posted_date' },
  createdBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'created_by' }
}, {
  tableName: 'job_postings',
  timestamps: true,
  underscored: true
});

// ============================================
// JOB APPLICATION MODEL
// ============================================
const JobApplication = sequelize.define('JobApplication', {
  jobId: { type: DataTypes.INTEGER, references: { model: 'job_postings', key: 'id' }, field: 'job_id' },
  applicantName: { type: DataTypes.STRING(200), allowNull: false, field: 'applicant_name' },
  applicantEmail: { type: DataTypes.STRING(100), allowNull: false, field: 'applicant_email' },
  applicantPhone: { type: DataTypes.STRING(20), field: 'applicant_phone' },
  coverLetter: { type: DataTypes.TEXT, field: 'cover_letter' },
  resumeUrl: { type: DataTypes.STRING(500), field: 'resume_url' },
  status: { type: DataTypes.STRING(50), defaultValue: 'Submitted' },
  applicationDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'application_date' },
  reviewedBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'reviewed_by' },
  reviewNotes: { type: DataTypes.TEXT, field: 'review_notes' }
}, {
  tableName: 'job_applications',
  timestamps: true,
  underscored: true
});

// ============================================
// VENDOR CALL MODEL
// ============================================
const VendorCall = sequelize.define('VendorCall', {
  tenderCode: { type: DataTypes.STRING(50), unique: true, allowNull: false, field: 'tender_code' },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  category: { type: DataTypes.STRING(100) },
  type: { type: DataTypes.STRING(100) },
  budgetRange: { type: DataTypes.STRING(100), field: 'budget_range' },
  requirements: { type: DataTypes.TEXT },
  submissionDeadline: { type: DataTypes.DATE, field: 'submission_deadline' },
  openingDate: { type: DataTypes.DATE, field: 'opening_date' },
  status: { type: DataTypes.STRING(50), defaultValue: 'Open' },
  documentUrl: { type: DataTypes.STRING(500), field: 'document_url' },
  contactPerson: { type: DataTypes.STRING(100), field: 'contact_person' },
  contactEmail: { type: DataTypes.STRING(100), field: 'contact_email' },
  contactPhone: { type: DataTypes.STRING(20), field: 'contact_phone' },
  publishedDate: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW, field: 'published_date' },
  awardedTo: { type: DataTypes.STRING(200), field: 'awarded_to' },
  awardAmount: { type: DataTypes.DECIMAL(12, 2), field: 'award_amount' },
  createdBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'created_by' }
}, {
  tableName: 'vendor_calls',
  timestamps: true,
  underscored: true
});

// ============================================
// VENDOR SUBMISSION MODEL
// ============================================
const VendorSubmission = sequelize.define('VendorSubmission', {
  vendorCallId: { type: DataTypes.INTEGER, references: { model: 'vendor_calls', key: 'id' }, field: 'vendor_call_id' },
  vendorName: { type: DataTypes.STRING(200), allowNull: false, field: 'vendor_name' },
  vendorEmail: { type: DataTypes.STRING(100), field: 'vendor_email' },
  vendorPhone: { type: DataTypes.STRING(20), field: 'vendor_phone' },
  proposalDocumentUrl: { type: DataTypes.STRING(500), field: 'proposal_document_url' },
  quotedAmount: { type: DataTypes.DECIMAL(12, 2), field: 'quoted_amount' },
  status: { type: DataTypes.STRING(50), defaultValue: 'Submitted' },
  submissionDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'submission_date' },
  reviewedBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'reviewed_by' },
  reviewNotes: { type: DataTypes.TEXT, field: 'review_notes' }
}, {
  tableName: 'vendor_submissions',
  timestamps: true,
  underscored: true
});

// ============================================
// SOCIAL MEDIA POST MODEL
// ============================================
const SocialMediaPost = sequelize.define('SocialMediaPost', {
  postCode: { type: DataTypes.STRING(50), unique: true, allowNull: false, field: 'post_code' },
  title: { type: DataTypes.STRING(200) },
  content: { type: DataTypes.TEXT, allowNull: false },
  platforms: { type: DataTypes.JSON },
  mediaType: { type: DataTypes.STRING(50), field: 'media_type' },
  mediaUrls: { type: DataTypes.JSON, field: 'media_urls' },
  scheduledTime: { type: DataTypes.DATE, field: 'scheduled_time' },
  publishedTime: { type: DataTypes.DATE, field: 'published_time' },
  status: { type: DataTypes.STRING(50), defaultValue: 'Draft' },
  engagementStats: { type: DataTypes.JSON, field: 'engagement_stats' },
  campaignId: { type: DataTypes.INTEGER, references: { model: 'campaigns', key: 'id' }, field: 'campaign_id' },
  createdBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'created_by' }
}, {
  tableName: 'social_media_posts',
  timestamps: true,
  underscored: true
});

// ============================================
// SOCIAL MEDIA ENGAGEMENT MODEL
// ============================================
const SocialMediaEngagement = sequelize.define('SocialMediaEngagement', {
  postId: { type: DataTypes.INTEGER, references: { model: 'social_media_posts', key: 'id' }, field: 'post_id' },
  platform: { type: DataTypes.STRING(50) },
  engagementType: { type: DataTypes.STRING(50), field: 'engagement_type' },
  engagementCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'engagement_count' },
  engagementDate: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW, field: 'engagement_date' }
}, {
  tableName: 'social_media_engagement',
  timestamps: true,
  underscored: true
});

// ============================================
// COMPLIANCE DOCUMENT MODEL
// ============================================
const ComplianceDocument = sequelize.define('ComplianceDocument', {
  documentCode: { type: DataTypes.STRING(50), unique: true, allowNull: false, field: 'document_code' },
  title: { type: DataTypes.STRING(200), allowNull: false },
  category: { type: DataTypes.STRING(100) },
  description: { type: DataTypes.TEXT },
  documentUrl: { type: DataTypes.STRING(500), field: 'document_url' },
  issueDate: { type: DataTypes.DATEONLY, field: 'issue_date' },
  expiryDate: { type: DataTypes.DATEONLY, field: 'expiry_date' },
  status: { type: DataTypes.STRING(50), defaultValue: 'Active' },
  complianceArea: { type: DataTypes.STRING(100), field: 'compliance_area' },
  responsiblePerson: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'responsible_person' },
  reviewFrequency: { type: DataTypes.STRING(50), field: 'review_frequency' },
  lastReviewDate: { type: DataTypes.DATEONLY, field: 'last_review_date' },
  nextReviewDate: { type: DataTypes.DATEONLY, field: 'next_review_date' },
  notes: { type: DataTypes.TEXT },
  createdBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'created_by' }
}, {
  tableName: 'compliance_documents',
  timestamps: true,
  underscored: true
});

// ============================================
// SAFEGUARDING POLICY MODEL
// ============================================
const SafeguardingPolicy = sequelize.define('SafeguardingPolicy', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  policyName: { type: DataTypes.STRING(200), allowNull: false, field: 'policy_name' },
  version: { type: DataTypes.STRING(20), allowNull: false },
  category: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT },
  effectiveDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'effective_date' },
  reviewDate: { type: DataTypes.DATEONLY, field: 'review_date' },
  status: { type: DataTypes.ENUM('Active', 'Archived', 'Draft'), defaultValue: 'Draft' },
  documentUrl: { type: DataTypes.STRING(500), field: 'document_url' },
  approvedBy: { type: DataTypes.STRING(100), field: 'approved_by' },
  approvalDate: { type: DataTypes.DATEONLY, field: 'approval_date' },
  acknowledgedBy: { type: DataTypes.JSON, defaultValue: [], field: 'acknowledged_by' },
  createdBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'created_by' }
}, {
  tableName: 'safeguarding_policies',
  timestamps: true,
  underscored: true
});

// ============================================
// SAFEGUARDING INCIDENT MODEL
// ============================================
const SafeguardingIncident = sequelize.define('SafeguardingIncident', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  incidentCode: { type: DataTypes.STRING(50), unique: true, allowNull: false, field: 'incident_code' },
  incidentType: { type: DataTypes.STRING(100), allowNull: false, field: 'incident_type' },
  severity: { type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'), allowNull: false },
  reportedDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'reported_date' },
  incidentDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'incident_date' },
  location: { type: DataTypes.STRING(200) },
  reportedBy: { type: DataTypes.STRING(100), allowNull: false, field: 'reported_by' },
  personInvolved: { type: DataTypes.STRING(100), field: 'person_involved' },
  description: { type: DataTypes.TEXT, allowNull: false },
  immediateAction: { type: DataTypes.TEXT, field: 'immediate_action' },
  status: { type: DataTypes.ENUM('Under Investigation', 'In Progress', 'Resolved', 'Closed'), defaultValue: 'Under Investigation' },
  investigationNotes: { type: DataTypes.TEXT, field: 'investigation_notes' },
  actionTaken: { type: DataTypes.TEXT, field: 'action_taken' },
  assignedTo: { type: DataTypes.STRING(100), field: 'assigned_to' },
  resolvedDate: { type: DataTypes.DATEONLY, field: 'resolved_date' },
  closedDate: { type: DataTypes.DATEONLY, field: 'closed_date' },
  followUpRequired: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'follow_up_required' },
  followUpDate: { type: DataTypes.DATEONLY, field: 'follow_up_date' },
  confidential: { type: DataTypes.BOOLEAN, defaultValue: true },
  createdBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'created_by' }
}, {
  tableName: 'safeguarding_incidents',
  timestamps: true,
  underscored: true
});

// ============================================
// BACKGROUND CHECK MODEL
// ============================================
const BackgroundCheck = sequelize.define('BackgroundCheck', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  staffId: { type: DataTypes.INTEGER, references: { model: 'staff', key: 'id' }, field: 'staff_id' },
  staffName: { type: DataTypes.STRING(100), allowNull: false, field: 'staff_name' },
  position: { type: DataTypes.STRING(100), allowNull: false },
  checkType: { type: DataTypes.STRING(100), allowNull: false, field: 'check_type' },
  requestedDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'requested_date' },
  completedDate: { type: DataTypes.DATEONLY, field: 'completed_date' },
  expiryDate: { type: DataTypes.DATEONLY, field: 'expiry_date' },
  status: { type: DataTypes.ENUM('Pending', 'In Progress', 'Completed', 'Valid', 'Expired', 'Renewal Required'), defaultValue: 'Pending' },
  result: { type: DataTypes.ENUM('Clear', 'Concerns Identified', 'Not Cleared'), field: 'result' },
  referenceNumber: { type: DataTypes.STRING(100), field: 'reference_number' },
  provider: { type: DataTypes.STRING(100) },
  certificateUrl: { type: DataTypes.STRING(500), field: 'certificate_url' },
  renewalDue: { type: DataTypes.INTEGER, field: 'renewal_due' },
  notes: { type: DataTypes.TEXT },
  verifiedBy: { type: DataTypes.STRING(100), field: 'verified_by' },
  createdBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'created_by' }
}, {
  tableName: 'background_checks',
  timestamps: true,
  underscored: true
});

// ============================================
// COMPLIANCE TRAINING MODEL
// ============================================
const ComplianceTraining = sequelize.define('ComplianceTraining', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  trainingName: { type: DataTypes.STRING(200), allowNull: false, field: 'training_name' },
  trainingType: { type: DataTypes.STRING(100), allowNull: false, field: 'training_type' },
  description: { type: DataTypes.TEXT },
  trainingDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'training_date' },
  duration: { type: DataTypes.INTEGER },
  trainer: { type: DataTypes.STRING(100) },
  attendees: { type: DataTypes.JSON, defaultValue: [] },
  totalAttendees: { type: DataTypes.INTEGER, defaultValue: 0, field: 'total_attendees' },
  certificateIssued: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'certificate_issued' },
  expiryMonths: { type: DataTypes.INTEGER, field: 'expiry_months' },
  materials: { type: DataTypes.JSON, defaultValue: [] },
  evaluationScore: { type: DataTypes.DECIMAL(5, 2), field: 'evaluation_score' },
  feedback: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('Scheduled', 'Completed', 'Cancelled'), defaultValue: 'Scheduled' },
  createdBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'created_by' }
}, {
  tableName: 'compliance_trainings',
  timestamps: true,
  underscored: true
});

// ============================================
// DATA PROTECTION RECORD MODEL
// ============================================
const DataProtectionRecord = sequelize.define('DataProtectionRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  recordType: { type: DataTypes.ENUM('Consent', 'Data Access Request', 'Data Breach', 'Audit'), allowNull: false, field: 'record_type' },
  recordCode: { type: DataTypes.STRING(50), unique: true, allowNull: false, field: 'record_code' },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  recordDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'record_date' },
  status: { type: DataTypes.STRING(50), defaultValue: 'Open' },

  // Consent specific fields
  dataSubject: { type: DataTypes.STRING(100), field: 'data_subject' },
  consentType: { type: DataTypes.STRING(100), field: 'consent_type' },
  consentGiven: { type: DataTypes.BOOLEAN, field: 'consent_given' },
  consentDate: { type: DataTypes.DATEONLY, field: 'consent_date' },
  consentWithdrawnDate: { type: DataTypes.DATEONLY, field: 'consent_withdrawn_date' },

  // Data Access Request specific fields
  requesterName: { type: DataTypes.STRING(100), field: 'requester_name' },
  requestDate: { type: DataTypes.DATEONLY, field: 'request_date' },
  responseDeadline: { type: DataTypes.DATEONLY, field: 'response_deadline' },
  responseDate: { type: DataTypes.DATEONLY, field: 'response_date' },

  // Data Breach specific fields
  breachType: { type: DataTypes.STRING(100), field: 'breach_type' },
  breachDate: { type: DataTypes.DATEONLY, field: 'breach_date' },
  dataAffected: { type: DataTypes.TEXT, field: 'data_affected' },
  individualsAffected: { type: DataTypes.INTEGER, field: 'individuals_affected' },
  breachReportedToAuthority: { type: DataTypes.BOOLEAN, field: 'breach_reported_to_authority' },
  authorityNotificationDate: { type: DataTypes.DATEONLY, field: 'authority_notification_date' },
  remediationSteps: { type: DataTypes.TEXT, field: 'remediation_steps' },

  // Audit specific fields
  auditDate: { type: DataTypes.DATEONLY, field: 'audit_date' },
  auditor: { type: DataTypes.STRING(100) },
  findings: { type: DataTypes.TEXT },
  recommendations: { type: DataTypes.TEXT },
  nextAuditDate: { type: DataTypes.DATEONLY, field: 'next_audit_date' },

  assignedTo: { type: DataTypes.STRING(100), field: 'assigned_to' },
  completedDate: { type: DataTypes.DATEONLY, field: 'completed_date' },
  notes: { type: DataTypes.TEXT },
  createdBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'created_by' }
}, {
  tableName: 'data_protection_records',
  timestamps: true,
  underscored: true
});

// ============================================
// ATTENDANCE MODEL
// ============================================
const Attendance = sequelize.define('Attendance', {
  staffId: { type: DataTypes.INTEGER, references: { model: 'staff', key: 'id' }, field: 'staff_id' },
  attendanceDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'attendance_date' },
  checkInTime: { type: DataTypes.TIME, field: 'check_in_time' },
  checkOutTime: { type: DataTypes.TIME, field: 'check_out_time' },
  status: { type: DataTypes.STRING(50), defaultValue: 'Present' },
  leaveType: { type: DataTypes.STRING(50), field: 'leave_type' },
  workHours: { type: DataTypes.DECIMAL(4, 2), field: 'work_hours' },
  overtimeHours: { type: DataTypes.DECIMAL(4, 2), defaultValue: 0, field: 'overtime_hours' },
  location: { type: DataTypes.STRING(100) },
  notes: { type: DataTypes.TEXT },
  approvedBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'approved_by' }
}, {
  tableName: 'attendance',
  timestamps: true,
  underscored: true
});

// ============================================
// LEAVE REQUEST MODEL
// ============================================
const LeaveRequest = sequelize.define('LeaveRequest', {
  staffId: { type: DataTypes.INTEGER, references: { model: 'staff', key: 'id' }, field: 'staff_id' },
  leaveType: { type: DataTypes.STRING(50), allowNull: false, field: 'leave_type' },
  startDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'start_date' },
  endDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'end_date' },
  daysCount: { type: DataTypes.DECIMAL(3, 1), field: 'days_count' },
  reason: { type: DataTypes.TEXT },
  status: { type: DataTypes.STRING(50), defaultValue: 'Pending' },
  approvedBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'approved_by' },
  approvalDate: { type: DataTypes.DATE, field: 'approval_date' },
  rejectionReason: { type: DataTypes.TEXT, field: 'rejection_reason' }
}, {
  tableName: 'leave_requests',
  timestamps: true,
  underscored: true
});

// ============================================
// NEW MODEL ASSOCIATIONS
// ============================================
// Campaign associations
Campaign.hasMany(Donation, { as: 'donations', foreignKey: 'campaignId' });
Campaign.hasMany(SocialMediaPost, { as: 'socialPosts', foreignKey: 'campaignId' });
Campaign.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Campaign.belongsTo(User, { as: 'approver', foreignKey: 'approvedBy' });

// Donation associations
Donation.belongsTo(Campaign, { as: 'campaign', foreignKey: 'campaignId' });

// JobPosting associations
JobPosting.hasMany(JobApplication, { as: 'applications', foreignKey: 'jobId' });
JobPosting.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

// JobApplication associations
JobApplication.belongsTo(JobPosting, { as: 'job', foreignKey: 'jobId' });
JobApplication.belongsTo(User, { as: 'reviewer', foreignKey: 'reviewedBy' });

// VendorCall associations
VendorCall.hasMany(VendorSubmission, { as: 'submissions', foreignKey: 'vendorCallId' });
VendorCall.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

// VendorSubmission associations
VendorSubmission.belongsTo(VendorCall, { as: 'vendorCall', foreignKey: 'vendorCallId' });
VendorSubmission.belongsTo(User, { as: 'reviewer', foreignKey: 'reviewedBy' });

// SocialMediaPost associations
SocialMediaPost.hasMany(SocialMediaEngagement, { as: 'engagement', foreignKey: 'postId' });
SocialMediaPost.belongsTo(Campaign, { as: 'campaign', foreignKey: 'campaignId' });
SocialMediaPost.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

// SocialMediaEngagement associations
SocialMediaEngagement.belongsTo(SocialMediaPost, { as: 'post', foreignKey: 'postId' });

// ComplianceDocument associations
ComplianceDocument.belongsTo(User, { as: 'responsible', foreignKey: 'responsiblePerson' });
ComplianceDocument.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

// Attendance associations
Attendance.belongsTo(Staff, { as: 'staff', foreignKey: 'staffId' });
Attendance.belongsTo(User, { as: 'approver', foreignKey: 'approvedBy' });

// LeaveRequest associations
LeaveRequest.belongsTo(Staff, { as: 'staff', foreignKey: 'staffId' });
LeaveRequest.belongsTo(User, { as: 'approver', foreignKey: 'approvedBy' });

// FINANCE MODELS
// ============================================

// Invoice Model
const Invoice = sequelize.define('Invoice', {
  invoiceNumber: { type: DataTypes.STRING(50), unique: true, allowNull: false, field: 'invoice_number' },
  invoiceDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'invoice_date' },
  dueDate: { type: DataTypes.DATEONLY, field: 'due_date' },
  customerName: { type: DataTypes.STRING(200), field: 'customer_name' },
  customerEmail: { type: DataTypes.STRING(100), field: 'customer_email' },
  customerAddress: { type: DataTypes.TEXT, field: 'customer_address' },
  projectId: { type: DataTypes.INTEGER, references: { model: 'projects', key: 'id' }, field: 'project_id' },
  proposalId: { type: DataTypes.INTEGER, references: { model: 'proposals', key: 'id' }, field: 'proposal_id' },
  partnerId: { type: DataTypes.INTEGER, references: { model: 'partners', key: 'id' }, field: 'partner_id' },
  subtotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  taxAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'tax_amount' },
  discountAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'discount_amount' },
  totalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, field: 'total_amount' },
  paidAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'paid_amount' },
  balanceDue: { type: DataTypes.DECIMAL(12, 2), field: 'balance_due' },
  currency: { type: DataTypes.STRING(10), defaultValue: 'LKR' },
  status: { type: DataTypes.STRING(50), defaultValue: 'Draft' },
  paymentTerms: { type: DataTypes.STRING(100), field: 'payment_terms' },
  notes: { type: DataTypes.TEXT },
  lineItems: { type: DataTypes.JSON, field: 'line_items' },
  createdBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'created_by' }
}, { tableName: 'invoices', timestamps: true, underscored: true });

// Bill Model
const Bill = sequelize.define('Bill', {
  billNumber: { type: DataTypes.STRING(50), unique: true, allowNull: false, field: 'bill_number' },
  billDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'bill_date' },
  dueDate: { type: DataTypes.DATEONLY, field: 'due_date' },
  vendorName: { type: DataTypes.STRING(200), allowNull: false, field: 'vendor_name' },
  vendorEmail: { type: DataTypes.STRING(100), field: 'vendor_email' },
  vendorAddress: { type: DataTypes.TEXT, field: 'vendor_address' },
  projectId: { type: DataTypes.INTEGER, references: { model: 'projects', key: 'id' }, field: 'project_id' },
  subtotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  taxAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'tax_amount' },
  totalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, field: 'total_amount' },
  paidAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'paid_amount' },
  balanceDue: { type: DataTypes.DECIMAL(12, 2), field: 'balance_due' },
  currency: { type: DataTypes.STRING(10), defaultValue: 'LKR' },
  status: { type: DataTypes.STRING(50), defaultValue: 'Pending' },
  paymentMethod: { type: DataTypes.STRING(50), field: 'payment_method' },
  referenceNumber: { type: DataTypes.STRING(100), field: 'reference_number' },
  notes: { type: DataTypes.TEXT },
  lineItems: { type: DataTypes.JSON, field: 'line_items' },
  createdBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'created_by' }
}, { tableName: 'bills', timestamps: true, underscored: true });

// PurchaseOrder Model
const PurchaseOrder = sequelize.define('PurchaseOrder', {
  poNumber: { type: DataTypes.STRING(50), unique: true, allowNull: false, field: 'po_number' },
  requestDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'request_date' },
  requiredDate: { type: DataTypes.DATEONLY, field: 'required_date' },
  vendorName: { type: DataTypes.STRING(200), allowNull: false, field: 'vendor_name' },
  vendorContact: { type: DataTypes.STRING(100), field: 'vendor_contact' },
  projectId: { type: DataTypes.INTEGER, references: { model: 'projects', key: 'id' }, field: 'project_id' },
  department: { type: DataTypes.STRING(100) },
  requestorName: { type: DataTypes.STRING(100), field: 'requestor_name' },
  totalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, field: 'total_amount' },
  currency: { type: DataTypes.STRING(10), defaultValue: 'LKR' },
  status: { type: DataTypes.STRING(50), defaultValue: 'Pending' },
  approvalStatus: { type: DataTypes.STRING(50), defaultValue: 'Pending', field: 'approval_status' },
  approvedBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'approved_by' },
  approvalDate: { type: DataTypes.DATE, field: 'approval_date' },
  lineItems: { type: DataTypes.JSON, field: 'line_items' },
  deliveryAddress: { type: DataTypes.TEXT, field: 'delivery_address' },
  specialInstructions: { type: DataTypes.TEXT, field: 'special_instructions' },
  createdBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'created_by' }
}, { tableName: 'purchase_orders', timestamps: true, underscored: true });

// ChartOfAccounts Model
const ChartOfAccounts = sequelize.define('ChartOfAccounts', {
  accountCode: { type: DataTypes.STRING(50), unique: true, allowNull: false, field: 'account_code' },
  accountName: { type: DataTypes.STRING(200), allowNull: false, field: 'account_name' },
  accountType: { type: DataTypes.STRING(50), allowNull: false, field: 'account_type' },
  category: { type: DataTypes.STRING(100) },
  parentAccountId: { type: DataTypes.INTEGER, references: { model: 'chart_of_accounts', key: 'id' }, field: 'parent_account_id' },
  description: { type: DataTypes.TEXT },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  balance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  currency: { type: DataTypes.STRING(10), defaultValue: 'LKR' }
}, { tableName: 'chart_of_accounts', timestamps: true, underscored: true });

// JournalEntry Model
const JournalEntry = sequelize.define('JournalEntry', {
  entryNumber: { type: DataTypes.STRING(50), unique: true, allowNull: false, field: 'entry_number' },
  entryDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'entry_date' },
  reference: { type: DataTypes.STRING(100) },
  description: { type: DataTypes.TEXT },
  totalDebit: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0, field: 'total_debit' },
  totalCredit: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0, field: 'total_credit' },
  status: { type: DataTypes.STRING(50), defaultValue: 'Draft' },
  postedDate: { type: DataTypes.DATE, field: 'posted_date' },
  reversedEntryId: { type: DataTypes.INTEGER, references: { model: 'journal_entries', key: 'id' }, field: 'reversed_entry_id' },
  lineItems: { type: DataTypes.JSON, field: 'line_items' },
  createdBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'created_by' }
}, { tableName: 'journal_entries', timestamps: true, underscored: true });

// BankAccount Model
const BankAccount = sequelize.define('BankAccount', {
  accountName: { type: DataTypes.STRING(200), allowNull: false, field: 'account_name' },
  bankName: { type: DataTypes.STRING(200), allowNull: false, field: 'bank_name' },
  accountNumber: { type: DataTypes.STRING(100), allowNull: false, field: 'account_number' },
  accountHolderName: { type: DataTypes.STRING(200), field: 'account_holder_name' },
  branchCode: { type: DataTypes.STRING(50), field: 'branch_code' },
  swiftCode: { type: DataTypes.STRING(50), field: 'swift_code' },
  currency: { type: DataTypes.STRING(10), defaultValue: 'LKR' },
  currentBalance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0, field: 'current_balance' },
  openingBalance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0, field: 'opening_balance' },
  openingDate: { type: DataTypes.DATEONLY, field: 'opening_date' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  accountType: { type: DataTypes.STRING(50), field: 'account_type' },
  notes: { type: DataTypes.TEXT }
}, { tableName: 'bank_accounts', timestamps: true, underscored: true });

// BankTransaction Model
const BankTransaction = sequelize.define('BankTransaction', {
  transactionDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'transaction_date' },
  bankAccountId: { type: DataTypes.INTEGER, references: { model: 'bank_accounts', key: 'id' }, field: 'bank_account_id' },
  transactionType: { type: DataTypes.STRING(50), allowNull: false, field: 'transaction_type' },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  referenceNumber: { type: DataTypes.STRING(100), field: 'reference_number' },
  payeePayer: { type: DataTypes.STRING(200), field: 'payee_payer' },
  description: { type: DataTypes.TEXT },
  category: { type: DataTypes.STRING(100) },
  isReconciled: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_reconciled' },
  reconciledDate: { type: DataTypes.DATEONLY, field: 'reconciled_date' },
  statementBalance: { type: DataTypes.DECIMAL(15, 2), field: 'statement_balance' },
  runningBalance: { type: DataTypes.DECIMAL(15, 2), field: 'running_balance' },
  createdBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'created_by' }
}, { tableName: 'bank_transactions', timestamps: true, underscored: true });

// Budget Model
const Budget = sequelize.define('Budget', {
  budgetName: { type: DataTypes.STRING(200), allowNull: false, field: 'budget_name' },
  fiscalYear: { type: DataTypes.STRING(20), allowNull: false, field: 'fiscal_year' },
  startDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'start_date' },
  endDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'end_date' },
  projectId: { type: DataTypes.INTEGER, references: { model: 'projects', key: 'id' }, field: 'project_id' },
  department: { type: DataTypes.STRING(100) },
  totalBudget: { type: DataTypes.DECIMAL(15, 2), allowNull: false, field: 'total_budget' },
  allocatedAmount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0, field: 'allocated_amount' },
  spentAmount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0, field: 'spent_amount' },
  remainingAmount: { type: DataTypes.DECIMAL(15, 2), field: 'remaining_amount' },
  currency: { type: DataTypes.STRING(10), defaultValue: 'LKR' },
  status: { type: DataTypes.STRING(50), defaultValue: 'Draft' },
  lineItems: { type: DataTypes.JSON, field: 'line_items' },
  notes: { type: DataTypes.TEXT },
  createdBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'created_by' },
  approvedBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'approved_by' },
  approvalDate: { type: DataTypes.DATE, field: 'approval_date' }
}, { tableName: 'budgets', timestamps: true, underscored: true });

// Payroll Model
const Payroll = sequelize.define('Payroll', {
  payrollCode: { type: DataTypes.STRING(50), unique: true, allowNull: false, field: 'payroll_code' },
  staffId: { type: DataTypes.INTEGER, references: { model: 'staff', key: 'id' }, field: 'staff_id' },
  payPeriodStart: { type: DataTypes.DATEONLY, allowNull: false, field: 'pay_period_start' },
  payPeriodEnd: { type: DataTypes.DATEONLY, allowNull: false, field: 'pay_period_end' },
  payDate: { type: DataTypes.DATEONLY, field: 'pay_date' },
  basicSalary: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'basic_salary' },
  allowances: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  overtimeAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'overtime_amount' },
  bonuses: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  deductions: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  taxDeduction: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'tax_deduction' },
  epfDeduction: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'epf_deduction' },
  etfDeduction: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'etf_deduction' },
  grossPay: { type: DataTypes.DECIMAL(10, 2), field: 'gross_pay' },
  netPay: { type: DataTypes.DECIMAL(10, 2), field: 'net_pay' },
  status: { type: DataTypes.STRING(50), defaultValue: 'Pending' },
  paymentMethod: { type: DataTypes.STRING(50), field: 'payment_method' },
  paymentReference: { type: DataTypes.STRING(100), field: 'payment_reference' },
  notes: { type: DataTypes.TEXT },
  createdBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'created_by' },
  processedBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'processed_by' },
  processedDate: { type: DataTypes.DATE, field: 'processed_date' }
}, { tableName: 'payroll', timestamps: true, underscored: true });

// GrantReceivable Model
const GrantReceivable = sequelize.define('GrantReceivable', {
  grantCode: { type: DataTypes.STRING(50), unique: true, allowNull: false, field: 'grant_code' },
  grantName: { type: DataTypes.STRING(200), allowNull: false, field: 'grant_name' },
  donorId: { type: DataTypes.INTEGER, references: { model: 'partners', key: 'id' }, field: 'donor_id' },
  projectId: { type: DataTypes.INTEGER, references: { model: 'projects', key: 'id' }, field: 'project_id' },
  proposalId: { type: DataTypes.INTEGER, references: { model: 'proposals', key: 'id' }, field: 'proposal_id' },
  totalAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, field: 'total_amount' },
  receivedAmount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0, field: 'received_amount' },
  balanceAmount: { type: DataTypes.DECIMAL(15, 2), field: 'balance_amount' },
  currency: { type: DataTypes.STRING(10), defaultValue: 'LKR' },
  grantStartDate: { type: DataTypes.DATEONLY, field: 'grant_start_date' },
  grantEndDate: { type: DataTypes.DATEONLY, field: 'grant_end_date' },
  expectedReceiptDate: { type: DataTypes.DATEONLY, field: 'expected_receipt_date' },
  status: { type: DataTypes.STRING(50), defaultValue: 'Approved' },
  disbursementSchedule: { type: DataTypes.JSON, field: 'disbursement_schedule' },
  complianceRequirements: { type: DataTypes.TEXT, field: 'compliance_requirements' },
  reportingRequirements: { type: DataTypes.TEXT, field: 'reporting_requirements' },
  notes: { type: DataTypes.TEXT },
  createdBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'created_by' }
}, { tableName: 'grant_receivables', timestamps: true, underscored: true });

// GrantReceipt Model
const GrantReceipt = sequelize.define('GrantReceipt', {
  receiptCode: { type: DataTypes.STRING(50), unique: true, allowNull: false, field: 'receipt_code' },
  grantId: { type: DataTypes.INTEGER, references: { model: 'grant_receivables', key: 'id' }, field: 'grant_id' },
  receiptDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'receipt_date' },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  currency: { type: DataTypes.STRING(10), defaultValue: 'LKR' },
  paymentMethod: { type: DataTypes.STRING(50), field: 'payment_method' },
  referenceNumber: { type: DataTypes.STRING(100), field: 'reference_number' },
  bankAccountId: { type: DataTypes.INTEGER, references: { model: 'bank_accounts', key: 'id' }, field: 'bank_account_id' },
  notes: { type: DataTypes.TEXT },
  createdBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'created_by' }
}, { tableName: 'grant_receipts', timestamps: true, underscored: true });

// FixedAsset Model
const FixedAsset = sequelize.define('FixedAsset', {
  assetCode: { type: DataTypes.STRING(50), unique: true, allowNull: false, field: 'asset_code' },
  assetName: { type: DataTypes.STRING(200), allowNull: false, field: 'asset_name' },
  assetType: { type: DataTypes.STRING(100), field: 'asset_type' },
  description: { type: DataTypes.TEXT },
  purchaseDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'purchase_date' },
  purchaseCost: { type: DataTypes.DECIMAL(15, 2), allowNull: false, field: 'purchase_cost' },
  salvageValue: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0, field: 'salvage_value' },
  usefulLifeYears: { type: DataTypes.INTEGER, field: 'useful_life_years' },
  depreciationMethod: { type: DataTypes.STRING(50), defaultValue: 'Straight Line', field: 'depreciation_method' },
  accumulatedDepreciation: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0, field: 'accumulated_depreciation' },
  bookValue: { type: DataTypes.DECIMAL(15, 2), field: 'book_value' },
  location: { type: DataTypes.STRING(200) },
  department: { type: DataTypes.STRING(100) },
  custodian: { type: DataTypes.STRING(100) },
  supplier: { type: DataTypes.STRING(200) },
  serialNumber: { type: DataTypes.STRING(100), field: 'serial_number' },
  warrantyExpiry: { type: DataTypes.DATEONLY, field: 'warranty_expiry' },
  status: { type: DataTypes.STRING(50), defaultValue: 'Active' },
  disposalDate: { type: DataTypes.DATEONLY, field: 'disposal_date' },
  disposalValue: { type: DataTypes.DECIMAL(15, 2), field: 'disposal_value' },
  disposalNotes: { type: DataTypes.TEXT, field: 'disposal_notes' },
  createdBy: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' }, field: 'created_by' }
}, { tableName: 'fixed_assets', timestamps: true, underscored: true });

// Finance Model Associations
Invoice.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });
Invoice.belongsTo(Proposal, { as: 'proposal', foreignKey: 'proposalId' });
Invoice.belongsTo(Partner, { as: 'partner', foreignKey: 'partnerId' });
Invoice.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

Bill.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });
Bill.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

PurchaseOrder.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });
PurchaseOrder.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
PurchaseOrder.belongsTo(User, { as: 'approver', foreignKey: 'approvedBy' });

ChartOfAccounts.belongsTo(ChartOfAccounts, { as: 'parentAccount', foreignKey: 'parentAccountId' });
ChartOfAccounts.hasMany(ChartOfAccounts, { as: 'subAccounts', foreignKey: 'parentAccountId' });

JournalEntry.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

BankTransaction.belongsTo(BankAccount, { as: 'bankAccount', foreignKey: 'bankAccountId' });
BankTransaction.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

Budget.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });
Budget.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Budget.belongsTo(User, { as: 'approver', foreignKey: 'approvedBy' });

Payroll.belongsTo(Staff, { as: 'staff', foreignKey: 'staffId' });
Payroll.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
Payroll.belongsTo(User, { as: 'processor', foreignKey: 'processedBy' });

GrantReceivable.belongsTo(Partner, { as: 'donor', foreignKey: 'donorId' });
GrantReceivable.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });
GrantReceivable.belongsTo(Proposal, { as: 'proposal', foreignKey: 'proposalId' });
GrantReceivable.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
GrantReceivable.hasMany(GrantReceipt, { as: 'receipts', foreignKey: 'grantId' });

GrantReceipt.belongsTo(GrantReceivable, { as: 'grant', foreignKey: 'grantId' });
GrantReceipt.belongsTo(BankAccount, { as: 'bankAccount', foreignKey: 'bankAccountId' });
GrantReceipt.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

FixedAsset.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

// Partner module associations
Partner.hasMany(PartnerContribution, { as: 'contributions', foreignKey: 'partnerId' });
Partner.hasMany(PartnerCommunication, { as: 'communications', foreignKey: 'partnerId' });

PartnerContribution.belongsTo(Partner, { as: 'partner', foreignKey: 'partnerId' });
PartnerContribution.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });
PartnerContribution.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

PartnerCommunication.belongsTo(Partner, { as: 'partner', foreignKey: 'partnerId' });
PartnerCommunication.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

// Beneficiary module associations
Beneficiary.hasMany(BeneficiarySupport, { as: 'supports', foreignKey: 'beneficiaryId' });
Beneficiary.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

BeneficiarySupport.belongsTo(Beneficiary, { as: 'beneficiary', foreignKey: 'beneficiaryId' });
BeneficiarySupport.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });
BeneficiarySupport.belongsTo(Partner, { as: 'partner', foreignKey: 'partnerId' });
BeneficiarySupport.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
BeneficiarySupport.belongsTo(User, { as: 'verifier', foreignKey: 'verifiedBy' });

// HR module associations
Staff.hasMany(OnboardingRecord, { as: 'onboardingRecords', foreignKey: 'staffId' });
Staff.hasMany(AppraisalRecord, { as: 'appraisalRecords', foreignKey: 'staffId' });

OnboardingRecord.belongsTo(Staff, { as: 'staff', foreignKey: 'staffId' });
OnboardingRecord.belongsTo(User, { as: 'assignee', foreignKey: 'assignedTo' });
OnboardingRecord.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

AppraisalRecord.belongsTo(Staff, { as: 'staff', foreignKey: 'staffId' });
AppraisalRecord.belongsTo(User, { as: 'appraiserUser', foreignKey: 'appraiser' });
AppraisalRecord.belongsTo(User, { as: 'reviewerUser', foreignKey: 'reviewer' });
AppraisalRecord.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

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
  CBOVolunteer,
  CBOActivity,
  CBODueDiligence,
  CBOProposal,
  CBOProject,
  Partner,
  PartnerContribution,
  PartnerCommunication,
  Beneficiary,
  BeneficiarySupport,
  OnboardingRecord,
  AppraisalRecord,
  Indicator,
  Evaluation,
  LearningEvent,
  Complaint,
  Report,
  Proposal,
  OrphanVisitLog,
  OrphanProgressRating,
  GeneratedOrphanReport,
  Campaign,
  Donation,
  JobPosting,
  JobApplication,
  VendorCall,
  VendorSubmission,
  SocialMediaPost,
  SocialMediaEngagement,
  ComplianceDocument,
  SafeguardingPolicy,
  SafeguardingIncident,
  BackgroundCheck,
  ComplianceTraining,
  DataProtectionRecord,
  Attendance,
  LeaveRequest,
  Invoice,
  Bill,
  PurchaseOrder,
  ChartOfAccounts,
  JournalEntry,
  BankAccount,
  BankTransaction,
  Budget,
  Payroll,
  GrantReceivable,
  GrantReceipt,
  FixedAsset
};

export default {
  User,
  Orphan,
  Project,
  Expense,
  Staff,
  CBOPartner,
  CBOVolunteer,
  CBOActivity,
  CBODueDiligence,
  CBOProposal,
  CBOProject,
  Partner,
  PartnerContribution,
  PartnerCommunication,
  Beneficiary,
  BeneficiarySupport,
  OnboardingRecord,
  AppraisalRecord,
  Indicator,
  Evaluation,
  LearningEvent,
  Complaint,
  Report,
  Proposal,
  OrphanVisitLog,
  OrphanProgressRating,
  GeneratedOrphanReport,
  Campaign,
  Donation,
  JobPosting,
  JobApplication,
  VendorCall,
  VendorSubmission,
  SocialMediaPost,
  SocialMediaEngagement,
  ComplianceDocument,
  SafeguardingPolicy,
  SafeguardingIncident,
  BackgroundCheck,
  ComplianceTraining,
  DataProtectionRecord,
  Attendance,
  LeaveRequest,
  Invoice,
  Bill,
  PurchaseOrder,
  ChartOfAccounts,
  JournalEntry,
  BankAccount,
  BankTransaction,
  Budget,
  Payroll,
  GrantReceivable,
  GrantReceipt,
  FixedAsset,
  sequelize
};
