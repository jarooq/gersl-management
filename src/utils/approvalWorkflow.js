/**
 * Approval Workflow Engine
 * Manages multi-level approval processes based on organizational hierarchy
 */

import { getRoleInfo, getApprovalChain, isSubordinate } from '../config/roleHierarchy';

// Approval status constants
export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  IN_REVIEW: 'in_review',
};

// Approval types with their required approval levels
export const APPROVAL_TYPES = {
  // Finance approvals
  FINANCE_EXPENSE: {
    name: 'Finance Expense',
    levels: [
      { role: 'FINANCE_OFFICER', threshold: 0 },
      { role: 'FINANCE_MANAGER', threshold: 5000 },
      { role: 'CEO', threshold: 20000 },
    ],
    approvalType: 'finance_transactions',
  },
  FINANCE_PAYROLL: {
    name: 'Payroll Processing',
    levels: [
      { role: 'FINANCE_MANAGER', threshold: 0 },
      { role: 'CEO', threshold: 50000 },
    ],
    approvalType: 'finance_transactions',
  },
  FINANCE_PURCHASE_ORDER: {
    name: 'Purchase Order',
    levels: [
      { role: 'FINANCE_OFFICER', threshold: 0 },
      { role: 'FINANCE_MANAGER', threshold: 10000 },
      { role: 'CEO', threshold: 50000 },
    ],
    approvalType: 'finance_transactions',
  },

  // HR approvals
  HR_LEAVE_REQUEST: {
    name: 'Leave Request',
    levels: [
      { role: 'HR_OFFICER', threshold: 0 },
      { role: 'HR_MANAGER', threshold: 5 }, // 5+ days requires HR Manager
    ],
    approvalType: 'leave_requests',
  },
  HR_RECRUITMENT: {
    name: 'Recruitment',
    levels: [
      { role: 'HR_MANAGER', threshold: 0 },
      { role: 'CEO', threshold: 0 }, // All recruitment requires CEO approval
    ],
    approvalType: 'recruitment',
  },
  HR_PERFORMANCE_REVIEW: {
    name: 'Performance Review',
    levels: [
      { role: 'HR_MANAGER', threshold: 0 },
    ],
    approvalType: 'performance_reviews',
  },

  // Project approvals
  PROJECT_PROPOSAL: {
    name: 'Project Proposal',
    levels: [
      { role: 'PROGRAMME_MANAGER', threshold: 0 },
      { role: 'DIRECTOR_PROGRAMMES', threshold: 50000 },
      { role: 'CEO', threshold: 100000 },
    ],
    approvalType: 'projects',
  },
  PROJECT_ACTIVITY: {
    name: 'Project Activity',
    levels: [
      { role: 'PROJECT_OFFICER', threshold: 0 },
      { role: 'PROGRAMME_MANAGER', threshold: 10000 },
    ],
    approvalType: 'project_activities',
  },

  // CBO/Partner approvals
  CBO_PROPOSAL: {
    name: 'CBO Proposal',
    levels: [
      { role: 'FUNDRAISING_MANAGER', threshold: 0 }, // Initial review
      { role: 'PROGRAMME_MANAGER', threshold: 0 },
      { role: 'DIRECTOR_PROGRAMMES', threshold: 50000 },
      { role: 'CEO', threshold: 100000 },
    ],
    approvalType: 'cbo_proposals',
  },

  // Campaign approvals
  CAMPAIGN_BUDGET: {
    name: 'Campaign Budget',
    levels: [
      { role: 'FUNDRAISING_MANAGER', threshold: 0 },
      { role: 'FINANCE_MANAGER', threshold: 20000 },
      { role: 'CEO', threshold: 50000 },
    ],
    approvalType: 'campaign_budgets',
  },

  // Proposal approvals
  PROPOSAL_SUBMISSION: {
    name: 'Proposal Submission',
    levels: [
      { role: 'FUNDRAISING_MANAGER', threshold: 0 },
      { role: 'CEO', threshold: 0 }, // All proposals require CEO approval after Fundraising Manager
    ],
    approvalType: 'proposals',
  },

  // Orphan management approvals
  ORPHAN_REGISTRATION: {
    name: 'Orphan Registration',
    levels: [
      { role: 'PROJECT_OFFICER_ORPHANS', threshold: 0 },
      { role: 'PROGRAMME_MANAGER', threshold: 0 },
    ],
    approvalType: 'orphan_registration',
  },
  ORPHAN_SPONSORSHIP: {
    name: 'Orphan Sponsorship',
    levels: [
      { role: 'PROJECT_OFFICER_ORPHANS', threshold: 0 },
      { role: 'PROGRAMME_MANAGER', threshold: 0 },
    ],
    approvalType: 'sponsorship_approval',
  },
};

