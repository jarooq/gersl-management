import { CBOProposal, CBOPartner, CBOProject, User } from '../models/index.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error.middleware.js';
import { Op } from 'sequelize';

// ============================================
// GET ALL PROPOSALS
// ============================================
export const getAllProposals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, workflowStage, cboPartnerId, programmeArea } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (workflowStage) where.workflowStage = workflowStage;
  if (cboPartnerId) where.cboPartnerId = cboPartnerId;
  if (programmeArea) where.programmeArea = programmeArea;

  const { count, rows: proposals } = await CBOProposal.findAndCountAll({
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
        model: CBOProject,
        as: 'project',
        attributes: ['id', 'projectTitle', 'status', 'progress']
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName']
      }
    ],
    order: [['submissionDate', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      proposals,
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
// GET PROPOSAL BY ID
// ============================================
export const getProposalById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const proposal = await CBOProposal.findByPk(id, {
    include: [
      {
        model: CBOPartner,
        as: 'cboPartner',
        attributes: ['id', 'name', 'acronym', 'district', 'contactPerson', 'email', 'phone']
      },
      {
        model: CBOProject,
        as: 'project',
        attributes: ['id', 'projectTitle', 'status', 'progress', 'startDate', 'endDate']
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName', 'email']
      }
    ]
  });

  if (!proposal) {
    throw new NotFoundError('Proposal not found');
  }

  res.json({
    success: true,
    data: { proposal }
  });
});

// ============================================
// GET PROPOSALS BY CBO PARTNER
// ============================================
export const getProposalsByCBO = asyncHandler(async (req, res) => {
  const { cboPartnerId } = req.params;

  const proposals = await CBOProposal.findAll({
    where: { cboPartnerId },
    include: [
      {
        model: CBOProject,
        as: 'project',
        attributes: ['id', 'projectTitle', 'status']
      }
    ],
    order: [['submissionDate', 'DESC']]
  });

  res.json({
    success: true,
    data: { proposals }
  });
});

// ============================================
// CREATE PROPOSAL
// ============================================
export const createProposal = asyncHandler(async (req, res) => {
  const {
    cboPartnerId,
    proposalTitle,
    programmeArea,
    district,
    duration,
    requestedBudget,
    targetBeneficiaries,
    objectives,
    activities,
    expectedOutcomes,
    submittedBy
  } = req.body;

  // Validate required fields
  if (!cboPartnerId || !proposalTitle || !programmeArea || !district || !requestedBudget || !submittedBy) {
    throw new ValidationError('CBO Partner, title, programme area, district, budget, and submitter are required');
  }

  // Check if CBO Partner exists
  const cbo = await CBOPartner.findByPk(cboPartnerId);
  if (!cbo) {
    throw new NotFoundError('CBO Partner not found');
  }

  // Create proposal
  const proposal = await CBOProposal.create({
    cboPartnerId,
    proposalTitle,
    programmeArea,
    district,
    duration,
    requestedBudget,
    targetBeneficiaries: targetBeneficiaries || 0,
    objectives,
    activities: activities || [],
    expectedOutcomes,
    submissionDate: new Date().toISOString().split('T')[0],
    submittedBy,
    status: 'Submitted',
    workflowStage: 'fundraising',
    fundraisingStatus: 'Pending',
    ceoStatus: 'Pending',
    donorStatus: 'Pending',
    convertedToProject: false,
    createdBy: req.user?.id
  });

  // Fetch with associations
  const createdProposal = await CBOProposal.findByPk(proposal.id, {
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
    message: 'Proposal created successfully',
    data: { proposal: createdProposal }
  });
});

// ============================================
// UPDATE PROPOSAL
// ============================================
export const updateProposal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const proposal = await CBOProposal.findByPk(id);
  if (!proposal) {
    throw new NotFoundError('Proposal not found');
  }

  // Don't allow updates to converted proposals
  if (proposal.convertedToProject) {
    throw new ValidationError('Cannot update a proposal that has been converted to a project');
  }

  await proposal.update(updates);

  // Fetch updated proposal with associations
  const updatedProposal = await CBOProposal.findByPk(id, {
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
    message: 'Proposal updated successfully',
    data: { proposal: updatedProposal }
  });
});

