import { Op } from 'sequelize';
import { Campaign, Donation, User } from '../models/index.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error.middleware.js';

// ============================================
// GET ALL DONATIONS
// ============================================
export const getAllDonations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, campaignId, paymentStatus, donorType } = req.query;
  const offset = (page - 1) * limit;

  const where = {};

  if (search) {
    where[Op.or] = [
      { donorName: { [Op.iLike]: `%${search}%` } },
      { donorEmail: { [Op.iLike]: `%${search}%` } },
      { donationCode: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (campaignId) where.campaignId = campaignId;
  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (donorType) where.donorType = donorType;

  const { count, rows: donations } = await Donation.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['donationDate', 'DESC']],
    include: [
      { model: Campaign, as: 'campaign', attributes: ['id', 'title', 'campaignCode'] }
    ]
  });

  res.json({
    success: true,
    data: {
      donations,
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
// GET SINGLE DONATION
// ============================================
export const getDonationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const donation = await Donation.findByPk(id, {
    include: [
      { model: Campaign, as: 'campaign' }
    ]
  });

  if (!donation) {
    throw new NotFoundError('Donation not found');
  }

  res.json({
    success: true,
    data: { donation }
  });
});

// ============================================
// CREATE DONATION
// ============================================
export const createDonation = asyncHandler(async (req, res) => {
  const donationData = req.body;

  // Generate donation code if not provided
  if (!donationData.donationCode) {
    const count = await Donation.count();
    donationData.donationCode = `DON-${String(count + 1).padStart(6, '0')}`;
  }

  // Generate receipt number if payment is completed
  if (donationData.paymentStatus === 'Completed' && !donationData.receiptNumber) {
    const year = new Date().getFullYear();
    const count = await Donation.count({ where: { paymentStatus: 'Completed' } });
    donationData.receiptNumber = `RCT-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  const donation = await Donation.create(donationData);

  // Update campaign raised amount if payment is completed
  if (donationData.campaignId && donationData.paymentStatus === 'Completed') {
    const campaign = await Campaign.findByPk(donationData.campaignId);
    if (campaign) {
      await campaign.update({
        raisedAmount: parseFloat(campaign.raisedAmount) + parseFloat(donationData.amount)
      });
    }
  }

  res.status(201).json({
    success: true,
    message: 'Donation created successfully',
    data: { donation }
  });
});

// ============================================
// UPDATE DONATION
// ============================================
export const updateDonation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const donation = await Donation.findByPk(id);

  if (!donation) {
    throw new NotFoundError('Donation not found');
  }

  // Handle payment status change to Completed
  if (updateData.paymentStatus === 'Completed' && donation.paymentStatus !== 'Completed') {
    // Generate receipt number if not provided
    if (!updateData.receiptNumber) {
      const year = new Date().getFullYear();
      const count = await Donation.count({ where: { paymentStatus: 'Completed' } });
      updateData.receiptNumber = `RCT-${year}-${String(count + 1).padStart(5, '0')}`;
    }

    // Update campaign raised amount
    if (donation.campaignId) {
      const campaign = await Campaign.findByPk(donation.campaignId);
      if (campaign) {
        await campaign.update({
          raisedAmount: parseFloat(campaign.raisedAmount) + parseFloat(donation.amount)
        });
      }
    }
  }

  // Handle payment status change from Completed to something else
  if (donation.paymentStatus === 'Completed' && updateData.paymentStatus && updateData.paymentStatus !== 'Completed') {
    // Deduct from campaign raised amount
    if (donation.campaignId) {
      const campaign = await Campaign.findByPk(donation.campaignId);
      if (campaign) {
        await campaign.update({
          raisedAmount: parseFloat(campaign.raisedAmount) - parseFloat(donation.amount)
        });
      }
    }
  }

  await donation.update(updateData);

  res.json({
    success: true,
    message: 'Donation updated successfully',
    data: { donation }
  });
});

// ============================================
// DELETE DONATION
// ============================================
export const deleteDonation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const donation = await Donation.findByPk(id);

  if (!donation) {
    throw new NotFoundError('Donation not found');
  }

  // Deduct from campaign raised amount if donation was completed
  if (donation.paymentStatus === 'Completed' && donation.campaignId) {
    const campaign = await Campaign.findByPk(donation.campaignId);
    if (campaign) {
      await campaign.update({
        raisedAmount: parseFloat(campaign.raisedAmount) - parseFloat(donation.amount)
      });
    }
  }

  await donation.destroy();

  res.json({
    success: true,
    message: 'Donation deleted successfully'
  });
});

// ============================================
// GET DONATION STATISTICS
// ============================================
export const getDonationStats = asyncHandler(async (req, res) => {
  const total = await Donation.count();
  const completed = await Donation.count({ where: { paymentStatus: 'Completed' } });
  const pending = await Donation.count({ where: { paymentStatus: 'Pending' } });
  const failed = await Donation.count({ where: { paymentStatus: 'Failed' } });

  const totalAmount = await Donation.sum('amount', { where: { paymentStatus: 'Completed' } }) || 0;
  const avgDonation = completed > 0 ? totalAmount / completed : 0;

  const byDonorType = await Donation.findAll({
    attributes: [
      'donorType',
      [Donation.sequelize.fn('COUNT', Donation.sequelize.col('id')), 'count'],
      [Donation.sequelize.fn('SUM', Donation.sequelize.col('amount')), 'total']
    ],
    where: { paymentStatus: 'Completed' },
    group: ['donorType']
  });

  const byMonth = await Donation.findAll({
    attributes: [
      [Donation.sequelize.fn('DATE_TRUNC', 'month', Donation.sequelize.col('donation_date')), 'month'],
      [Donation.sequelize.fn('COUNT', Donation.sequelize.col('id')), 'count'],
      [Donation.sequelize.fn('SUM', Donation.sequelize.col('amount')), 'total']
    ],
    where: {
      paymentStatus: 'Completed',
      donationDate: {
        [Op.gte]: new Date(new Date().getFullYear(), 0, 1) // This year
      }
    },
    group: [Donation.sequelize.fn('DATE_TRUNC', 'month', Donation.sequelize.col('donation_date'))],
    order: [[Donation.sequelize.fn('DATE_TRUNC', 'month', Donation.sequelize.col('donation_date')), 'ASC']]
  });

  res.json({
    success: true,
    data: {
      total,
      completed,
      pending,
      failed,
      totalAmount: parseFloat(totalAmount),
      avgDonation: parseFloat(avgDonation),
      byDonorType: byDonorType.map(d => ({
        donorType: d.donorType,
        count: parseInt(d.get('count')),
        total: parseFloat(d.get('total') || 0)
      })),
      byMonth: byMonth.map(d => ({
        month: d.get('month'),
        count: parseInt(d.get('count')),
        total: parseFloat(d.get('total') || 0)
      }))
    }
  });
});
