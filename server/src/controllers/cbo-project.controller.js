import { CBOProject, CBOProposal, CBOPartner, User } from '../models/index.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error.middleware.js';
import { Op } from 'sequelize';

// ============================================
// GET ALL PROJECTS
// ============================================
export const getAllProjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, programmeArea, cboPartnerId } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (programmeArea) where.programmeArea = programmeArea;
  if (cboPartnerId) where.cboPartnerId = cboPartnerId;

  const { count, rows: projects } = await CBOProject.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    include: [
      {
        model: CBOPartner,
        as: 'cboPartner',
        attributes: ['id', 'name', 'acronym', 'district', 'contactPerson']
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName']
      }
    ],
    order: [['startDate', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      projects,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    }
  });
});

// ============================================
// GET PROJECT BY ID
// ============================================
export const getProjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await CBOProject.findByPk(id, {
    include: [
      {
        model: CBOPartner,
        as: 'cboPartner',
        attributes: ['id', 'name', 'acronym', 'district', 'contactPerson', 'email', 'phone']
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName', 'email']
      }
    ]
  });

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  res.json({
    success: true,
    data: { project }
  });
});

// ============================================
// GET PROJECTS BY CBO PARTNER
// ============================================
export const getProjectsByCBO = asyncHandler(async (req, res) => {
  const { cboPartnerId } = req.params;

  const projects = await CBOProject.findAll({
    where: { cboPartnerId },
    order: [['startDate', 'DESC']]
  });

  res.json({
    success: true,
    data: { projects }
  });
});

// ============================================
// CREATE PROJECT (FROM PROPOSAL OR DIRECT)
// ============================================
export const createProject = asyncHandler(async (req, res) => {
  const {
    cboPartnerId,
    proposalId,
    projectTitle,
    programmeArea,
    district,
    startDate,
    endDate,
    budget,
    targetBeneficiaries,
    projectManager,
    gerslFocalPerson,
    milestones
  } = req.body;

  // Validate required fields
  if (!cboPartnerId || !projectTitle || !programmeArea || !district || !startDate || !endDate || !budget || !projectManager) {
    throw new ValidationError('CBO Partner, title, programme area, district, dates, budget, and project manager are required');
  }

  // Check if CBO Partner exists
  const cbo = await CBOPartner.findByPk(cboPartnerId);
  if (!cbo) {
    throw new NotFoundError('CBO Partner not found');
  }

  // If created from proposal, mark proposal as converted
  if (proposalId) {
    const proposal = await CBOProposal.findByPk(proposalId);
    if (!proposal) {
      throw new NotFoundError('Proposal not found');
    }

    if (proposal.convertedToProject) {
      throw new ValidationError('This proposal has already been converted to a project');
    }
  }

  // Calculate next report due date (1 month from start)
  const nextReportDue = new Date(startDate);
  nextReportDue.setMonth(nextReportDue.getMonth() + 1);

  // Create project
  const project = await CBOProject.create({
    cboPartnerId,
    projectTitle,
    programmeArea,
    district,
    startDate,
    endDate,
    budget,
    spent: 0,
    progress: 0,
    status: 'Active',
    targetBeneficiaries: targetBeneficiaries || 0,
    actualBeneficiaries: 0,
    projectManager,
    gerslFocalPerson,
    lastReportDate: null,
    nextReportDue: nextReportDue.toISOString().split('T')[0],
    milestones: milestones || [],
    issues: [],
    cfmFeedback: [],
    createdBy: req.user?.id
  });

  // If from proposal, update the proposal
  if (proposalId) {
    await CBOProposal.update(
      {
        convertedToProject: true,
        projectId: project.id,
        status: 'Converted to Project',
        workflowStage: 'converted',
        projectStartDate: startDate
      },
      { where: { id: proposalId } }
    );
  }

  // Fetch with associations
  const createdProject = await CBOProject.findByPk(project.id, {
    include: [
      {
        model: CBOPartner,
        as: 'cboPartner',
        attributes: ['id', 'name', 'acronym', 'district']
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: { project: createdProject }
  });
});

// ============================================
// UPDATE PROJECT
// ============================================
export const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const project = await CBOProject.findByPk(id);
  if (!project) {
    throw new NotFoundError('Project not found');
  }

  // Validate progress if provided
  if (updates.progress !== undefined && (updates.progress < 0 || updates.progress > 100)) {
    throw new ValidationError('Progress must be between 0 and 100');
  }

  // Auto-complete if progress is 100
  if (updates.progress === 100 && project.status !== 'Completed') {
    updates.status = 'Completed';
  }

  await project.update(updates);

  // Fetch updated project with associations
  const updatedProject = await CBOProject.findByPk(id, {
    include: [
      {
        model: CBOPartner,
        as: 'cboPartner',
        attributes: ['id', 'name', 'acronym', 'district']
      }
    ]
  });

  res.json({
    success: true,
    message: 'Project updated successfully',
    data: { project: updatedProject }
  });
});