// ============================================
// FUNDRAISING APPROVE PROPOSAL
// ============================================
export const fundraisingApprove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { score, comments, reviewer } = req.body;

  if (!reviewer || !score) {
    throw new ValidationError('Reviewer and score are required');
  }

  const proposal = await CBOProposal.findByPk(id);
  if (!proposal) {
    throw new NotFoundError('Proposal not found');
  }

  if (proposal.workflowStage !== 'fundraising') {
    throw new ValidationError('Proposal is not at fundraising stage');
  }

  await proposal.update({
    fundraisingReviewer: reviewer,
    fundraisingReviewDate: new Date().toISOString().split('T')[0],
    fundraisingScore: score,
    fundraisingComments: comments,
    fundraisingStatus: 'Approved',
    status: 'CEO Approval',
    workflowStage: 'ceo'
  });

  const updatedProposal = await CBOProposal.findByPk(id, {
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
    message: 'Proposal approved by fundraising and forwarded to CEO',
    data: { proposal: updatedProposal }
  });
});

// ============================================
// FUNDRAISING REJECT PROPOSAL
// ============================================
export const fundraisingReject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { score, comments, reviewer } = req.body;

  if (!reviewer) {
    throw new ValidationError('Reviewer is required');
  }

  const proposal = await CBOProposal.findByPk(id);
  if (!proposal) {
    throw new NotFoundError('Proposal not found');
  }

  if (proposal.workflowStage !== 'fundraising') {
    throw new ValidationError('Proposal is not at fundraising stage');
  }

  await proposal.update({
    fundraisingReviewer: reviewer,
    fundraisingReviewDate: new Date().toISOString().split('T')[0],
    fundraisingScore: score,
    fundraisingComments: comments,
    fundraisingStatus: 'Rejected',
    status: 'Rejected by Fundraising',
    workflowStage: 'fundraising'
  });

  const updatedProposal = await CBOProposal.findByPk(id, {
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
    message: 'Proposal rejected by fundraising',
    data: { proposal: updatedProposal }
  });
});

// ============================================
// CEO APPROVE PROPOSAL
// ============================================
export const ceoApprove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { comments, approver, approvedBudget } = req.body;

  if (!approver) {
    throw new ValidationError('Approver is required');
  }

  const proposal = await CBOProposal.findByPk(id);
  if (!proposal) {
    throw new NotFoundError('Proposal not found');
  }

  if (proposal.workflowStage !== 'ceo') {
    throw new ValidationError('Proposal is not at CEO approval stage');
  }

  await proposal.update({
    ceoApprover: approver,
    ceoApprovalDate: new Date().toISOString().split('T')[0],
    ceoComments: comments,
    ceoStatus: 'Approved',
    approvedBudget: approvedBudget || proposal.requestedBudget,
    status: 'Donor Pending',
    workflowStage: 'donor'
  });

  const updatedProposal = await CBOProposal.findByPk(id, {
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
    message: 'Proposal approved by CEO and forwarded to donor',
    data: { proposal: updatedProposal }
  });
});

// ============================================
// CEO REJECT PROPOSAL
// ============================================
export const ceoReject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { comments, approver } = req.body;

  if (!approver) {
    throw new ValidationError('Approver is required');
  }

  const proposal = await CBOProposal.findByPk(id);
  if (!proposal) {
    throw new NotFoundError('Proposal not found');
  }

  if (proposal.workflowStage !== 'ceo') {
    throw new ValidationError('Proposal is not at CEO approval stage');
  }

  await proposal.update({
    ceoApprover: approver,
    ceoApprovalDate: new Date().toISOString().split('T')[0],
    ceoComments: comments,
    ceoStatus: 'Rejected',
    status: 'Rejected by CEO',
    workflowStage: 'ceo'
  });

  const updatedProposal = await CBOProposal.findByPk(id, {
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
    message: 'Proposal rejected by CEO',
    data: { proposal: updatedProposal }
  });
});

// ============================================
// DONOR APPROVE PROPOSAL
// ============================================
export const donorApprove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { donorName, approvedBudget } = req.body;

  if (!donorName || !approvedBudget) {
    throw new ValidationError('Donor name and approved budget are required');
  }

  const proposal = await CBOProposal.findByPk(id);
  if (!proposal) {
    throw new NotFoundError('Proposal not found');
  }

  if (proposal.workflowStage !== 'donor') {
    throw new ValidationError('Proposal is not at donor approval stage');
  }

  await proposal.update({
    donorName,
    donorApprovalDate: new Date().toISOString().split('T')[0],
    donorStatus: 'Approved',
    approvedBudget,
    status: 'Donor Approved - Ready for Conversion',
    workflowStage: 'approved'
  });

  const updatedProposal = await CBOProposal.findByPk(id, {
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
    message: 'Proposal approved by donor and ready for project conversion',
    data: { proposal: updatedProposal }
  });
});

