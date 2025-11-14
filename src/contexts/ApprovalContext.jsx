import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  createApprovalRequest,
  approveWorkflowStep,
  rejectWorkflow,
  cancelWorkflow,
  getPendingApprovalsForUser,
  getApprovalSummary,
  canUserApprove,
  APPROVAL_STATUS,
} from '../utils/approvalWorkflow';
import {
  handleProposalApprovalComplete,
  handleProposalRejection,
  handleProjectActivityApprovalComplete
} from '../utils/workflowOrchestrator';

const ApprovalContext = createContext(null);

export const useApproval = () => {
  const context = useContext(ApprovalContext);
  if (!context) {
    throw new Error('useApproval must be used within an ApprovalProvider');
  }
  return context;
};

export const ApprovalProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);

  // Workflow completion callbacks
  const [workflowCallbacks, setWorkflowCallbacks] = useState({
    createProject: null,
    updateProposal: null,
    updateProject: null,
    updateTask: null
  });

  /**
   * Register workflow callbacks
   * Called by parent components to register callback functions
   */
  const registerWorkflowCallbacks = useCallback((callbacks) => {
    setWorkflowCallbacks(prev => ({
      ...prev,
      ...callbacks
    }));
  }, []);

  /**
   * Create a new approval request
   */
  const createApproval = useCallback(async ({ type, amount, data }) => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);

      const workflow = createApprovalRequest({
        type,
        initiatorRole: currentUser.role,
        amount,
        data: {
          ...data,
          initiatorId: currentUser.id,
          initiatorName: currentUser.fullName,
        },
      });

      // In a real app, this would make an API call to save the approval
      // For now, we'll just add it to local state
      setApprovals(prev => [...prev, workflow]);

      console.log(`✅ Created approval workflow: ${workflow.id} (${workflow.typeName})`);

      return { success: true, workflow };
    } catch (error) {
      console.error('Create approval error:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  /**
   * Approve a workflow step
   */
  const approve = useCallback(async (workflowId, comments = null) => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      let updatedWorkflow = null;

      setApprovals(prev => prev.map(workflow => {
        if (workflow.id === workflowId) {
          try {
            updatedWorkflow = approveWorkflowStep(
              workflow,
              {
                userId: currentUser.id,
                userName: currentUser.fullName,
                userRole: currentUser.role,
              },
              comments
            );
            return updatedWorkflow;
          } catch (error) {
            console.error('Approve error:', error);
            throw error;
          }
        }
        return workflow;
      }));

      // Check if workflow is fully approved and trigger completion handlers
      if (updatedWorkflow && updatedWorkflow.status === APPROVAL_STATUS.APPROVED) {
        console.log(`🎉 Workflow fully approved: ${updatedWorkflow.id} (${updatedWorkflow.typeName})`);

        // Handle proposal approval completion
        if (updatedWorkflow.type === 'PROPOSAL_SUBMISSION') {
          if (workflowCallbacks.createProject && workflowCallbacks.updateProposal) {
            const result = await handleProposalApprovalComplete(
              updatedWorkflow,
              workflowCallbacks.createProject,
              workflowCallbacks.updateProposal
            );

            if (result.success) {
              console.log(`✅ Proposal ${updatedWorkflow.data.proposalCode} converted to project`);
            } else {
              console.warn(`⚠️ Failed to convert proposal to project:`, result.error || result.reason);
            }
          }
        }

        // Handle project activity approval completion
        if (updatedWorkflow.type === 'PROJECT_ACTIVITY') {
          if (workflowCallbacks.updateProject && workflowCallbacks.updateTask) {
            const result = await handleProjectActivityApprovalComplete(
              updatedWorkflow,
              workflowCallbacks.updateProject,
              workflowCallbacks.updateTask
            );

            if (result.success) {
              console.log(`✅ Project activity ${updatedWorkflow.data.activityName} approved`);
            } else {
              console.warn(`⚠️ Failed to approve project activity:`, result.error || result.reason);
            }
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Approve workflow error:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser, workflowCallbacks]);

  /**
   * Reject a workflow
   */
  const reject = useCallback(async (workflowId, reason) => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      let rejectedWorkflow = null;

      setApprovals(prev => prev.map(workflow => {
        if (workflow.id === workflowId) {
          try {
            rejectedWorkflow = rejectWorkflow(
              workflow,
              {
                userId: currentUser.id,
                userName: currentUser.fullName,
                userRole: currentUser.role,
              },
              reason
            );
            return rejectedWorkflow;
          } catch (error) {
            console.error('Reject error:', error);
            throw error;
          }
        }
        return workflow;
      }));

      // Handle proposal rejection
      if (rejectedWorkflow && rejectedWorkflow.type === 'PROPOSAL_SUBMISSION') {
        if (workflowCallbacks.updateProposal) {
          const result = await handleProposalRejection(
            rejectedWorkflow,
            workflowCallbacks.updateProposal
          );

          if (result.success) {
            console.log(`❌ Proposal ${rejectedWorkflow.data.proposalCode} rejected`);
          } else {
            console.warn(`⚠️ Failed to update rejected proposal:`, result.error || result.reason);
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Reject workflow error:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser, workflowCallbacks]);

  /**
   * Cancel a workflow (initiator only)
   */
  const cancel = useCallback(async (workflowId) => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);

      setApprovals(prev => prev.map(workflow => {
        if (workflow.id === workflowId) {
          try {
            return cancelWorkflow(workflow, currentUser.role);
          } catch (error) {
            console.error('Cancel error:', error);
            throw error;
          }
        }
        return workflow;
      }));

      return { success: true };
    } catch (error) {
      console.error('Cancel workflow error:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  /**
   * Get all approvals
   */
  const getAllApprovals = useCallback(() => {
    return approvals;
  }, [approvals]);

  /**
   * Get pending approvals for current user
   */
  const getPendingApprovals = useCallback(() => {
    if (!currentUser) return [];
    return getPendingApprovalsForUser(approvals, currentUser.role);
  }, [approvals, currentUser]);

  /**
   * Get approvals by status
   */
  const getApprovalsByStatus = useCallback((status) => {
    return approvals.filter(approval => approval.status === status);
  }, [approvals]);

  /**
   * Get approvals by type
   */
  const getApprovalsByType = useCallback((type) => {
    return approvals.filter(approval => approval.type === type);
  }, [approvals]);

  /**
   * Get approval by ID
   */
  const getApprovalById = useCallback((id) => {
    return approvals.find(approval => approval.id === id);
  }, [approvals]);

  /**
   * Check if user can approve a specific workflow
   */
  const canApprove = useCallback((workflowId) => {
    if (!currentUser) return false;

    const workflow = approvals.find(a => a.id === workflowId);
    if (!workflow) return false;

    return canUserApprove(workflow, currentUser.role, currentUser.id);
  }, [approvals, currentUser]);

  /**
   * Get summary for a workflow
   */
  const getSummary = useCallback((workflowId) => {
    const workflow = approvals.find(a => a.id === workflowId);
    if (!workflow) return null;

    return getApprovalSummary(workflow);
  }, [approvals]);

  /**
   * Get pending approvals count
   */
  const getPendingApprovalsCount = useCallback(() => {
    if (!currentUser) return 0;
    return getPendingApprovalsForUser(approvals, currentUser.role).length;
  }, [approvals, currentUser]);

  const value = {
    approvals,
    loading,
    // Actions
    createApproval,
    approve,
    reject,
    cancel,
    registerWorkflowCallbacks,
    // Getters
    getAllApprovals,
    getPendingApprovals,
    getApprovalsByStatus,
    getApprovalsByType,
    getApprovalById,
    canApprove,
    getSummary,
    getPendingApprovalsCount,
    // Constants
    APPROVAL_STATUS,
  };

  return (
    <ApprovalContext.Provider value={value}>
      {children}
    </ApprovalContext.Provider>
  );
};

export default ApprovalContext;
