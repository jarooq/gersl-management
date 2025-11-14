import React, { createContext, useContext, useState, useEffect } from 'react';
import { createProposalApprovalWorkflow } from '../utils/workflowOrchestrator';
import * as proposalService from '../services/proposalService';

const ProposalsContext = createContext();

export const useProposals = () => {
  const context = useContext(ProposalsContext);
  if (!context) {
    throw new Error('useProposals must be used within a ProposalsProvider');
  }
  return context;
};

export const ProposalsProvider = ({ children }) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [budgetLines, setBudgetLines] = useState([]);

  const [timeline, setTimeline] = useState([]);

  // Load proposals from backend on mount - only when user is authenticated
  // Removed automatic loading to prevent 401 errors when not logged in
  // Data will be loaded by pages when they mount
  // useEffect(() => {
  //   loadProposals();
  // }, []);

  // Load proposals from API
  const loadProposals = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await proposalService.fetchProposals(filters);
      if (response.success) {
        setProposals(response.data.proposals || []);
      }
    } catch (err) {
      console.error('Error loading proposals:', err);
      setError(err.message || 'Failed to load proposals');
      // Fallback to empty array on error
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh proposals (useful after changes)
  const refreshProposals = () => {
    return loadProposals();
  };

  // CRUD Operations for Proposals
  const addProposal = async (proposalData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await proposalService.createProposal(proposalData);

      if (response.success) {
        const newProposal = response.data.proposal;
        setProposals(prev => [newProposal, ...prev]);
        return newProposal;
      }
    } catch (err) {
      console.error('Error creating proposal:', err);
      setError(err.message || 'Failed to create proposal');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProposal = async (id, updatedData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await proposalService.updateProposal(id, updatedData);

      if (response.success) {
        const updatedProposal = response.data.proposal;
        setProposals(prev =>
          prev.map(proposal =>
            proposal.id === id ? updatedProposal : proposal
          )
        );
        return updatedProposal;
      }
    } catch (err) {
      console.error('Error updating proposal:', err);
      setError(err.message || 'Failed to update proposal');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProposal = async (id) => {
    try {
      setLoading(true);
      setError(null);

      const response = await proposalService.deleteProposal(id);

      if (response.success) {
        setProposals(prev => prev.filter(proposal => proposal.id !== id));
        setBudgetLines(prev => prev.filter(budget => budget.proposalId !== id));
        setTimeline(prev => prev.filter(t => t.proposalId !== id));
      }
    } catch (err) {
      console.error('Error deleting proposal:', err);
      setError(err.message || 'Failed to delete proposal');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Budget Operations
  const addBudgetLine = (budgetData) => {
    const newBudgetLine = {
      ...budgetData,
      id: budgetLines.length + 1
    };
    setBudgetLines([...budgetLines, newBudgetLine]);
    return newBudgetLine;
  };

  const updateBudgetLine = (id, updatedData) => {
    setBudgetLines(budgetLines.map(budget =>
      budget.id === id ? { ...budget, ...updatedData } : budget
    ));
  };

  const deleteBudgetLine = (id) => {
    setBudgetLines(budgetLines.filter(budget => budget.id !== id));
  };

  // Timeline Operations
  const addTimelinePhase = (timelineData) => {
    const newPhase = {
      ...timelineData,
      id: timeline.length + 1
    };
    setTimeline([...timeline, newPhase]);
    return newPhase;
  };

  const updateTimelinePhase = (id, updatedData) => {
    setTimeline(timeline.map(phase =>
      phase.id === id ? { ...phase, ...updatedData } : phase
    ));
  };

  const deleteTimelinePhase = (id) => {
    setTimeline(timeline.filter(phase => phase.id !== id));
  };

  // Get Stats (client-side calculation from loaded proposals)
  const getStats = () => {
    const totalProposals = proposals.length;
    const draftProposals = proposals.filter(p => p.status === 'Draft').length;
    const submittedProposals = proposals.filter(p => p.status === 'Submitted' || p.status === 'Under Review').length;
    const approvedProposals = proposals.filter(p => p.status === 'Approved').length;
    const rejectedProposals = proposals.filter(p => p.status === 'Rejected').length;
    const totalBudgetRequested = proposals.reduce((sum, p) => sum + (parseFloat(p.budgetRequested) || 0), 0);
    const approvedBudget = proposals.filter(p => p.status === 'Approved').reduce((sum, p) => sum + (parseFloat(p.budgetRequested) || 0), 0);
    const totalBeneficiaries = proposals.reduce((sum, p) => sum + (parseInt(p.targetBeneficiaries) || 0), 0);
    const successRate = (approvedProposals + rejectedProposals) > 0
      ? Math.round((approvedProposals / (approvedProposals + rejectedProposals)) * 100)
      : 0;

    return {
      totalProposals,
      draftProposals,
      submittedProposals,
      approvedProposals,
      rejectedProposals,
      totalBudgetRequested,
      approvedBudget,
      totalBeneficiaries,
      successRate
    };
  };

  // Get proposal by ID
  const getProposalById = (id) => {
    return proposals.find(p => p.id === id);
  };

  // Get budget by proposal
  const getBudgetByProposal = (proposalId) => {
    return budgetLines.filter(b => b.proposalId === proposalId);
  };

  // Get timeline by proposal
  const getTimelineByProposal = (proposalId) => {
    return timeline.filter(t => t.proposalId === proposalId);
  };

  /**
   * Submit a proposal for approval
   * This triggers the creation of an approval workflow
   * @param {number} proposalId - ID of the proposal to submit
   * @param {Object} currentUser - Current user submitting the proposal
   * @param {Function} createApprovalCallback - Callback to create approval workflow
   * @returns {Object} Result with workflow creation info
   */
  const submitProposalForApproval = (proposalId, currentUser, createApprovalCallback) => {
    const proposal = proposals.find(p => p.id === proposalId);

    if (!proposal) {
      return { success: false, message: 'Proposal not found' };
    }

    if (proposal.status !== 'Draft') {
      return { success: false, message: 'Only draft proposals can be submitted' };
    }

    try {
      // Update proposal status to 'Submitted'
      updateProposal(proposalId, {
        status: 'Submitted',
        submittedDate: new Date().toISOString().split('T')[0],
        submittedBy: currentUser.fullName || currentUser.username
      });

      // Create approval workflow data
      const approvalData = createProposalApprovalWorkflow(proposal, currentUser);

      // Return the approval data for the ApprovalContext to create
      return {
        success: true,
        proposalId,
        approvalData,
        message: 'Proposal submitted for approval'
      };
    } catch (error) {
      console.error('Error submitting proposal:', error);
      return {
        success: false,
        message: error.message
      };
    }
  };

  /**
   * Link a proposal to a created project
   * Called when approval workflow completes and project is created
   * @param {number} proposalId - ID of the proposal
   * @param {Object} projectInfo - Information about the created project
   */
  const linkProposalToProject = (proposalId, projectInfo) => {
    updateProposal(proposalId, {
      linkedProjectId: projectInfo.id,
      linkedProjectCode: projectInfo.code,
      convertedToProjectDate: new Date().toISOString().split('T')[0]
    });
  };

  const value = {
    // State
    proposals,
    budgetLines,
    timeline,
    loading,
    error,

    // API functions
    loadProposals,
    refreshProposals,

    // CRUD operations
    addProposal,
    updateProposal,
    deleteProposal,
    addBudgetLine,
    updateBudgetLine,
    deleteBudgetLine,
    addTimelinePhase,
    updateTimelinePhase,
    deleteTimelinePhase,

    // Helper functions
    getStats,
    getProposalById,
    getBudgetByProposal,
    getTimelineByProposal,

    // Workflow integration
    submitProposalForApproval,
    linkProposalToProject
  };

  return (
    <ProposalsContext.Provider value={value}>
      {children}
    </ProposalsContext.Provider>
  );
};