/**
 * Create a new approval request
 * @param {Object} params - Approval request parameters
 * @param {string} params.type - Approval type (e.g., 'FINANCE_EXPENSE')
 * @param {string} params.initiatorRole - Role of the person initiating the request
 * @param {number} params.amount - Amount/value for threshold-based approvals
 * @param {Object} params.data - Additional data for the approval request
 * @returns {Object} Approval workflow object
 */
export const createApprovalRequest = ({ type, initiatorRole, amount = 0, data = {} }) => {
  const approvalType = APPROVAL_TYPES[type];

  if (!approvalType) {
    throw new Error(`Invalid approval type: ${type}`);
  }

  // Determine required approval levels based on amount/threshold
  const requiredLevels = approvalType.levels.filter(level => amount >= level.threshold);

  // Convert role key format (e.g., 'Finance Manager' -> 'FINANCE_MANAGER')
  const initiatorRoleKey = initiatorRole.toUpperCase().replace(/\s+/g, '_');

  // Create approval steps
  const approvalSteps = requiredLevels.map((level, index) => ({
    level: index + 1,
    role: level.role,
    roleName: getRoleInfo(level.role)?.name || level.role,
    status: APPROVAL_STATUS.PENDING,
    approverUserId: null,
    approverName: null,
    approvedAt: null,
    comments: null,
    required: true,
  }));

  return {
    id: generateApprovalId(),
    type,
    typeName: approvalType.name,
    initiatorRole: initiatorRoleKey,
    amount,
    status: APPROVAL_STATUS.PENDING,
    currentLevel: 1,
    approvalSteps,
    data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Get the current pending approver role for a workflow
 * @param {Object} workflow - Approval workflow object
 * @returns {string|null} Role key of the current pending approver
 */
export const getCurrentPendingApprover = (workflow) => {
  if (workflow.status !== APPROVAL_STATUS.PENDING && workflow.status !== APPROVAL_STATUS.IN_REVIEW) {
    return null;
  }

  const currentStep = workflow.approvalSteps.find(
    step => step.level === workflow.currentLevel && step.status === APPROVAL_STATUS.PENDING
  );

  return currentStep ? currentStep.role : null;
};

/**
 * Check if a user can approve a specific workflow step
 * @param {Object} workflow - Approval workflow object
 * @param {string} userRole - User's role
 * @param {number} userId - User's ID
 * @returns {boolean}
 */
export const canUserApprove = (workflow, userRole, userId) => {
  const currentApproverRole = getCurrentPendingApprover(workflow);

  if (!currentApproverRole) {
    return false;
  }

  // Convert role format
  const userRoleKey = userRole.toUpperCase().replace(/\s+/g, '_');

  // Check if user's role matches the current approver role
  if (userRoleKey === currentApproverRole) {
    return true;
  }

  // Check if user has a higher authority role (can approve on behalf)
  const userRoleInfo = getRoleInfo(userRoleKey);
  const approverRoleInfo = getRoleInfo(currentApproverRole);

  if (userRoleInfo && approverRoleInfo) {
    // Higher level (lower number) means higher authority
    return userRoleInfo.level < approverRoleInfo.level;
  }

  return false;
};

/**
 * Approve a workflow step
 * @param {Object} workflow - Approval workflow object
 * @param {Object} approver - Approver information
 * @param {number} approver.userId - Approver's user ID
 * @param {string} approver.userName - Approver's name
 * @param {string} approver.userRole - Approver's role
 * @param {string} comments - Optional approval comments
 * @returns {Object} Updated workflow object
 */
export const approveWorkflowStep = (workflow, approver, comments = null) => {
  if (!canUserApprove(workflow, approver.userRole, approver.userId)) {
    throw new Error('User does not have permission to approve this request');
  }

  const updatedSteps = workflow.approvalSteps.map(step => {
    if (step.level === workflow.currentLevel && step.status === APPROVAL_STATUS.PENDING) {
      return {
        ...step,
        status: APPROVAL_STATUS.APPROVED,
        approverUserId: approver.userId,
        approverName: approver.userName,
        approvedAt: new Date().toISOString(),
        comments,
      };
    }
    return step;
  });

  // Check if there are more approval levels
  const nextLevel = workflow.currentLevel + 1;
  const hasMoreLevels = updatedSteps.some(step => step.level === nextLevel);

  return {
    ...workflow,
    approvalSteps: updatedSteps,
    currentLevel: hasMoreLevels ? nextLevel : workflow.currentLevel,
    status: hasMoreLevels ? APPROVAL_STATUS.IN_REVIEW : APPROVAL_STATUS.APPROVED,
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Reject a workflow
 * @param {Object} workflow - Approval workflow object
 * @param {Object} rejecter - Rejecter information
 * @param {number} rejecter.userId - Rejecter's user ID
 * @param {string} rejecter.userName - Rejecter's name
 * @param {string} rejecter.userRole - Rejecter's role
 * @param {string} reason - Rejection reason
 * @returns {Object} Updated workflow object
 */
export const rejectWorkflow = (workflow, rejecter, reason) => {
  if (!canUserApprove(workflow, rejecter.userRole, rejecter.userId)) {
    throw new Error('User does not have permission to reject this request');
  }

  const updatedSteps = workflow.approvalSteps.map(step => {
    if (step.level === workflow.currentLevel && step.status === APPROVAL_STATUS.PENDING) {
      return {
        ...step,
        status: APPROVAL_STATUS.REJECTED,
        approverUserId: rejecter.userId,
        approverName: rejecter.userName,
        approvedAt: new Date().toISOString(),
        comments: reason,
      };
    }
    return step;
  });

  return {
    ...workflow,
    approvalSteps: updatedSteps,
    status: APPROVAL_STATUS.REJECTED,
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Cancel a workflow (by initiator only)
 * @param {Object} workflow - Approval workflow object
 * @param {string} initiatorRole - Role of the person cancelling
 * @returns {Object} Updated workflow object
 */
export const cancelWorkflow = (workflow, initiatorRole) => {
  const initiatorRoleKey = initiatorRole.toUpperCase().replace(/\s+/g, '_');

  if (workflow.initiatorRole !== initiatorRoleKey) {
    throw new Error('Only the initiator can cancel this request');
  }

  return {
    ...workflow,
    status: APPROVAL_STATUS.CANCELLED,
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Get approval progress percentage
 * @param {Object} workflow - Approval workflow object
 * @returns {number} Progress percentage (0-100)
 */
export const getApprovalProgress = (workflow) => {
  const totalSteps = workflow.approvalSteps.length;
  const completedSteps = workflow.approvalSteps.filter(
    step => step.status === APPROVAL_STATUS.APPROVED
  ).length;

  return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
};

/**
 * Get approval summary
 * @param {Object} workflow - Approval workflow object
 * @returns {Object} Approval summary
 */
export const getApprovalSummary = (workflow) => {
  const totalSteps = workflow.approvalSteps.length;
  const approvedSteps = workflow.approvalSteps.filter(step => step.status === APPROVAL_STATUS.APPROVED).length;
  const pendingSteps = workflow.approvalSteps.filter(step => step.status === APPROVAL_STATUS.PENDING).length;
  const rejectedSteps = workflow.approvalSteps.filter(step => step.status === APPROVAL_STATUS.REJECTED).length;

  return {
    totalSteps,
    approvedSteps,
    pendingSteps,
    rejectedSteps,
    progress: getApprovalProgress(workflow),
    isComplete: workflow.status === APPROVAL_STATUS.APPROVED,
    isRejected: workflow.status === APPROVAL_STATUS.REJECTED,
    isCancelled: workflow.status === APPROVAL_STATUS.CANCELLED,
    isPending: workflow.status === APPROVAL_STATUS.PENDING || workflow.status === APPROVAL_STATUS.IN_REVIEW,
  };
};

/**
 * Get pending approvals for a specific user
 * @param {Array} workflows - Array of approval workflows
 * @param {string} userRole - User's role
 * @returns {Array} Filtered array of workflows pending user's approval
 */
export const getPendingApprovalsForUser = (workflows, userRole) => {
  const userRoleKey = userRole.toUpperCase().replace(/\s+/g, '_');

  return workflows.filter(workflow => {
    const currentApproverRole = getCurrentPendingApprover(workflow);
    if (!currentApproverRole) return false;

    // Check direct match or higher authority
    if (userRoleKey === currentApproverRole) return true;

    const userRoleInfo = getRoleInfo(userRoleKey);
    const approverRoleInfo = getRoleInfo(currentApproverRole);

    if (userRoleInfo && approverRoleInfo) {
      return userRoleInfo.level < approverRoleInfo.level;
    }

    return false;
  });
};

/**
 * Generate a unique approval ID
 * @returns {string} Unique approval ID
 */
const generateApprovalId = () => {
  return `APR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

/**
 * Format approval step for display
 * @param {Object} step - Approval step object
 * @returns {Object} Formatted step information
 */
export const formatApprovalStep = (step) => {
  return {
    level: step.level,
    role: step.roleName,
    status: step.status,
    approver: step.approverName || 'Pending',
    approvedAt: step.approvedAt ? new Date(step.approvedAt).toLocaleString() : null,
    comments: step.comments,
    isPending: step.status === APPROVAL_STATUS.PENDING,
    isApproved: step.status === APPROVAL_STATUS.APPROVED,
    isRejected: step.status === APPROVAL_STATUS.REJECTED,
  };
};

export default {
  APPROVAL_STATUS,
  APPROVAL_TYPES,
  createApprovalRequest,
  getCurrentPendingApprover,
  canUserApprove,
  approveWorkflowStep,
  rejectWorkflow,
  cancelWorkflow,
  getApprovalProgress,
  getApprovalSummary,
  getPendingApprovalsForUser,
  formatApprovalStep,
};
