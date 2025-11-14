import asyncHandler from 'express-async-handler';
import { Proposal, User, Project } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * @desc    Get all proposals
 * @route   GET /api/proposals
 * @access  Private
 */
export const getAllProposals = asyncHandler(async (req, res) => {
  const {
    status,
    priority,
    donor,
    programmeArea,
    limit = 100,
    offset = 0
  } = req.query;

  const where = {};

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (donor) where.donor = donor;
  if (programmeArea) where.programmeArea = programmeArea;

  const { count, rows: proposals } = await Proposal.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'fullName', 'email']
      },
      {
        model: User,
        as: 'editor',
        attributes: ['id', 'username', 'fullName', 'email']
      },
      {
        model: Project,
        as: 'linkedProject',
        attributes: ['id', 'name', 'status']
      }
    ]
  });

  res.json({
    success: true,
    data: {
      proposals,
      count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  });
});

/**
 * @desc    Get single proposal by ID
 * @route   GET /api/proposals/:id
 * @access  Private
 */
export const getProposalById = asyncHandler(async (req, res) => {
  const proposal = await Proposal.findByPk(req.params.id, {
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'fullName', 'email']
      },
      {
        model: User,
        as: 'editor',
        attributes: ['id', 'username', 'fullName', 'email']
      },
      {
        model: Project,
        as: 'linkedProject',
        attributes: ['id', 'name', 'status', 'progress']
      }
    ]
  });

  if (!proposal) {
    res.status(404);
    throw new Error('Proposal not found');
  }

  res.json({
    success: true,
    data: { proposal }
  });
});

/**
 * @desc    Create new proposal
 * @route   POST /api/proposals
 * @access  Private
 */
export const createProposal = asyncHandler(async (req, res) => {
  const proposalData = req.body;

  // Set created by from authenticated user
  proposalData.createdBy = req.user.id;

  // Auto-generate proposal code if not provided
  if (!proposalData.proposalCode) {
    const year = new Date().getFullYear();
    const count = await Proposal.count({
      where: {
        proposalCode: {
          [Op.like]: `PROP-${year}-%`
        }
      }
    });
    proposalData.proposalCode = `PROP-${year}-${String(count + 1).padStart(3, '0')}`;
  }

  // Set submission date if not provided
  if (!proposalData.submissionDate) {
    proposalData.submissionDate = new Date();
  }

  const proposal = await Proposal.create(proposalData);

  // Fetch with associations
  const fullProposal = await Proposal.findByPk(proposal.id, {
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'fullName', 'email']
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Proposal created successfully',
    data: { proposal: fullProposal }
  });
});

/**
 * @desc    Update proposal
 * @route   PUT /api/proposals/:id
 * @access  Private
 */
export const updateProposal = asyncHandler(async (req, res) => {
  const proposal = await Proposal.findByPk(req.params.id);

  if (!proposal) {
    res.status(404);
    throw new Error('Proposal not found');
  }

  const updatedData = req.body;
  updatedData.lastEditedBy = req.user.id;

  await proposal.update(updatedData);

  // Fetch with associations
  const updatedProposal = await Proposal.findByPk(proposal.id, {
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'fullName', 'email']
      },
      {
        model: User,
        as: 'editor',
        attributes: ['id', 'username', 'fullName', 'email']
      }
    ]
  });

  res.json({
    success: true,
    message: 'Proposal updated successfully',
    data: { proposal: updatedProposal }
  });
});

/**
 * @desc    Delete proposal
 * @route   DELETE /api/proposals/:id
 * @access  Private
 */
export const deleteProposal = asyncHandler(async (req, res) => {
  const proposal = await Proposal.findByPk(req.params.id);

  if (!proposal) {
    res.status(404);
    throw new Error('Proposal not found');
  }

  await proposal.destroy();

  res.json({
    success: true,
    message: 'Proposal deleted successfully'
  });
});

/**
 * @desc    Update proposal status
 * @route   PATCH /api/proposals/:id/status
 * @access  Private
 */
export const updateProposalStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const proposal = await Proposal.findByPk(req.params.id);

  if (!proposal) {
    res.status(404);
    throw new Error('Proposal not found');
  }

  if (!['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  proposal.status = status;
  proposal.lastEditedBy = req.user.id;
  await proposal.save();

  res.json({
    success: true,
    message: `Proposal status updated to ${status}`,
    data: { proposal }
  });
});

/**
 * @desc    Link proposal to project
 * @route   PATCH /api/proposals/:id/link-project
 * @access  Private
 */
export const linkProposalToProject = asyncHandler(async (req, res) => {
  const { projectId, projectCode } = req.body;
  const proposal = await Proposal.findByPk(req.params.id);

  if (!proposal) {
    res.status(404);
    throw new Error('Proposal not found');
  }

  proposal.linkedProjectId = projectId;
  proposal.linkedProjectCode = projectCode;
  proposal.convertedToProjectDate = new Date();
  proposal.lastEditedBy = req.user.id;
  await proposal.save();

  res.json({
    success: true,
    message: 'Proposal linked to project successfully',
    data: { proposal }
  });
});

/**
 * @desc    Get proposal statistics
 * @route   GET /api/proposals/stats
 * @access  Private
 */
export const getProposalStats = asyncHandler(async (req, res) => {
  const totalProposals = await Proposal.count();
  const draftProposals = await Proposal.count({ where: { status: 'Draft' } });
  const submittedProposals = await Proposal.count({
    where: {
      status: { [Op.in]: ['Submitted', 'Under Review'] }
    }
  });
  const approvedProposals = await Proposal.count({ where: { status: 'Approved' } });
  const rejectedProposals = await Proposal.count({ where: { status: 'Rejected' } });

  const budgetAgg = await Proposal.findAll({
    attributes: [
      [Proposal.sequelize.fn('SUM', Proposal.sequelize.col('budget_requested')), 'totalBudgetRequested'],
      [Proposal.sequelize.fn('SUM', Proposal.sequelize.literal('CASE WHEN status = \'Approved\' THEN budget_requested ELSE 0 END')), 'approvedBudget']
    ],
    raw: true
  });

  const beneficiariesAgg = await Proposal.findAll({
    attributes: [
      [Proposal.sequelize.fn('SUM', Proposal.sequelize.col('target_beneficiaries')), 'totalBeneficiaries']
    ],
    raw: true
  });

  const successRate = totalProposals > 0
    ? Math.round((approvedProposals / (approvedProposals + rejectedProposals || 1)) * 100)
    : 0;

  res.json({
    success: true,
    data: {
      totalProposals,
      draftProposals,
      submittedProposals,
      approvedProposals,
      rejectedProposals,
      totalBudgetRequested: parseFloat(budgetAgg[0]?.totalBudgetRequested || 0),
      approvedBudget: parseFloat(budgetAgg[0]?.approvedBudget || 0),
      totalBeneficiaries: parseInt(beneficiariesAgg[0]?.totalBeneficiaries || 0),
      successRate
    }
  });
});
