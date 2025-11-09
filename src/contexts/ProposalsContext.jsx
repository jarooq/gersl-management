import React, { createContext, useContext, useState } from 'react';

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

  const [budgetLines, setBudgetLines] = useState([]);

  const [timeline, setTimeline] = useState([]);

  // CRUD Operations for Proposals
  const addProposal = (proposalData) => {
    const newProposal = {
      ...proposalData,
      id: proposals.length + 1,
      proposalCode: `PROP-${new Date().getFullYear()}-${String(proposals.length + 1).padStart(3, '0')}`,
      submissionDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      comments: 0,
      attachments: 0
    };
    setProposals([...proposals, newProposal]);
    return newProposal;
  };

  const updateProposal = (id, updatedData) => {
    setProposals(proposals.map(proposal =>
      proposal.id === id ? { ...proposal, ...updatedData, lastUpdated: new Date().toISOString().split('T')[0] } : proposal
    ));
  };

  const deleteProposal = (id) => {
    setProposals(proposals.filter(proposal => proposal.id !== id));
    setBudgetLines(budgetLines.filter(budget => budget.proposalId !== id));
    setTimeline(timeline.filter(t => t.proposalId !== id));
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

  // Get Stats
  const getStats = () => {
    const totalProposals = proposals.length;
    const draftProposals = proposals.filter(p => p.status === 'Draft').length;
    const submittedProposals = proposals.filter(p => p.status === 'Submitted' || p.status === 'Under Review').length;
    const approvedProposals = proposals.filter(p => p.status === 'Approved').length;
    const rejectedProposals = proposals.filter(p => p.status === 'Rejected').length;
    const totalBudgetRequested = proposals.reduce((sum, p) => sum + p.budgetRequested, 0);
    const approvedBudget = proposals.filter(p => p.status === 'Approved').reduce((sum, p) => sum + p.budgetRequested, 0);
    const totalBeneficiaries = proposals.reduce((sum, p) => sum + p.targetBeneficiaries, 0);
    const successRate = totalProposals > 0 ? Math.round((approvedProposals / (approvedProposals + rejectedProposals)) * 100) : 0;

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

  const value = {
    proposals,
    budgetLines,
    timeline,
    addProposal,
    updateProposal,
    deleteProposal,
    addBudgetLine,
    updateBudgetLine,
    deleteBudgetLine,
    addTimelinePhase,
    updateTimelinePhase,
    deleteTimelinePhase,
    getStats,
    getProposalById,
    getBudgetByProposal,
    getTimelineByProposal
  };

  return (
    <ProposalsContext.Provider value={value}>
      {children}
    </ProposalsContext.Provider>
  );
};
