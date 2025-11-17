import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateInitialMilestones } from '../constants/projectTemplates';
import {
  CBOVolunteerAPI,
  CBOActivityAPI,
  CBODueDiligenceAPI,
  CBOProposalAPI,
  CBOProjectAPI,
  CBOAPI
} from '../services/api';
import { useAuth } from './AuthContext';

const CBOContext = createContext(null);

export const useCBO = () => {
  const context = useContext(CBOContext);
  if (!context) {
    throw new Error('useCBO must be used within a CBOProvider');
  }
  return context;
};

export const CBOProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();

  // CBO Partners
  const [cboPartners, setCBOPartners] = useState([]);

  // Volunteers
  const [volunteers, setVolunteers] = useState([]);

  // Volunteer Activities
  const [activities, setActivities] = useState([]);

  // Due Diligence Assessments
  const [dueDiligence, setDueDiligence] = useState([]);

  // CBO Proposals
  const [cboProposals, setCBOProposals] = useState([]);

  // CBO Projects (Approved and Under Implementation)
  const [cboProjects, setCBOProjects] = useState([]);

  // Loading state
  const [loading, setLoading] = useState(false);

  // Load data from database only when authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      // Clear data when logged out
      setCBOPartners([]);
      setVolunteers([]);
      setActivities([]);
      setDueDiligence([]);
      setCBOProposals([]);
      setCBOProjects([]);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);

        const [
          partnersRes,
          volunteersRes,
          activitiesRes,
          dueDiligenceRes,
          proposalsRes,
          projectsRes
        ] = await Promise.allSettled([
          CBOAPI.getAll(),
          CBOVolunteerAPI.getAll(),
          CBOActivityAPI.getAll(),
          CBODueDiligenceAPI.getAll(),
          CBOProposalAPI.getAll(),
          CBOProjectAPI.getAll()
        ]);

        if (partnersRes.status === 'fulfilled') {
          setCBOPartners(partnersRes.value.partners || partnersRes.value.cboPartners || []);
        } else {
          console.error('Error loading CBO partners:', partnersRes.reason);
        }

        if (volunteersRes.status === 'fulfilled') {
          setVolunteers(volunteersRes.value.volunteers || []);
        } else {
          console.error('Error loading volunteers:', volunteersRes.reason);
        }

        if (activitiesRes.status === 'fulfilled') {
          setActivities(activitiesRes.value.activities || []);
        } else {
          console.error('Error loading activities:', activitiesRes.reason);
        }

        if (dueDiligenceRes.status === 'fulfilled') {
          setDueDiligence(dueDiligenceRes.value.assessments || []);
        } else {
          console.error('Error loading due diligence:', dueDiligenceRes.reason);
        }

        if (proposalsRes.status === 'fulfilled') {
          setCBOProposals(proposalsRes.value.proposals || []);
        } else {
          console.error('Error loading proposals:', proposalsRes.reason);
        }

        if (projectsRes.status === 'fulfilled') {
          setCBOProjects(projectsRes.value.projects || []);
        } else {
          console.error('Error loading projects:', projectsRes.reason);
        }
      } catch (error) {
        console.error('Error loading CBO data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isLoggedIn]);

  // ============================================
  // CBO CRUD Operations
  // ============================================

  const addCBO = async (cboData) => {
    try {
      const newCBO = await CBOAPI.create(cboData);
      setCBOPartners([...cboPartners, newCBO]);
      return newCBO;
    } catch (err) {
      console.error('Error adding CBO:', err);
      throw err;
    }
  };

  const updateCBO = async (id, updates) => {
    try {
      const updatedCBO = await CBOAPI.update(id, updates);
      setCBOPartners(cboPartners.map(c => c.id === id ? updatedCBO : c));
      return updatedCBO;
    } catch (err) {
      console.error('Error updating CBO:', err);
      throw err;
    }
  };

  const deleteCBO = async (id) => {
    if (window.confirm('Are you sure you want to delete this CBO partner?')) {
      try {
        await CBOAPI.delete(id);
        setCBOPartners(cboPartners.filter(c => c.id !== id));
      } catch (err) {
        console.error('Error deleting CBO:', err);
        throw err;
      }
    }
  };

  // ============================================
  // Volunteer CRUD Operations
  // ============================================

  const addVolunteer = async (volunteerData) => {
    try {
      const newVolunteer = await CBOVolunteerAPI.create(volunteerData);
      setVolunteers([...volunteers, newVolunteer]);
      return newVolunteer;
    } catch (err) {
      console.error('Error adding volunteer:', err);
      throw err;
    }
  };

  const updateVolunteer = async (id, updates) => {
    try {
      const updatedVolunteer = await CBOVolunteerAPI.update(id, updates);
      setVolunteers(volunteers.map(v => v.id === id ? updatedVolunteer : v));
      return updatedVolunteer;
    } catch (err) {
      console.error('Error updating volunteer:', err);
      throw err;
    }
  };

  const deleteVolunteer = async (id) => {
    if (window.confirm('Are you sure you want to delete this volunteer?')) {
      try {
        await CBOVolunteerAPI.delete(id);
        setVolunteers(volunteers.filter(v => v.id !== id));
      } catch (err) {
        console.error('Error deleting volunteer:', err);
        throw err;
      }
    }
  };

  // ============================================
  // Activity CRUD Operations
  // ============================================

  const addActivity = async (activityData) => {
    try {
      const newActivity = await CBOActivityAPI.create(activityData);
      setActivities([...activities, newActivity]);
      return newActivity;
    } catch (err) {
      console.error('Error adding activity:', err);
      throw err;
    }
  };

  const updateActivity = async (id, updates) => {
    try {
      const updatedActivity = await CBOActivityAPI.update(id, updates);
      setActivities(activities.map(a => a.id === id ? updatedActivity : a));
      return updatedActivity;
    } catch (err) {
      console.error('Error updating activity:', err);
      throw err;
    }
  };

  const deleteActivity = async (id) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        await CBOActivityAPI.delete(id);
        setActivities(activities.filter(a => a.id !== id));
      } catch (err) {
        console.error('Error deleting activity:', err);
        throw err;
      }
    }
  };

  // ============================================
  // Due Diligence Methods
  // ============================================

  const addDueDiligence = async (assessment) => {
    try {
      const newAssessment = await CBODueDiligenceAPI.create(assessment);
      setDueDiligence([...dueDiligence, newAssessment]);
      return newAssessment;
    } catch (err) {
      console.error('Error adding due diligence:', err);
      throw err;
    }
  };

  const updateDueDiligence = async (id, updates) => {
    try {
      const updatedAssessment = await CBODueDiligenceAPI.update(id, updates);
      setDueDiligence(dueDiligence.map(dd => dd.id === id ? updatedAssessment : dd));
      return updatedAssessment;
    } catch (err) {
      console.error('Error updating due diligence:', err);
      throw err;
    }
  };

  // ============================================
  // CBO Proposal Methods
  // ============================================

  const addCBOProposal = async (proposal) => {
    try {
      const newProposal = await CBOProposalAPI.create(proposal);
      setCBOProposals([...cboProposals, newProposal]);
      return newProposal;
    } catch (err) {
      console.error('Error adding proposal:', err);
      throw err;
    }
  };

  const updateCBOProposal = async (id, updates) => {
    try {
      const updatedProposal = await CBOProposalAPI.update(id, updates);
      setCBOProposals(cboProposals.map(p => p.id === id ? updatedProposal : p));
      return updatedProposal;
    } catch (err) {
      console.error('Error updating proposal:', err);
      throw err;
    }
  };

  // Fundraising Manager Actions
  const fundraisingApproveProposal = async (id, score, comments, reviewer) => {
    try {
      const updatedProposal = await CBOProposalAPI.fundraisingApprove(id, score, comments, reviewer);
      setCBOProposals(cboProposals.map(p => p.id === id ? updatedProposal : p));
      return updatedProposal;
    } catch (err) {
      console.error('Error approving proposal (fundraising):', err);
      throw err;
    }
  };

  const fundraisingRejectProposal = async (id, score, comments, reviewer) => {
    try {
      const updatedProposal = await CBOProposalAPI.fundraisingReject(id, score, comments, reviewer);
      setCBOProposals(cboProposals.map(p => p.id === id ? updatedProposal : p));
      return updatedProposal;
    } catch (err) {
      console.error('Error rejecting proposal (fundraising):', err);
      throw err;
    }
  };

  // CEO Actions
  const ceoApproveProposal = async (id, comments, approver, approvedBudget) => {
    try {
      const updatedProposal = await CBOProposalAPI.ceoApprove(id, comments, approver, approvedBudget);
      setCBOProposals(cboProposals.map(p => p.id === id ? updatedProposal : p));
      return updatedProposal;
    } catch (err) {
      console.error('Error approving proposal (CEO):', err);
      throw err;
    }
  };

  const ceoRejectProposal = async (id, comments, approver) => {
    try {
      const updatedProposal = await CBOProposalAPI.ceoReject(id, comments, approver);
      setCBOProposals(cboProposals.map(p => p.id === id ? updatedProposal : p));
      return updatedProposal;
    } catch (err) {
      console.error('Error rejecting proposal (CEO):', err);
      throw err;
    }
  };

  // Donor Approval
  const donorApproveProposal = async (id, donorName, approvedBudget) => {
    try {
      const updatedProposal = await CBOProposalAPI.donorApprove(id, donorName, approvedBudget);
      setCBOProposals(cboProposals.map(p => p.id === id ? updatedProposal : p));
      return updatedProposal;
    } catch (err) {
      console.error('Error approving proposal (donor):', err);
      throw err;
    }
  };

  const donorRejectProposal = async (id, donorName) => {
    try {
      const updatedProposal = await CBOProposalAPI.donorReject(id, donorName);
      setCBOProposals(cboProposals.map(p => p.id === id ? updatedProposal : p));
      return updatedProposal;
    } catch (err) {
      console.error('Error rejecting proposal (donor):', err);
      throw err;
    }
  };

  // Convert Proposal to Project
  const convertProposalToProject = async (proposalId) => {
    try {
      const proposal = cboProposals.find(p => p.id === proposalId);
      if (!proposal || proposal.convertedToProject) {
        return null;
      }

      // Calculate dates
      const calculateEndDate = (duration) => {
        const months = parseInt(duration);
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + months);
        return endDate.toISOString().split('T')[0];
      };

      // Create new project from proposal
      const projectData = {
        cboPartnerId: proposal.cboPartnerId,
        proposalId: proposalId,
        projectTitle: proposal.proposalTitle,
        programmeArea: proposal.programmeArea,
        district: proposal.district,
        startDate: new Date().toISOString().split('T')[0],
        endDate: calculateEndDate(proposal.duration),
        budget: proposal.approvedBudget || proposal.requestedBudget,
        targetBeneficiaries: proposal.targetBeneficiaries,
        projectManager: proposal.submittedBy,
        gerslFocalPerson: proposal.fundraisingReviewer,
        milestones: generateInitialMilestones(proposal.duration)
      };

      const newProject = await CBOProjectAPI.create(projectData);
      setCBOProjects([...cboProjects, newProject]);

      // Update proposal in local state (backend already updated it)
      const updatedProposal = await CBOProposalAPI.getById(proposalId);
      setCBOProposals(cboProposals.map(p => p.id === proposalId ? updatedProposal : p));

      return newProject.id;
    } catch (err) {
      console.error('Error converting proposal to project:', err);
      throw err;
    }
  };

  // ============================================
  // CBO Project Methods
  // ============================================

  const addCBOProject = async (project) => {
    try {
      const newProject = await CBOProjectAPI.create(project);
      setCBOProjects([...cboProjects, newProject]);
      return newProject;
    } catch (err) {
      console.error('Error adding project:', err);
      throw err;
    }
  };

  const updateCBOProject = async (id, updates) => {
    try {
      const updatedProject = await CBOProjectAPI.update(id, updates);
      setCBOProjects(cboProjects.map(p => p.id === id ? updatedProject : p));
      return updatedProject;
    } catch (err) {
      console.error('Error updating project:', err);
      throw err;
    }
  };

  const updateProjectProgress = async (id, spent, progress, actualBeneficiaries) => {
    try {
      const updatedProject = await CBOProjectAPI.updateProgress(id, spent, progress, actualBeneficiaries);
      setCBOProjects(cboProjects.map(p => p.id === id ? updatedProject : p));
      return updatedProject;
    } catch (err) {
      console.error('Error updating project progress:', err);
      throw err;
    }
  };

  const addProjectIssue = async (projectId, issue) => {
    try {
      const updatedProject = await CBOProjectAPI.addIssue(projectId, issue);
      setCBOProjects(cboProjects.map(p => p.id === projectId ? updatedProject : p));
      return updatedProject;
    } catch (err) {
      console.error('Error adding project issue:', err);
      throw err;
    }
  };

  // ============================================
  // MEAL Methods - Community Feedback Mechanism (CFM)
  // ============================================

  const addCFMFeedback = async (projectId, feedback) => {
    try {
      const updatedProject = await CBOProjectAPI.addCFMFeedback(projectId, feedback);
      setCBOProjects(cboProjects.map(p => p.id === projectId ? updatedProject : p));
      // Return the feedback ID from the updated project
      const newFeedback = updatedProject.cfmFeedback[updatedProject.cfmFeedback.length - 1];
      return newFeedback?.id || null;
    } catch (err) {
      console.error('Error adding CFM feedback:', err);
      throw err;
    }
  };

  const resolveCFMFeedback = async (projectId, feedbackId, resolution) => {
    try {
      const updates = {
        actionTaken: resolution.actionTaken,
        responsiblePerson: resolution.responsiblePerson,
        status: 'Resolved'
      };
      const updatedProject = await CBOProjectAPI.updateCFMFeedback(projectId, feedbackId, updates);
      setCBOProjects(cboProjects.map(p => p.id === projectId ? updatedProject : p));
      return updatedProject;
    } catch (err) {
      console.error('Error resolving CFM feedback:', err);
      throw err;
    }
  };

  // ============================================
  // MEAL Methods - Field Monitoring
  // ============================================

  const addFieldMonitoring = async (projectId, monitoringData) => {
    try {
      // Add to project's fieldMonitoring array via update
      const project = cboProjects.find(p => p.id === projectId);
      if (!project) return null;

      const newMonitoring = {
        id: `FM-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        ...monitoringData
      };

      const updatedProject = await CBOProjectAPI.update(projectId, {
        fieldMonitoring: [...(project.fieldMonitoring || []), newMonitoring]
      });

      setCBOProjects(cboProjects.map(p => p.id === projectId ? updatedProject : p));
      return newMonitoring.id;
    } catch (err) {
      console.error('Error adding field monitoring:', err);
      throw err;
    }
  };

  // ============================================
  // MEAL Methods - Learning & Adaptation
  // ============================================

  const addLearning = async (projectId, learning) => {
    try {
      const project = cboProjects.find(p => p.id === projectId);
      if (!project) return null;

      const newLearning = {
        id: `LRN-${Date.now()}`,
        dateIdentified: new Date().toISOString().split('T')[0],
        ...learning,
        status: learning.status || 'Pending'
      };

      const updatedProject = await CBOProjectAPI.update(projectId, {
        learningLog: [...(project.learningLog || []), newLearning]
      });

      setCBOProjects(cboProjects.map(p => p.id === projectId ? updatedProject : p));
      return newLearning.id;
    } catch (err) {
      console.error('Error adding learning:', err);
      throw err;
    }
  };

  const updateLearningStatus = async (projectId, learningId, status, notes) => {
    try {
      const project = cboProjects.find(p => p.id === projectId);
      if (!project || !project.learningLog) return;

      const updatedLearning = project.learningLog.map(lrn =>
        lrn.id === learningId ? {
          ...lrn,
          status,
          implementationNotes: notes,
          dateCompleted: status === 'Implemented' ? new Date().toISOString().split('T')[0] : null
        } : lrn
      );

      const updatedProject = await CBOProjectAPI.update(projectId, {
        learningLog: updatedLearning
      });

      setCBOProjects(cboProjects.map(p => p.id === projectId ? updatedProject : p));
      return updatedProject;
    } catch (err) {
      console.error('Error updating learning status:', err);
      throw err;
    }
  };

  // ============================================
  // MEAL Methods - Indicator Tracking
  // ============================================

  const updateIndicatorProgress = async (projectId, indicatorId, progressData) => {
    try {
      const project = cboProjects.find(p => p.id === projectId);
      if (!project || !project.indicatorProgress) return;

      const updatedIndicators = project.indicatorProgress.map(ind =>
        ind.id === indicatorId ? { ...ind, ...progressData } : ind
      );

      const updatedProject = await CBOProjectAPI.update(projectId, {
        indicatorProgress: updatedIndicators
      });

      setCBOProjects(cboProjects.map(p => p.id === projectId ? updatedProject : p));
      return updatedProject;
    } catch (err) {
      console.error('Error updating indicator progress:', err);
      throw err;
    }
  };

  // ============================================
  // Search Functions
  // ============================================

  const searchCBOs = (query) => {
    const q = query.toLowerCase();
    return cboPartners.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.acronym?.toLowerCase().includes(q) ||
      c.district?.toLowerCase().includes(q) ||
      c.type?.toLowerCase().includes(q)
    );
  };

  const searchVolunteers = async (query) => {
    try {
      const results = await CBOVolunteerAPI.search(query);
      return results;
    } catch (err) {
      console.error('Error searching volunteers:', err);
      // Fallback to local search
      const q = query.toLowerCase();
      return volunteers.filter(v =>
        v.fullName?.toLowerCase().includes(q) ||
        v.district?.toLowerCase().includes(q) ||
        v.cboAffiliation?.toLowerCase().includes(q) ||
        v.skills?.some(s => s.toLowerCase().includes(q))
      );
    }
  };

  // ============================================
  // Statistics
  // ============================================

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
      totalHoursLogged: volunteers.reduce((sum, v) => sum + (v.hoursContributed || 0), 0),
      avgVolunteerRating: volunteers.filter(v => v.rating).length > 0
        ? (volunteers.filter(v => v.rating).reduce((sum, v) => sum + v.rating, 0) / volunteers.filter(v => v.rating).length).toFixed(1)
        : 0
    };
  };

  const getDistricts = () => {
    return [...new Set(cboPartners.map(c => c.district).filter(Boolean))].sort();
  };

  const value = {
    // State
    cboPartners,
    volunteers,
    activities,
    dueDiligence,
    cboProposals,
    cboProjects,
    loading,

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
