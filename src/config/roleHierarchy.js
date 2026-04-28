/**
 * Role Hierarchy Configuration
 * Defines the organizational structure and relationships between roles
 * Based on GERSL's organizational hierarchy
 */

// Hierarchy Levels (1 = highest authority, 7 = lowest)
export const HIERARCHY_LEVELS = {
  GOVERNANCE: 1,      // Board of Directors
  EXECUTIVE: 2,       // CEO/Country Manager
  DIRECTOR: 3,        // Directors
  MANAGER: 4,         // Managers
  OFFICER: 5,         // Officers
  ASSISTANT: 6,       // Assistants
  COORDINATOR: 7      // Coordinators
};

// All Roles with their hierarchy information
export const ROLES = {
  // Level 1: Governance
  BOD: {
    name: 'Board of Directors',
    level: HIERARCHY_LEVELS.GOVERNANCE,
    department: 'Governance',
    canApprove: ['all'],
    reportsTo: null
  },

  // Level 2: Executive Leadership
  CEO: {
    name: 'Country Manager/CEO',
    level: HIERARCHY_LEVELS.EXECUTIVE,
    department: 'Executive',
    canApprove: ['all'],
    reportsTo: 'BOD'
  },

  // Level 3: Directors
  DIRECTOR_PROGRAMMES: {
    name: 'Director Programmes',
    level: HIERARCHY_LEVELS.DIRECTOR,
    department: 'Programmes',
    canApprove: ['projects', 'proposals', 'programme_budgets'],
    reportsTo: 'CEO'
  },

  // Level 4: Managers
  PROGRAMME_MANAGER: {
    name: 'Programme Manager',
    level: HIERARCHY_LEVELS.MANAGER,
    department: 'Programmes',
    canApprove: ['project_activities', 'field_reports'],
    reportsTo: 'DIRECTOR_PROGRAMMES'
  },

  FINANCE_MANAGER: {
    name: 'Finance Manager',
    level: HIERARCHY_LEVELS.MANAGER,
    department: 'Finance',
    canApprove: ['finance_transactions', 'budget_allocations', 'vendor_payments'],
    reportsTo: 'CEO'
  },

  FUNDRAISING_MANAGER: {
    name: 'Fundraising Manager',
    level: HIERARCHY_LEVELS.MANAGER,
    department: 'Fundraising',
    canApprove: ['campaign_budgets', 'donor_communications'],
    reportsTo: 'CEO'
  },

  HR_MANAGER: {
    name: 'HR Manager',
    level: HIERARCHY_LEVELS.MANAGER,
    department: 'HR',
    canApprove: ['leave_requests', 'recruitment', 'performance_reviews'],
    reportsTo: 'CEO'
  },

  // Level 5: Officers
  PROJECT_OFFICER_WASH: {
    name: 'Project Officer (WASH)',
    level: HIERARCHY_LEVELS.OFFICER,
    department: 'Programmes',
    specialization: 'WASH',
    canApprove: ['field_activities', 'beneficiary_registration'],
    reportsTo: 'PROGRAMME_MANAGER'
  },

  PROJECT_OFFICER_ORPHANS: {
    name: 'Project Officer (Orphans)',
    level: HIERARCHY_LEVELS.OFFICER,
    department: 'Programmes',
    specialization: 'Orphans',
    canApprove: ['orphan_registration', 'sponsorship_approval'],
    reportsTo: 'PROGRAMME_MANAGER'
  },

  PROJECT_OFFICER_LIVELIHOODS: {
    name: 'Project Officer (Livelihoods)',
    level: HIERARCHY_LEVELS.OFFICER,
    department: 'Programmes',
    specialization: 'Livelihoods',
    canApprove: ['livelihood_activities', 'beneficiary_selection'],
    reportsTo: 'PROGRAMME_MANAGER'
  },

  PROJECT_OFFICER_INFRASTRUCTURE: {
    name: 'Project Officer (Infrastructure)',
    level: HIERARCHY_LEVELS.OFFICER,
    department: 'Programmes',
    specialization: 'Infrastructure',
    canApprove: ['construction_activities', 'contractor_selection'],
    reportsTo: 'PROGRAMME_MANAGER'
  },

  PROJECT_OFFICER_EDUCATION: {
    name: 'Project Officer (Education)',
    level: HIERARCHY_LEVELS.OFFICER,
    department: 'Programmes',
    specialization: 'Education',
    canApprove: ['education_activities', 'scholarship_approval'],
    reportsTo: 'PROGRAMME_MANAGER'
  },

  PROJECT_OFFICER_WOMEN: {
    name: 'Project Officer (Women Development)',
    level: HIERARCHY_LEVELS.OFFICER,
    department: 'Programmes',
    specialization: 'Women Development',
    canApprove: ['women_activities', 'training_approval'],
    reportsTo: 'PROGRAMME_MANAGER'
  },

  FINANCE_OFFICER: {
    name: 'Finance Officer',
    level: HIERARCHY_LEVELS.OFFICER,
    department: 'Finance',
    canApprove: ['petty_cash', 'expense_verification'],
    reportsTo: 'FINANCE_MANAGER'
  },

  HR_OFFICER: {
    name: 'HR Officer',
    level: HIERARCHY_LEVELS.OFFICER,
    department: 'HR',
    canApprove: ['attendance_records', 'basic_leave_requests'],
    reportsTo: 'HR_MANAGER'
  },

  MEAL_OFFICER: {
    name: 'MEAL Officer',
    level: HIERARCHY_LEVELS.OFFICER,
    department: 'MEAL',
    canApprove: ['monitoring_reports', 'evaluation_plans'],
    reportsTo: 'PROGRAMME_MANAGER'
  },

  MEDIA_PRODUCTION_OFFICER: {
    name: 'Media Production Officer',
    level: HIERARCHY_LEVELS.OFFICER,
    department: 'Fundraising',
    canApprove: ['media_content', 'production_schedules'],
    reportsTo: 'FUNDRAISING_MANAGER'
  },

  MEDIA_OFFICER: {
    name: 'Media Officer',
    level: HIERARCHY_LEVELS.OFFICER,
    department: 'Fundraising',
    canApprove: ['social_media_posts', 'media_releases'],
    reportsTo: 'MEDIA_PRODUCTION_OFFICER'
  },

  // Level 6: Assistants
  PROJECT_ASSISTANT: {
    name: 'Project Assistant',
    level: HIERARCHY_LEVELS.ASSISTANT,
    department: 'Programmes',
    canApprove: [],
    reportsTo: 'PROJECT_OFFICER'
  },

  FINANCE_ASSISTANT: {
    name: 'Finance Assistant',
    level: HIERARCHY_LEVELS.ASSISTANT,
    department: 'Finance',
    canApprove: [],
    reportsTo: 'FINANCE_OFFICER'
  },

  FUNDRAISING_ASSISTANT: {
    name: 'Fundraising Assistant',
    level: HIERARCHY_LEVELS.ASSISTANT,
    department: 'Fundraising',
    canApprove: [],
    reportsTo: 'FUNDRAISING_MANAGER'
  },

  HR_ASSISTANT: {
    name: 'HR Assistant',
    level: HIERARCHY_LEVELS.ASSISTANT,
    department: 'HR',
    canApprove: [],
    reportsTo: 'HR_OFFICER'
  },

  // Level 7: Coordinators
  ORPHAN_COORDINATOR: {
    name: 'Orphan Coordinator',
    level: HIERARCHY_LEVELS.COORDINATOR,
    department: 'Programmes',
    specialization: 'Orphans',
    canApprove: [],
    reportsTo: 'PROJECT_ASSISTANT'
  },

  // Special Roles
  ADMIN: {
    name: 'System Administrator',
    level: 0, // Super user
    department: 'IT',
    canApprove: ['all'],
    reportsTo: null
  },

  ACCOUNTANT: {
    name: 'Accountant',
    level: HIERARCHY_LEVELS.OFFICER,
    department: 'Finance',
    canApprove: ['account_reconciliation', 'financial_reports'],
    reportsTo: 'FINANCE_MANAGER'
  },

  PROCUREMENT_MANAGER: {
    name: 'Procurement Manager',
    level: HIERARCHY_LEVELS.MANAGER,
    department: 'Finance',
    canApprove: ['vendor_selection', 'purchase_orders', 'vendor_blacklist', 'procurement_thresholds'],
    reportsTo: 'CEO'
  },

  PROCUREMENT_OFFICER: {
    name: 'Procurement Officer',
    level: HIERARCHY_LEVELS.OFFICER,
    department: 'Finance',
    canApprove: ['rfq_processing', 'goods_receipt'],
    reportsTo: 'PROCUREMENT_MANAGER'
  },

  FIELD_OFFICER: {
    name: 'Field Officer',
    level: HIERARCHY_LEVELS.OFFICER,
    department: 'Programmes',
    canApprove: ['field_visits', 'beneficiary_verification'],
    reportsTo: 'PROGRAMME_MANAGER'
  },

  GUEST: {
    name: 'Guest',
    level: 99, // Lowest level
    department: null,
    canApprove: [],
    reportsTo: null
  }
};

