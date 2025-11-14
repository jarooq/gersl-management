/**
 * Workflow Orchestration Utility
 *
 * Manages the automated workflow between:
 * - Proposal Submission → Approval Workflow → Project Creation
 * - Project Activities → Multi-stage Approvals
 * - Project Completion → Report Generation
 */

/**
 * Convert an approved proposal to a project
 * @param {Object} proposal - The approved proposal object
 * @returns {Object} Project data ready for creation
 */
export const convertProposalToProject = (proposal) => {
  if (!proposal) {
    throw new Error('Proposal is required for conversion');
  }

  // Map proposal data to project structure
  const projectData = {
    name: proposal.title || proposal.proposalName || 'Untitled Project',
    code: generateProjectCode(proposal),
    programmeArea: proposal.programmeArea || proposal.sector || 'General',
    donor: proposal.donor || proposal.fundingSource || 'Unknown Donor',
    budget: proposal.budgetRequested || proposal.totalBudget || 0,
    startDate: proposal.startDate || new Date().toISOString().split('T')[0],
    endDate: proposal.endDate || calculateDefaultEndDate(proposal.startDate, proposal.duration),
    duration: proposal.duration || 12, // Default 12 months
    location: proposal.location || proposal.targetLocation || 'TBD',
    description: proposal.description || proposal.projectDescription || '',
    objectives: proposal.objectives || [],
    targetBeneficiaries: proposal.targetBeneficiaries || 0,

    // Link to original proposal
    sourceProposalId: proposal.id,
    sourceProposalCode: proposal.proposalCode,

    // Initial project status
    status: 'Planning',
    progress: 0,
    spent: 0,
    beneficiaries: 0,

    // MEAL Data from proposal
    resultsFramework: proposal.resultsFramework || [],
    beneficiaryBreakdown: proposal.beneficiaryBreakdown || {
      directMale: 0,
      directFemale: 0,
      directChildren: 0,
      directPWD: 0,
      indirectTotal: 0
    },
    theoryOfChange: proposal.theoryOfChange || {
      inputs: [],
      activities: [],
      outputs: [],
      outcomes: [],
      impact: '',
      assumptions: [],
      risks: []
    },

    // Initialize empty MEAL logs
    cfmLog: [],
    fieldMonitoring: [],
    learningLog: [],
    indicatorProgress: [],
    tasks: [],

    // Metadata
    createdAt: new Date().toISOString(),
    createdFrom: 'approved_proposal',
    approvedDate: new Date().toISOString().split('T')[0]
  };

  return projectData;
};

/**
 * Generate a project code from a proposal
 * @param {Object} proposal - The proposal object
 * @returns {string} Project code (e.g., PRJ-2025-001)
 */
const generateProjectCode = (proposal) => {
  const year = new Date().getFullYear();
  const proposalNumber = proposal.proposalCode?.match(/\d+$/)?.[0] || '001';
  return `PRJ-${year}-${proposalNumber.padStart(3, '0')}`;
};

/**
 * Calculate default end date based on start date and duration
 * @param {string} startDate - Start date in ISO format
 * @param {number} durationMonths - Duration in months
 * @returns {string} End date in ISO format
 */
const calculateDefaultEndDate = (startDate, durationMonths = 12) => {
  if (!startDate) {
    const now = new Date();
    const endDate = new Date(now.setMonth(now.getMonth() + durationMonths));
    return endDate.toISOString().split('T')[0];
  }

  const start = new Date(startDate);
  const end = new Date(start);
  end.setMonth(end.getMonth() + (durationMonths || 12));
  return end.toISOString().split('T')[0];
};

/**
 * Create approval workflow data for a proposal submission
 * @param {Object} proposal - The proposal object
 * @param {Object} currentUser - The user submitting the proposal
 * @returns {Object} Approval creation parameters
 */
