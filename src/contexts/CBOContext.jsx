import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateInitialMilestones } from '../constants/projectTemplates';

const CBOContext = createContext(null);

export const useCBO = () => {
  const context = useContext(CBOContext);
  if (!context) {
    throw new Error('useCBO must be used within a CBOProvider');
  }
  return context;
};

export const CBOProvider = ({ children }) => {
  // CBO Partners
  const [cboPartners, setCBOPartners] = useState([]);

  // Volunteers
  const [volunteers, setVolunteers] = useState([]);

  // Volunteer Activities
  const [activities, setActivities] = useState([]);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('gersl_cbo');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.cboPartners) setCBOPartners(data.cboPartners);
        if (data.volunteers) setVolunteers(data.volunteers);
        if (data.activities) setActivities(data.activities);
      } catch (error) {
        console.error('Error loading CBO data:', error);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('gersl_cbo', JSON.stringify({
      cboPartners,
      volunteers,
      activities
    }));
  }, [cboPartners, volunteers, activities]);

  // CBO CRUD Operations
  const addCBO = (cboData) => {
    const newCBO = {
      ...cboData,
      id: Math.max(...cboPartners.map(c => c.id), 0) + 1,
      projectsCount: 0,
      volunteersCount: 0,
      partnershipDate: new Date().toISOString().split('T')[0],
      status: 'Pending Review'
    };
    setCBOPartners([...cboPartners, newCBO]);
    return newCBO;
  };

  const updateCBO = (id, updates) => {
    setCBOPartners(cboPartners.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCBO = (id) => {
    if (window.confirm('Are you sure you want to delete this CBO partner?')) {
      setCBOPartners(cboPartners.filter(c => c.id !== id));
    }
  };

  // Volunteer CRUD Operations
  const addVolunteer = (volunteerData) => {
    const newVolunteer = {
      ...volunteerData,
      id: Math.max(...volunteers.map(v => v.id), 0) + 1,
      joinedDate: new Date().toISOString().split('T')[0],
      hoursContributed: 0,
      projectsParticipated: 0,
      rating: null,
      status: 'Pending Orientation'
    };
    setVolunteers([...volunteers, newVolunteer]);
    return newVolunteer;
  };

  const updateVolunteer = (id, updates) => {
    setVolunteers(volunteers.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const deleteVolunteer = (id) => {
    if (window.confirm('Are you sure you want to delete this volunteer?')) {
      setVolunteers(volunteers.filter(v => v.id !== id));
    }
  };

  // Activity CRUD Operations
  const addActivity = (activityData) => {
    const newActivity = {
      ...activityData,
      id: Math.max(...activities.map(a => a.id), 0) + 1,
      status: 'Upcoming'
    };
    setActivities([...activities, newActivity]);
    return newActivity;
  };

  const updateActivity = (id, updates) => {
    setActivities(activities.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteActivity = (id) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      setActivities(activities.filter(a => a.id !== id));
    }
  };

  // Search Functions
  const searchCBOs = (query) => {
    const q = query.toLowerCase();
    return cboPartners.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.acronym.toLowerCase().includes(q) ||
      c.district.toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q)
    );
  };

  const searchVolunteers = (query) => {
    const q = query.toLowerCase();
    return volunteers.filter(v =>
      v.fullName.toLowerCase().includes(q) ||
      v.district.toLowerCase().includes(q) ||
      v.cboAffiliation.toLowerCase().includes(q) ||
      v.skills.some(s => s.toLowerCase().includes(q))
    );
  };

  // Statistics
  const getStats = () => {
    return {
      totalCBOs: cboPartners.length,
      activeCBOs: cboPartners.filter(c => c.status === 'Active').length,
      pendingCBOs: cboPartners.filter(c => c.status === 'Pending Review').length,
      totalVolunteers: volunteers.length,
      activeVolunteers: volunteers.filter(v => v.status === 'Active').length,
      pendingVolunteers: volunteers.filter(v => v.status === 'Pending Orientation').length,
      totalActivities: activities.length,
      upcomingActivities: activities.filter(a => a.status === 'Upcoming').length,
      completedActivities: activities.filter(a => a.status === 'Completed').length,
      totalHoursLogged: volunteers.reduce((sum, v) => sum + v.hoursContributed, 0),
      avgVolunteerRating: (volunteers.filter(v => v.rating).reduce((sum, v) => sum + v.rating, 0) / volunteers.filter(v => v.rating).length).toFixed(1)
    };
  };

  const getDistricts = () => {
    return [...new Set(cboPartners.map(c => c.district))].sort();
  };

  // Due Diligence Assessments
  const [dueDiligence, setDueDiligence] = useState([]);

  // CBO Proposals
  const [cboProposals, setCBOProposals] = useState([]);

  // CBO Projects (Approved and Under Implementation)
  const [cboProjects, setCBOProjects] = useState([]);

  // Add methods for Due Diligence
  const addDueDiligence = (assessment) => {
    const newAssessment = {
      ...assessment,
      id: dueDiligence.length + 1
    };
    setDueDiligence([...dueDiligence, newAssessment]);
  };

  const updateDueDiligence = (id, updates) => {
    setDueDiligence(dueDiligence.map(dd =>
      dd.id === id ? { ...dd, ...updates } : dd
    ));
  };

  // Add methods for CBO Proposals
  const addCBOProposal = (proposal) => {
    const newProposal = {
      ...proposal,
      id: cboProposals.length + 1,
      submissionDate: new Date().toISOString().split('T')[0],
      status: 'Submitted',
      workflowStage: 'fundraising',
      fundraisingStatus: 'Pending',
      ceoStatus: 'Pending',
      donorStatus: 'Pending',
      convertedToProject: false,
      projectId: null
    };
    setCBOProposals([...cboProposals, newProposal]);
  };

  const updateCBOProposal = (id, updates) => {
    setCBOProposals(cboProposals.map(p =>
      p.id === id ? { ...p, ...updates } : p
    ));
  };

  // Fundraising Manager Actions
  const fundraisingApproveProposal = (id, score, comments, reviewer) => {
    updateCBOProposal(id, {
      fundraisingReviewer: reviewer,
      fundraisingReviewDate: new Date().toISOString().split('T')[0],
      fundraisingScore: score,
      fundraisingComments: comments,
      fundraisingStatus: 'Approved',
      status: 'CEO Approval',
      workflowStage: 'ceo'
    });
  };

  const fundraisingRejectProposal = (id, score, comments, reviewer) => {
    updateCBOProposal(id, {
      fundraisingReviewer: reviewer,
      fundraisingReviewDate: new Date().toISOString().split('T')[0],
      fundraisingScore: score,
      fundraisingComments: comments,
      fundraisingStatus: 'Rejected',
      status: 'Rejected by Fundraising',
      workflowStage: 'fundraising'
    });
  };

  // CEO Actions
  const ceoApproveProposal = (id, comments, approver, approvedBudget) => {
    updateCBOProposal(id, {
      ceoApprover: approver,
      ceoApprovalDate: new Date().toISOString().split('T')[0],
      ceoComments: comments,
      ceoStatus: 'Approved',
      approvedBudget: approvedBudget || null,
      status: 'Donor Pending',
      workflowStage: 'donor'
    });
  };

  const ceoRejectProposal = (id, comments, approver) => {
    updateCBOProposal(id, {
      ceoApprover: approver,
      ceoApprovalDate: new Date().toISOString().split('T')[0],
      ceoComments: comments,
      ceoStatus: 'Rejected',
      status: 'Rejected by CEO',
      workflowStage: 'ceo'
    });
  };

  // Donor Approval
  const donorApproveProposal = (id, donorName, approvedBudget) => {
    updateCBOProposal(id, {
      donorName,
      donorApprovalDate: new Date().toISOString().split('T')[0],
      donorStatus: 'Approved',
      approvedBudget,
      status: 'Donor Approved - Ready for Conversion',
      workflowStage: 'approved'
    });
  };

  const donorRejectProposal = (id, donorName) => {
    updateCBOProposal(id, {
      donorName,
      donorApprovalDate: new Date().toISOString().split('T')[0],
      donorStatus: 'Rejected',
      status: 'Rejected by Donor',
      workflowStage: 'donor'
    });
  };

  // Convert Proposal to Project
  const convertProposalToProject = (proposalId) => {
    const proposal = cboProposals.find(p => p.id === proposalId);
    if (!proposal || proposal.convertedToProject) {
      return null;
    }

    // Create new project from proposal
    const newProject = {
      id: cboProjects.length + 1,
      cboId: proposal.cboId,
      cboName: proposal.cboName,
      projectTitle: proposal.proposalTitle,
      programmeArea: proposal.programmeArea,
      startDate: new Date().toISOString().split('T')[0],
      endDate: calculateEndDate(proposal.duration),
      budget: proposal.approvedBudget || proposal.requestedBudget,
      spent: 0,
      progress: 0,
      status: 'Active',
      targetBeneficiaries: proposal.targetBeneficiaries,
      actualBeneficiaries: 0,
      district: proposal.district,
      projectManager: proposal.submittedBy,
      gerslFocalPerson: proposal.fundraisingReviewer,
      lastReportDate: null,
      nextReportDue: calculateNextReportDate(),
      milestones: generateInitialMilestones(proposal.duration),
      issues: []
    };

    // Add project
    setCBOProjects([...cboProjects, newProject]);

    // Update proposal
    updateCBOProposal(proposalId, {
      convertedToProject: true,
      projectId: newProject.id,
      status: 'Converted to Project',
      workflowStage: 'converted',
      projectStartDate: newProject.startDate
    });

    return newProject.id;
  };

  // Helper functions
  const calculateEndDate = (duration) => {
    const months = parseInt(duration);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);
    return endDate.toISOString().split('T')[0];
  };

  const calculateNextReportDate = () => {
    const nextReport = new Date();
    nextReport.setMonth(nextReport.getMonth() + 1);
    return nextReport.toISOString().split('T')[0];
  };

  // generateInitialMilestones is now imported from projectTemplates.js constants

  // Add methods for CBO Projects
  const addCBOProject = (project) => {
    const newProject = {
      ...project,
      id: cboProjects.length + 1,
      spent: 0,
      progress: 0,
      actualBeneficiaries: 0,
      issues: []
    };
    setCBOProjects([...cboProjects, newProject]);
  };

  const updateCBOProject = (id, updates) => {
    setCBOProjects(cboProjects.map(p =>
      p.id === id ? { ...p, ...updates } : p
    ));
  };

  const updateProjectProgress = (id, spent, progress, actualBeneficiaries) => {
    updateCBOProject(id, {
      spent,
      progress,
      actualBeneficiaries,
      lastReportDate: new Date().toISOString().split('T')[0]
    });
  };

  const addProjectIssue = (projectId, issue) => {
    const project = cboProjects.find(p => p.id === projectId);
    if (project) {
      const newIssue = {
        id: (project.issues?.length || 0) + 1,
        ...issue
      };
      updateCBOProject(projectId, {
        issues: [...(project.issues || []), newIssue]
      });
    }
  };

  // MEAL Methods - Community Feedback Mechanism (CFM)
  const addCFMFeedback = (projectId, feedback) => {
    const project = cboProjects.find(p => p.id === projectId);
    if (project) {
      const newFeedback = {
        id: `CFM-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        ...feedback,
        status: feedback.feedbackType === 'Positive' ? 'Acknowledged' : 'Open'
      };
      updateCBOProject(projectId, {
        cfmLog: [...(project.cfmLog || []), newFeedback]
      });
      return newFeedback.id;
    }
    return null;
  };

  const resolveCFMFeedback = (projectId, feedbackId, resolution) => {
    const project = cboProjects.find(p => p.id === projectId);
    if (project && project.cfmLog) {
      const updatedCFM = project.cfmLog.map(fb =>
        fb.id === feedbackId ? {
          ...fb,
          actionTaken: resolution.actionTaken,
          responsiblePerson: resolution.responsiblePerson,
          dateResolved: new Date().toISOString().split('T')[0],
          status: 'Resolved'
        } : fb
      );
      updateCBOProject(projectId, { cfmLog: updatedCFM });
    }
  };

  // MEAL Methods - Field Monitoring
  const addFieldMonitoring = (projectId, monitoringData) => {
    const project = cboProjects.find(p => p.id === projectId);
    if (project) {
      const newMonitoring = {
        id: `FM-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        ...monitoringData
      };
      updateCBOProject(projectId, {
        fieldMonitoring: [...(project.fieldMonitoring || []), newMonitoring]
      });
      return newMonitoring.id;
    }
    return null;
  };

  // MEAL Methods - Learning & Adaptation
  const addLearning = (projectId, learning) => {
    const project = cboProjects.find(p => p.id === projectId);
    if (project) {
      const newLearning = {
        id: `LRN-${Date.now()}`,
        dateIdentified: new Date().toISOString().split('T')[0],
        ...learning,
        status: learning.status || 'Pending'
      };
      updateCBOProject(projectId, {
        learningLog: [...(project.learningLog || []), newLearning]
      });
      return newLearning.id;
    }
    return null;
  };

  const updateLearningStatus = (projectId, learningId, status, notes) => {
    const project = cboProjects.find(p => p.id === projectId);
    if (project && project.learningLog) {
      const updatedLearning = project.learningLog.map(lrn =>
        lrn.id === learningId ? {
          ...lrn,
          status,
          implementationNotes: notes,
          dateCompleted: status === 'Implemented' ? new Date().toISOString().split('T')[0] : null
        } : lrn
      );
      updateCBOProject(projectId, { learningLog: updatedLearning });
    }
  };

  // MEAL Methods - Indicator Tracking
  const updateIndicatorProgress = (projectId, indicatorId, progressData) => {
    const project = cboProjects.find(p => p.id === projectId);
    if (project && project.indicatorProgress) {
      const updatedIndicators = project.indicatorProgress.map(ind =>
        ind.id === indicatorId ? { ...ind, ...progressData } : ind
      );
      updateCBOProject(projectId, { indicatorProgress: updatedIndicators });
    }
  };

  const value = {
    // State
    cboPartners,
    volunteers,
    activities,
    dueDiligence,
    cboProposals,
    cboProjects,

    // CBO Methods
    addCBO,
    updateCBO,
    deleteCBO,

    // Volunteer Methods
    addVolunteer,
    updateVolunteer,
    deleteVolunteer,

    // Activity Methods
    addActivity,
    updateActivity,
    deleteActivity,

    // Due Diligence Methods
    addDueDiligence,
    updateDueDiligence,

    // CBO Proposal Methods
    addCBOProposal,
    updateCBOProposal,
    fundraisingApproveProposal,
    fundraisingRejectProposal,
    ceoApproveProposal,
    ceoRejectProposal,
    donorApproveProposal,
    donorRejectProposal,
    convertProposalToProject,

    // CBO Project Methods
    addCBOProject,
    updateCBOProject,
    updateProjectProgress,
    addProjectIssue,

    // MEAL Methods
    addCFMFeedback,
    resolveCFMFeedback,
    addFieldMonitoring,
    addLearning,
    updateLearningStatus,
    updateIndicatorProgress,

    // Search
    searchCBOs,
    searchVolunteers,

    // Utils
    getStats,
    getDistricts
  };

  return (
    <CBOContext.Provider value={value}>
      {children}
    </CBOContext.Provider>
  );
};