// ============================================
// DONOR REJECT PROPOSAL
// ============================================
export const donorReject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { donorName } = req.body;

  if (!donorName) {
    throw new ValidationError('Donor name is required');
  }

  const proposal = await CBOProposal.findByPk(id);
  if (!proposal) {
    throw new NotFoundError('Proposal not found');
  }

  if (proposal.workflowStage !== 'donor') {
    throw new ValidationError('Proposal is not at donor approval stage');
  }

  await proposal.update({
    donorName,
    donorApprovalDate: new Date().toISOString().split('T')[0],
    donorStatus: 'Rejected',
    status: 'Rejected by Donor',
    workflowStage: 'donor'
  });

  const updatedProposal = await CBOProposal.findByPk(id, {
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
    message: 'Proposal rejected by donor',
    data: { proposal: updatedProposal }
  });
});

// ============================================
// DELETE PROPOSAL
// ============================================
export const deleteProposal = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const proposal = await CBOProposal.findByPk(id);
  if (!proposal) {
    throw new NotFoundError('Proposal not found');
  }

  // Don't allow deletion of converted proposals
  if (proposal.convertedToProject) {
    throw new ValidationError('Cannot delete a proposal that has been converted to a project');
  }

  // Only allow deletion of early-stage proposals
  if (!['Submitted', 'Rejected by Fundraising'].includes(proposal.status)) {
    throw new ValidationError('Only submitted or rejected proposals can be deleted');
  }

  await proposal.destroy();

  res.json({
    success: true,
    message: 'Proposal deleted successfully'
  });
});

// ============================================
// GET PROPOSAL STATISTICS
// ============================================
export const getProposalStats = asyncHandler(async (req, res) => {
  const { startDate, endDate, programmeArea } = req.query;

  const where = {};
  if (startDate && endDate) {
    where.submissionDate = {
      [Op.between]: [startDate, endDate]
    };
  }
  if (programmeArea) where.programmeArea = programmeArea;

  const [
    total,
    submitted,
    ceoApproval,
    donorPending,
    donorApproved,
    converted,
    rejectedFundraising,
    rejectedCEO,
    rejectedDonor
  ] = await Promise.all([
    CBOProposal.count({ where }),
    CBOProposal.count({ where: { ...where, status: 'Submitted' } }),
    CBOProposal.count({ where: { ...where, status: 'CEO Approval' } }),
    CBOProposal.count({ where: { ...where, status: 'Donor Pending' } }),
    CBOProposal.count({ where: { ...where, status: 'Donor Approved - Ready for Conversion' } }),
    CBOProposal.count({ where: { ...where, convertedToProject: true } }),
    CBOProposal.count({ where: { ...where, status: 'Rejected by Fundraising' } }),
    CBOProposal.count({ where: { ...where, status: 'Rejected by CEO' } }),
    CBOProposal.count({ where: { ...where, status: 'Rejected by Donor' } })
  ]);

  // Calculate budget statistics
  const proposals = await CBOProposal.findAll({
    where,
    attributes: ['requestedBudget', 'approvedBudget']
  });

  const totalRequested = proposals.reduce((sum, p) => sum + parseFloat(p.requestedBudget || 0), 0);
  const totalApproved = proposals.reduce((sum, p) => sum + parseFloat(p.approvedBudget || 0), 0);

  res.json({
    success: true,
    data: {
      total,
      byStatus: {
        submitted,
        ceoApproval,
        donorPending,
        donorApproved,
        converted
      },
      byRejection: {
        fundraising: rejectedFundraising,
        ceo: rejectedCEO,
        donor: rejectedDonor
      },
      totalRequested: totalRequested.toFixed(2),
      totalApproved: totalApproved.toFixed(2),
      approvalRate: total > 0 ? Math.round(((donorApproved + converted) / total) * 100) : 0,
      conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0
    }
  });
});