export const createProposalApprovalWorkflow = (proposal, currentUser) => {
  if (!proposal || !currentUser) {
    throw new Error('Proposal and current user are required');
  }

  const approvalAmount = proposal.budgetRequested || proposal.totalBudget || 0;

  return {
    type: 'PROPOSAL_SUBMISSION',
    amount: approvalAmount,
    data: {
      proposalId: proposal.id,
      proposalCode: proposal.proposalCode,
      proposalTitle: proposal.title || proposal.proposalName,
      donor: proposal.donor || proposal.fundingSource,
      budgetRequested: approvalAmount,
      programmeArea: proposal.programmeArea || proposal.sector,
      targetBeneficiaries: proposal.targetBeneficiaries || 0,
      duration: proposal.duration || 12,
      submittedBy: currentUser.fullName || currentUser.username,
      submittedDate: new Date().toISOString(),
      description: proposal.description?.substring(0, 200) || 'No description provided',
    }
  };
};

/**
 * Create approval workflow data for project activity
 * @param {Object} activity - The project activity/task
 * @param {Object} project - The parent project
 * @param {Object} currentUser - The user creating the activity
 * @returns {Object} Approval creation parameters
 */
export const createProjectActivityApprovalWorkflow = (activity, project, currentUser) => {
  if (!activity || !project || !currentUser) {
    throw new Error('Activity, project, and current user are required');
  }

  const activityBudget = activity.budget || activity.cost || 0;

  return {
    type: 'PROJECT_ACTIVITY',
    amount: activityBudget,
    data: {
      projectId: project.id,
      projectCode: project.code,
      projectName: project.name,
      activityId: activity.id,
      activityName: activity.name || activity.title,
      activityDescription: activity.description?.substring(0, 200) || '',
      activityBudget,
      requestedBy: currentUser.fullName || currentUser.username,
      requestedDate: new Date().toISOString(),
    }
  };
};

/**
 * Workflow callback handlers
 * These are callback functions that will be triggered when workflows complete
 */

/**
 * Handle proposal approval completion
 * @param {Object} workflow - The completed approval workflow
 * @param {Function} createProjectCallback - Callback to create a project
 * @param {Function} updateProposalCallback - Callback to update proposal status
 */
