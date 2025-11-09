// Default System Settings - Can be overridden by user configuration

export const DEFAULT_SYSTEM_SETTINGS = {
  organizationName: 'GERSL (Global Education and Relief Services Lanka)',
  organizationEmail: 'info@gersl.org',
  organizationPhone: '+94 11 234 5678',
  organizationAddress: 'Colombo, Sri Lanka',
  timezone: 'Asia/Colombo',
  dateFormat: 'YYYY-MM-DD',
  currency: 'LKR',
  fiscalYearStart: 'January',
  language: 'English'
};

export const DEFAULT_NOTIFICATION_SETTINGS = {
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  notifyOnNewProposal: true,
  notifyOnApproval: true,
  notifyOnDonation: true,
  notifyOnCompliance: true,
  notifyOnDeadline: true,
  dailyDigest: false,
  weeklyReport: true,
  monthlyReport: true
};

export const DEFAULT_BACKUP_SETTINGS = {
  autoBackup: true,
  backupFrequency: 'daily',
  backupTime: '02:00',
  retentionDays: 30,
  backupLocation: 'cloud'
};

export const DEFAULT_INTEGRATION_SETTINGS = {
  accounting: {
    enabled: false,
    system: 'QuickBooks',
    syncFrequency: 'hourly',
    apiKey: ''
  },
  email: {
    enabled: false,
    provider: 'Gmail',
    smtpHost: '',
    smtpPort: 587,
    username: '',
    password: ''
  },
  payment: {
    enabled: false,
    gateway: 'Stripe',
    publicKey: '',
    secretKey: ''
  },
  storage: {
    enabled: false,
    provider: 'AWS S3',
    bucket: '',
    accessKey: '',
    secretKey: ''
  }
};

export const DEFAULT_APPEARANCE_SETTINGS = {
  theme: 'light',
  primaryColor: '#8B5CF6',
  fontSize: 'medium',
  compactMode: false,
  showAnimations: true
};

export const DEFAULT_SECURITY_SETTINGS = {
  twoFactorAuth: false,
  sessionTimeout: 30,
  passwordExpiry: 90,
  minPasswordLength: 8,
  requireSpecialChar: true,
  requireNumber: true,
  requireUppercase: true,
  loginAttempts: 5,
  lockoutDuration: 30
};

export const DEFAULT_PERFORMANCE_TARGETS = {
  // Financial Health Targets
  financial: {
    currentRatioTarget: 0,
    expenseRatioTarget: 0,
    cashReserveDaysTarget: 0,
    grantUtilizationTarget: 0
  },
  // Dashboard Performance Indicators
  dashboard: {
    projectCompletionTarget: 0,
    budgetUtilizationTarget: 0,
    orphanCoverageTarget: 0,
    partnerEngagementTarget: 0
  },
  // Orphan Care Program Targets
  orphanCare: {
    regularVisitsTarget: 0,
    healthCheckupsTarget: 0,
    educationSupportTarget: 0,
    familySupportTarget: 0
  },
  // Project Performance Targets
  projects: {
    onTimeDeliveryTarget: 0,
    budgetComplianceTarget: 0,
    avgProgressTarget: 0,
    completionRateTarget: 0
  },
  // HR Performance Targets
  hr: {
    attendanceRateTarget: 0,
    leaveApprovalTimeTarget: 0,
    gpsVerificationTarget: 0,
    assetReturnRateTarget: 0,
    vehicleUtilizationTarget: 0,
    staffSatisfactionTarget: 0
  },
  // Partner Management Targets
  partners: {
    retentionRateTarget: 0,
    communicationFrequencyTarget: 0,
    contributionGrowthTarget: 0,
    followupCompletionTarget: 0
  }
};
