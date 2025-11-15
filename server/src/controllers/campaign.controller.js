import { Op } from 'sequelize';
import { Campaign, Donation, User } from '../models/index.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error.middleware.js';

// ============================================
// GET ALL CAMPAIGNS
// ============================================
export const getAllCampaigns = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, type, approvalStatus } = req.query;
  const offset = (page - 1) * limit;

  const where = {};

  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { campaignCode: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (status) where.status = status;
  if (type) where.type = type;
  if (approvalStatus) where.approvalStatus = approvalStatus;

  const { count, rows: campaigns } = await Campaign.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName', 'email'] },
      { model: User, as: 'approver', attributes: ['id', 'fullName', 'email'] }
    ]
  });

  res.json({
    success: true,
    data: {
      campaigns,
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
// GET SINGLE CAMPAIGN
// ============================================
export const getCampaignById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const campaign = await Campaign.findByPk(id, {
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName', 'email'] },
      { model: User, as: 'approver', attributes: ['id', 'fullName', 'email'] },
      { model: Donation, as: 'donations' }
    ]
  });

  if (!campaign) {
    throw new NotFoundError('Campaign not found');
  }

  res.json({
    success: true,
    data: { campaign }
  });
});

// ============================================
// CREATE CAMPAIGN
// ============================================
export const createCampaign = asyncHandler(async (req, res) => {
  const campaignData = req.body;

  // Generate campaign code if not provided
  if (!campaignData.campaignCode) {
    const count = await Campaign.count();
    campaignData.campaignCode = `CAMP-${String(count + 1).padStart(4, '0')}`;
  }

  // Set creator
  if (req.user) {
    campaignData.createdBy = req.user.id;
  }

  const campaign = await Campaign.create(campaignData);

  res.status(201).json({
    success: true,
    message: 'Campaign created successfully',
    data: { campaign }
  });
});

// ============================================
// UPDATE CAMPAIGN
// ============================================
export const updateCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const campaign = await Campaign.findByPk(id);

  if (!campaign) {
    throw new NotFoundError('Campaign not found');
  }

  await campaign.update(updateData);

  res.json({
    success: true,
    message: 'Campaign updated successfully',
    data: { campaign }
  });
});

// ============================================
// DELETE CAMPAIGN
// ============================================
export const deleteCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const campaign = await Campaign.findByPk(id);

  if (!campaign) {
    throw new NotFoundError('Campaign not found');
  }

  await campaign.destroy();

  res.json({
    success: true,
    message: 'Campaign deleted successfully'
  });
});

// ============================================
// APPROVE/REJECT CAMPAIGN
// ============================================
export const approveCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { approvalStatus, comments } = req.body;

  const campaign = await Campaign.findByPk(id);

  if (!campaign) {
    throw new NotFoundError('Campaign not found');
  }

  await campaign.update({
    approvalStatus,
    approvedBy: req.user?.id,
    approvalDate: new Date()
  });

  res.json({
    success: true,
    message: `Campaign ${approvalStatus.toLowerCase()} successfully`,
    data: { campaign }
  });
});

// ============================================
// GET CAMPAIGN STATISTICS
// ============================================
export const getCampaignStats = asyncHandler(async (req, res) => {
  const total = await Campaign.count();
  const active = await Campaign.count({ where: { status: 'Active' } });
  const completed = await Campaign.count({ where: { status: 'Completed' } });
  const draft = await Campaign.count({ where: { status: 'Draft' } });

  const totalRaised = await Campaign.sum('raisedAmount') || 0;
  const totalTarget = await Campaign.sum('targetAmount') || 0;

  const byType = await Campaign.findAll({
    attributes: [
      'type',
      [Campaign.sequelize.fn('COUNT', Campaign.sequelize.col('id')), 'count'],
      [Campaign.sequelize.fn('SUM', Campaign.sequelize.col('raised_amount')), 'raised']
    ],
    group: ['type']
  });

  res.json({
    success: true,
    data: {
      total,
      active,
      completed,
      draft,
      totalRaised: parseFloat(totalRaised),
      totalTarget: parseFloat(totalTarget),
      byType: byType.map(t => ({
        type: t.type,
        count: parseInt(t.get('count')),
        raised: parseFloat(t.get('raised') || 0)
      }))
    }
  });
});