export const handleProposalApprovalComplete = async (workflow, createProjectCallback, updateProposalCallback) => {
  if (workflow.status !== 'approved') {
    console.log('Workflow not approved, skipping project creation');
    return { success: false, reason: 'not_approved' };
  }

  if (workflow.type !== 'PROPOSAL_SUBMISSION') {
    console.log('Workflow is not a proposal submission, skipping');
    return { success: false, reason: 'wrong_type' };
  }

  try {
    const proposalId = workflow.data.proposalId;

    // Get the full proposal data (this should be passed from context)
    // For now, we'll work with the data embedded in the workflow
    const proposalData = {
      id: proposalId,
      proposalCode: workflow.data.proposalCode,
      title: workflow.data.proposalTitle,
      donor: workflow.data.donor,
      budgetRequested: workflow.data.budgetRequested,
      programmeArea: workflow.data.programmeArea,
      targetBeneficiaries: workflow.data.targetBeneficiaries,
      duration: workflow.data.duration,
      description: workflow.data.description,
    };

    // Convert proposal to project
    const projectData = convertProposalToProject(proposalData);

    // Create the project
    const newProject = await createProjectCallback(projectData);

    // Update proposal status to 'Approved' and link to project
    await updateProposalCallback(proposalId, {
      status: 'Approved',
      approvedDate: new Date().toISOString().split('T')[0],
      linkedProjectId: newProject.id,
      linkedProjectCode: newProject.code || generateProjectCode(proposalData),
      workflowId: workflow.id
    });

    console.log(`✅ Proposal ${workflow.data.proposalCode} approved and converted to project`);

    return {
      success: true,
      project: newProject,
      proposalId,
      workflowId: workflow.id
    };
  } catch (error) {
    console.error('Error handling proposal approval completion:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Handle proposal rejection
 * @param {Object} workflow - The rejected approval workflow
 * @param {Function} updateProposalCallback - Callback to update proposal status
 */
export const handleProposalRejection = async (workflow, updateProposalCallback) => {
  if (workflow.status !== 'rejected') {
    return { success: false, reason: 'not_rejected' };
  }

  if (workflow.type !== 'PROPOSAL_SUBMISSION') {
    return { success: false, reason: 'wrong_type' };
  }

  try {
    const proposalId = workflow.data.proposalId;

    // Find the rejection comments from the workflow steps
    const rejectedStep = workflow.approvalSteps.find(step => step.status === 'rejected');
    const rejectionReason = rejectedStep?.comments || 'No reason provided';

    // Update proposal status to 'Rejected'
    await updateProposalCallback(proposalId, {
      status: 'Rejected',
      rejectedDate: new Date().toISOString().split('T')[0],
      rejectionReason,
      rejectedBy: rejectedStep?.approverName,
      workflowId: workflow.id
    });

    console.log(`❌ Proposal ${workflow.data.proposalCode} rejected`);

    return {
      success: true,
      proposalId,
      rejectionReason,
      workflowId: workflow.id
    };
  } catch (error) {
    console.error('Error handling proposal rejection:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Handle project activity approval completion
 * @param {Object} workflow - The completed approval workflow
 * @param {Function} updateProjectCallback - Callback to update project
 * @param {Function} updateTaskCallback - Callback to update task status
 */
export const handleProjectActivityApprovalComplete = async (workflow, updateProjectCallback, updateTaskCallback) => {
  if (workflow.status !== 'approved') {
    return { success: false, reason: 'not_approved' };
  }

  if (workflow.type !== 'PROJECT_ACTIVITY') {
    return { success: false, reason: 'wrong_type' };
  }

  try {
    const { projectId, activityId } = workflow.data;

    // Update task status to approved and ready to start
    await updateTaskCallback(projectId, activityId, {
      status: 'Approved',
      approvedDate: new Date().toISOString().split('T')[0],
      workflowId: workflow.id
    });

    console.log(`✅ Project activity approved: ${workflow.data.activityName}`);

    return {
      success: true,
      projectId,
      activityId,
      workflowId: workflow.id
    };
  } catch (error) {
    console.error('Error handling project activity approval:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Check if a proposal requires approval workflow
 * @param {Object} proposal - The proposal object
 * @returns {boolean} True if approval is required
 */
export const requiresApprovalWorkflow = (proposal) => {
  // All submitted proposals require approval
  return proposal.status === 'Submitted' || proposal.status === 'Under Review';
};

/**
 * Get workflow status display information
 * @param {Object} workflow - The workflow object
 * @returns {Object} Display information
 */
export const getWorkflowDisplayInfo = (workflow) => {
  const statusColors = {
    pending: 'yellow',
    in_review: 'blue',
    approved: 'green',
    rejected: 'red',
    cancelled: 'gray'
  };

  const statusLabels = {
    pending: 'Pending Approval',
    in_review: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelled: 'Cancelled'
  };

  return {
    status: workflow.status,
    statusLabel: statusLabels[workflow.status] || workflow.status,
    statusColor: statusColors[workflow.status] || 'gray',
    progress: getApprovalProgress(workflow),
    currentLevel: workflow.currentLevel,
    totalLevels: workflow.approvalSteps?.length || 0,
    currentApprover: getCurrentApproverName(workflow),
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt
  };
};

/**
 * Get approval progress percentage
 * @param {Object} workflow - The workflow object
 * @returns {number} Progress percentage (0-100)
 */
const getApprovalProgress = (workflow) => {
  if (!workflow.approvalSteps || workflow.approvalSteps.length === 0) return 0;

  const completedSteps = workflow.approvalSteps.filter(
    step => step.status === 'approved'
  ).length;

  return Math.round((completedSteps / workflow.approvalSteps.length) * 100);
};

/**
 * Get current approver name
 * @param {Object} workflow - The workflow object
 * @returns {string} Current approver name or role
 */
const getCurrentApproverName = (workflow) => {
  if (workflow.status === 'approved' || workflow.status === 'rejected' || workflow.status === 'cancelled') {
    return null;
  }

  const currentStep = workflow.approvalSteps?.find(
    step => step.level === workflow.currentLevel && step.status === 'pending'
  );

  return currentStep?.roleName || currentStep?.role || 'Unknown';
};

export default {
  convertProposalToProject,
  createProposalApprovalWorkflow,
  createProjectActivityApprovalWorkflow,
  handleProposalApprovalComplete,
  handleProposalRejection,
  handleProjectActivityApprovalComplete,
  requiresApprovalWorkflow,
  getWorkflowDisplayInfo
};