// ============================================
// UPDATE PROJECT PROGRESS
// ============================================
export const updateProjectProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { spent, progress, actualBeneficiaries } = req.body;

  const project = await CBOProject.findByPk(id);
  if (!project) {
    throw new NotFoundError('Project not found');
  }

  const updates = {
    lastReportDate: new Date().toISOString().split('T')[0]
  };

  if (spent !== undefined) updates.spent = spent;
  if (actualBeneficiaries !== undefined) updates.actualBeneficiaries = actualBeneficiaries;

  if (progress !== undefined) {
    if (progress < 0 || progress > 100) {
      throw new ValidationError('Progress must be between 0 and 100');
    }
    updates.progress = progress;
    if (progress === 100) {
      updates.status = 'Completed';
    }
  }

  await project.update(updates);

  const updatedProject = await CBOProject.findByPk(id, {
    include: [
      {
        model: CBOPartner,
        as: 'cboPartner',
        attributes: ['id', 'name', 'acronym']
      }
    ]
  });

  res.json({
    success: true,
    message: 'Project progress updated successfully',
    data: { project: updatedProject }
  });
});

// ============================================
// ADD PROJECT ISSUE
// ============================================
export const addProjectIssue = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { issue } = req.body;

  if (!issue || !issue.description) {
    throw new ValidationError('Issue description is required');
  }

  const project = await CBOProject.findByPk(id);
  if (!project) {
    throw new NotFoundError('Project not found');
  }

  const newIssue = {
    id: (project.issues?.length || 0) + 1,
    date: new Date().toISOString().split('T')[0],
    reportedBy: req.user?.fullName || 'Unknown',
    ...issue,
    status: issue.status || 'Open'
  };

  await project.update({
    issues: [...(project.issues || []), newIssue]
  });

  const updatedProject = await CBOProject.findByPk(id);

  res.json({
    success: true,
    message: 'Issue added successfully',
    data: { project: updatedProject }
  });
});

// ============================================
// UPDATE PROJECT ISSUE
// ============================================
export const updateProjectIssue = asyncHandler(async (req, res) => {
  const { id, issueId } = req.params;
  const { updates } = req.body;

  const project = await CBOProject.findByPk(id);
  if (!project) {
    throw new NotFoundError('Project not found');
  }

  const issues = project.issues || [];
  const issueIndex = issues.findIndex(i => i.id === parseInt(issueId));

  if (issueIndex === -1) {
    throw new NotFoundError('Issue not found');
  }

  issues[issueIndex] = { ...issues[issueIndex], ...updates };

  await project.update({ issues });

  const updatedProject = await CBOProject.findByPk(id);

  res.json({
    success: true,
    message: 'Issue updated successfully',
    data: { project: updatedProject }
  });
});

