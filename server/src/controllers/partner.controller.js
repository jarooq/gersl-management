import { Op } from 'sequelize';
import { Partner } from '../models/index.js';
import { asyncHandler, NotFoundError } from '../middleware/error.middleware.js';

// ============================================
// GET ALL PARTNERS
// ============================================
export const getAllPartners = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, country, status, type } = req.query;
  const offset = (page - 1) * limit;

  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { contactPerson: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (country) where.country = country;
  if (status) where.status = status;
  if (type) where.type = type;

  const { count, rows: partners } = await Partner.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      partners,
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
// GET SINGLE PARTNER
// ============================================
export const getPartnerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const partner = await Partner.findByPk(id);

  if (!partner) {
    throw new NotFoundError('Partner not found');
  }

  res.json({
    success: true,
    data: { partner }
  });
});

// ============================================
// CREATE PARTNER
// ============================================
export const createPartner = asyncHandler(async (req, res) => {
  const partnerData = req.body;

  // Map partnershipStartDate to partnershipStart if provided
  if (partnerData.partnershipStartDate) {
    partnerData.partnershipStart = partnerData.partnershipStartDate;
    delete partnerData.partnershipStartDate;
  }

  const partner = await Partner.create(partnerData);

  res.status(201).json({
    success: true,
    message: 'Partner created successfully',
    data: { partner }
  });
});

// ============================================
// UPDATE PARTNER
// ============================================
export const updatePartner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Map partnershipStartDate to partnershipStart if provided
  if (updateData.partnershipStartDate) {
    updateData.partnershipStart = updateData.partnershipStartDate;
    delete updateData.partnershipStartDate;
  }

  const partner = await Partner.findByPk(id);

  if (!partner) {
    throw new NotFoundError('Partner not found');
  }

  await partner.update(updateData);

  res.json({
    success: true,
    message: 'Partner updated successfully',
    data: { partner }
  });
});

// ============================================
// DELETE PARTNER
// ============================================
export const deletePartner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const partner = await Partner.findByPk(id);

  if (!partner) {
    throw new NotFoundError('Partner not found');
  }

  await partner.destroy();

  res.json({
    success: true,
    message: 'Partner deleted successfully'
  });
});

// ============================================
// GET PARTNER STATISTICS
// ============================================
export const getPartnerStats = asyncHandler(async (req, res) => {
  const { country, type } = req.query;

  const where = {};
  if (country) where.country = country;
  if (type) where.type = type;

  const total = await Partner.count({ where });

  const byStatus = await Partner.findAll({
    where,
    attributes: [
      'status',
      [Partner.sequelize.fn('COUNT', Partner.sequelize.col('id')), 'count']
    ],
    group: ['status']
  });

  const byCountry = await Partner.findAll({
    where,
    attributes: [
      'country',
      [Partner.sequelize.fn('COUNT', Partner.sequelize.col('id')), 'count']
    ],
    group: ['country'],
    order: [[Partner.sequelize.fn('COUNT', Partner.sequelize.col('id')), 'DESC']]
  });

  const byType = await Partner.findAll({
    where,
    attributes: [
      'type',
      [Partner.sequelize.fn('COUNT', Partner.sequelize.col('id')), 'count']
    ],
    group: ['type']
  });

  const totalContributions = await Partner.sum('totalContributions', { where });

  res.json({
    success: true,
    data: {
      total,
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: parseInt(s.get('count'))
      })),
      byCountry: byCountry.map(c => ({
        country: c.country,
        count: parseInt(c.get('count'))
      })),
      byType: byType.map(t => ({
        type: t.type,
        count: parseInt(t.get('count'))
      })),
      totalContributions: parseFloat(totalContributions || 0)
    }
  });
});
