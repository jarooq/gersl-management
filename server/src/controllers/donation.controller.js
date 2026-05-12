import { Op } from 'sequelize';
import { randomBytes } from 'crypto';
import { Campaign, Donation, User } from '../models/index.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error.middleware.js';
import { sendDonorReceipt } from '../services/email.service.js';

// Codes are derived from the row's autoincrement id, which is atomic — two
// concurrent inserts can never produce the same number. Because donationCode
// is NOT NULL with a UNIQUE index, we insert with a random placeholder first
// and then UPDATE with the real code once the id is known.
const tempCode = (prefix) => `${prefix}-TMP-${randomBytes(5).toString('hex').toUpperCase()}`;
const codeFromId = (id) => `DON-${String(id).padStart(6, '0')}`;
const receiptFromId = (id) => `RCT-${new Date().getFullYear()}-${String(id).padStart(5, '0')}`;

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
  const donationData = { ...req.body };

  // Strip any client-supplied codes — server is the source of truth and we
  // want race-free numbering even when callers try to be helpful.
  const wantsCompleted = donationData.paymentStatus === 'Completed';
  delete donationData.donationCode;
  delete donationData.receiptNumber;
  donationData.donationCode = tempCode('DON');

  const donation = await Donation.create(donationData);

  // Now the id is known — flip to the real id-derived codes in one UPDATE.
  const finalUpdates = { donationCode: codeFromId(donation.id) };
  if (wantsCompleted) finalUpdates.receiptNumber = receiptFromId(donation.id);
  await donation.update(finalUpdates);

  // Update campaign raised amount if payment is completed
  let campaign = null;
  if (donation.campaignId && donation.paymentStatus === 'Completed') {
    campaign = await Campaign.findByPk(donation.campaignId);
    if (campaign) {
      await campaign.update({
        raisedAmount: parseFloat(campaign.raisedAmount) + parseFloat(donation.amount)
      });
    }
  }

  // Fire donor receipt email when the donation is created already-Completed.
  // The email service short-circuits if SMTP isn't configured or the donor
  // is anonymous / has no email.
  if (donation.paymentStatus === 'Completed') {
    await sendDonorReceipt({ donation, campaign });
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
  const becameCompleted =
    updateData.paymentStatus === 'Completed' && donation.paymentStatus !== 'Completed';
  let receiptCampaign = null;
  if (becameCompleted) {
    // Receipt derived from this donation's own id — atomic, race-free.
    // Ignore any client-supplied receipt number to keep the format consistent.
    if (!donation.receiptNumber) {
      updateData.receiptNumber = receiptFromId(donation.id);
    } else {
      delete updateData.receiptNumber;
    }

    // Update campaign raised amount
    if (donation.campaignId) {
      receiptCampaign = await Campaign.findByPk(donation.campaignId);
      if (receiptCampaign) {
        await receiptCampaign.update({
          raisedAmount: parseFloat(receiptCampaign.raisedAmount) + parseFloat(donation.amount)
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

  // Send donor receipt on the transition Pending/Failed → Completed.
  if (becameCompleted) {
    await sendDonorReceipt({ donation, campaign: receiptCampaign });
  }

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