// Departments
export const DEPARTMENTS = {
  GOVERNANCE: 'Governance',
  EXECUTIVE: 'Executive',
  PROGRAMMES: 'Programmes',
  FINANCE: 'Finance',
  FUNDRAISING: 'Fundraising',
  HR: 'HR',
  MEAL: 'MEAL',
  IT: 'IT'
};

/**
 * Get role information by role key
 * @param {string} roleKey - Role key (e.g., 'CEO', 'FINANCE_MANAGER')
 * @returns {object|null} Role information
 */
export const getRoleInfo = (roleKey) => {
  return ROLES[roleKey] || null;
};

/**
 * Check if a role can approve a specific type of request
 * @param {string} roleKey - Role key
 * @param {string} approvalType - Type of approval (e.g., 'finance_transactions')
 * @returns {boolean}
 */
export const canApprove = (roleKey, approvalType) => {
  const role = getRoleInfo(roleKey);
  if (!role) return false;

  // Admin and BOD can approve everything
  if (role.canApprove.includes('all')) return true;

  return role.canApprove.includes(approvalType);
};

/**
 * Check if role1 is subordinate to role2 (role1 reports to role2 or its superiors)
 * @param {string} role1Key - Subordinate role key
 * @param {string} role2Key - Superior role key
 * @returns {boolean}
 */