// ============================================
// ADD CFM FEEDBACK
// ============================================
export const addCFMFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { feedback } = req.body;

  if (!feedback || !feedback.feedbackType || !feedback.description) {
    throw new ValidationError('Feedback type and description are required');
  }

  const project = await CBOProject.findByPk(id);
  if (!project) {
    throw new NotFoundError('Project not found');
  }

  const newFeedback = {
    id: `CFM-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    ...feedback,
    status: feedback.feedbackType === 'Positive' ? 'Acknowledged' : 'Open'
  };

  await project.update({
    cfmFeedback: [...(project.cfmFeedback || []), newFeedback]
  });

  const updatedProject = await CBOProject.findByPk(id);

  res.json({
    success: true,
    message: 'CFM feedback added successfully',
    data: { project: updatedProject }
  });
});

// ============================================
// UPDATE CFM FEEDBACK
// ============================================
export const updateCFMFeedback = asyncHandler(async (req, res) => {
  const { id, feedbackId } = req.params;
  const { updates } = req.body;

  const project = await CBOProject.findByPk(id);
  if (!project) {
    throw new NotFoundError('Project not found');
  }

  const cfmFeedback = project.cfmFeedback || [];
  const feedbackIndex = cfmFeedback.findIndex(f => f.id === feedbackId);

  if (feedbackIndex === -1) {
    throw new NotFoundError('Feedback not found');
  }

  cfmFeedback[feedbackIndex] = { ...cfmFeedback[feedbackIndex], ...updates };

  await project.update({ cfmFeedback });

  const updatedProject = await CBOProject.findByPk(id);

  res.json({
    success: true,
    message: 'CFM feedback updated successfully',
    data: { project: updatedProject }
  });
});

// ============================================
// DELETE PROJECT
// ============================================
export const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await CBOProject.findByPk(id);
  if (!project) {
    throw new NotFoundError('Project not found');
  }

  // Don't allow deletion of active projects
  if (project.status === 'Active') {
    throw new ValidationError('Cannot delete an active project. Please mark it as cancelled first.');
  }

  await project.destroy();

  res.json({
    success: true,
    message: 'Project deleted successfully'
  });
});

// ============================================
// GET PROJECT STATISTICS
// ============================================
export const getProjectStats = asyncHandler(async (req, res) => {
  const { cboPartnerId, programmeArea, startDate, endDate } = req.query;

  const where = {};
  if (cboPartnerId) where.cboPartnerId = cboPartnerId;
  if (programmeArea) where.programmeArea = programmeArea;
  if (startDate && endDate) {
    where.startDate = {
      [Op.between]: [startDate, endDate]
    };
  }

  const [
    total,
    active,
    completed,
    onHold,
    cancelled
  ] = await Promise.all([
    CBOProject.count({ where }),
    CBOProject.count({ where: { ...where, status: 'Active' } }),
    CBOProject.count({ where: { ...where, status: 'Completed' } }),
    CBOProject.count({ where: { ...where, status: 'On Hold' } }),
    CBOProject.count({ where: { ...where, status: 'Cancelled' } })
  ]);

  // Calculate financial and beneficiary statistics
  const projects = await CBOProject.findAll({
    where,
    attributes: ['budget', 'spent', 'progress', 'targetBeneficiaries', 'actualBeneficiaries', 'issues', 'cfmFeedback']
  });

  const totalBudget = projects.reduce((sum, p) => sum + parseFloat(p.budget || 0), 0);
  const totalSpent = projects.reduce((sum, p) => sum + parseFloat(p.spent || 0), 0);
  const totalTargetBeneficiaries = projects.reduce((sum, p) => sum + (p.targetBeneficiaries || 0), 0);
  const totalActualBeneficiaries = projects.reduce((sum, p) => sum + (p.actualBeneficiaries || 0), 0);
  const avgProgress = total > 0 ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / total) : 0;

  // Count issues and feedback
  const totalIssues = projects.reduce((sum, p) => sum + (p.issues?.length || 0), 0);
  const openIssues = projects.reduce((sum, p) => sum + (p.issues?.filter(i => i.status === 'Open').length || 0), 0);
  const totalFeedback = projects.reduce((sum, p) => sum + (p.cfmFeedback?.length || 0), 0);

  res.json({
    success: true,
    data: {
      total,
      byStatus: {
        active,
        completed,
        onHold,
        cancelled
      },
      financial: {
        totalBudget: totalBudget.toFixed(2),
        totalSpent: totalSpent.toFixed(2),
        remaining: (totalBudget - totalSpent).toFixed(2),
        utilizationRate: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
      },
      beneficiaries: {
        target: totalTargetBeneficiaries,
        actual: totalActualBeneficiaries,
        achievementRate: totalTargetBeneficiaries > 0 ? Math.round((totalActualBeneficiaries / totalTargetBeneficiaries) * 100) : 0
      },
      avgProgress,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      issues: {
        total: totalIssues,
        open: openIssues,
        resolved: totalIssues - openIssues
      },
      totalCFMFeedback: totalFeedback
    }
  });
});