export const isSubordinate = (role1Key, role2Key) => {
  const role1 = getRoleInfo(role1Key);
  const role2 = getRoleInfo(role2Key);

  if (!role1 || !role2) return false;

  // Same role is not subordinate
  if (role1Key === role2Key) return false;

  // Check hierarchy level (higher level number = lower in hierarchy)
  if (role1.level > role2.level) {
    // Traverse up the reporting chain
    let currentRole = role1;
    while (currentRole.reportsTo) {
      if (currentRole.reportsTo === role2Key) return true;
      currentRole = getRoleInfo(currentRole.reportsTo);
      if (!currentRole) break;
    }
  }

  return false;
};

/**
 * Get the approval chain for a specific approval type
 * @param {string} approvalType - Type of approval
 * @param {string} initiatorRole - Role initiating the request
 * @returns {array} Array of role keys in approval order
 */
export const getApprovalChain = (approvalType, initiatorRole) => {
  const chain = [];
  const initiator = getRoleInfo(initiatorRole);

  if (!initiator) return chain;

  // Start from immediate superior
  let currentRoleKey = initiator.reportsTo;

  while (currentRoleKey) {
    const currentRole = getRoleInfo(currentRoleKey);
    if (!currentRole) break;

    // Add to chain if this role can approve this type
    if (canApprove(currentRoleKey, approvalType)) {
      chain.push(currentRoleKey);
    }

    // Move up the hierarchy
    currentRoleKey = currentRole.reportsTo;

    // Stop at CEO or BOD level
    if (currentRole.level <= HIERARCHY_LEVELS.EXECUTIVE) {
      break;
    }
  }

  return chain;
};

/**
 * Get all roles in a department
 * @param {string} department - Department name
 * @returns {array} Array of role keys
 */
export const getRolesByDepartment = (department) => {
  return Object.keys(ROLES).filter(key => ROLES[key].department === department);
};

/**
 * Get all roles at a specific hierarchy level
 * @param {number} level - Hierarchy level
 * @returns {array} Array of role keys
 */
export const getRolesByLevel = (level) => {
  return Object.keys(ROLES).filter(key => ROLES[key].level === level);
};

/**
 * Get human-readable role name
 * @param {string} roleKey - Role key
 * @returns {string} Role name
 */
export const getRoleName = (roleKey) => {
  const role = getRoleInfo(roleKey);
  return role ? role.name : roleKey;
};

/**
 * Convert role key to display format (e.g., 'FINANCE_MANAGER' -> 'Finance Manager')
 * @param {string} roleKey - Role key
 * @returns {string} Formatted role name
 */
export const formatRoleKey = (roleKey) => {
  return roleKey
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Check if a user can access another user's data based on hierarchy
 * @param {string} accessorRole - Role trying to access
 * @param {string} targetRole - Role being accessed
 * @returns {boolean}
 */
export const canAccessUserData = (accessorRole, targetRole) => {
  const accessor = getRoleInfo(accessorRole);
  const target = getRoleInfo(targetRole);

  if (!accessor || !target) return false;

  // Admin can access all
  if (accessorRole === 'ADMIN') return true;

  // Can access own data
  if (accessorRole === targetRole) return true;

  // Can access subordinates
  if (isSubordinate(targetRole, accessorRole)) return true;

  // Same department, higher or equal level
  if (accessor.department === target.department && accessor.level <= target.level) {
    return true;
  }

  return false;
};

export default {
  HIERARCHY_LEVELS,
  ROLES,
  DEPARTMENTS,
  getRoleInfo,
  canApprove,
  isSubordinate,
  getApprovalChain,
  getRolesByDepartment,
  getRolesByLevel,
  getRoleName,
  formatRoleKey,
  canAccessUserData
};
