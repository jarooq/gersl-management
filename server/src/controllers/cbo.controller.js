import { Op } from 'sequelize';
import { CBOPartner } from '../models/index.js';
import { asyncHandler, NotFoundError } from '../middleware/error.middleware.js';

// ============================================
// GET ALL CBO PARTNERS
// ============================================
export const getAllCBOPartners = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, district, status, capacity } = req.query;
  const offset = (page - 1) * limit;

  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { acronym: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (district) where.district = district;
  if (status) where.status = status;
  if (capacity) where.capacity = capacity;

  const { count, rows: cboPartners } = await CBOPartner.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      cboPartners,
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
// GET SINGLE CBO PARTNER
// ============================================
export const getCBOPartnerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const cboPartner = await CBOPartner.findByPk(id);

  if (!cboPartner) {
    throw new NotFoundError('CBO Partner not found');
  }

  res.json({
    success: true,
    data: { cboPartner }
  });
});

// ============================================
// CREATE CBO PARTNER
// ============================================
export const createCBOPartner = asyncHandler(async (req, res) => {
  const cboData = req.body;

  const cboPartner = await CBOPartner.create(cboData);

  res.status(201).json({
    success: true,
    message: 'CBO Partner created successfully',
    data: { cboPartner }
  });
});

// ============================================
// UPDATE CBO PARTNER
// ============================================
export const updateCBOPartner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const cboPartner = await CBOPartner.findByPk(id);

  if (!cboPartner) {
    throw new NotFoundError('CBO Partner not found');
  }

  await cboPartner.update(updateData);

  res.json({
    success: true,
    message: 'CBO Partner updated successfully',
    data: { cboPartner }
  });
});

// ============================================
// DELETE CBO PARTNER
// ============================================
export const deleteCBOPartner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const cboPartner = await CBOPartner.findByPk(id);

  if (!cboPartner) {
    throw new NotFoundError('CBO Partner not found');
  }

  await cboPartner.destroy();

  res.json({
    success: true,
    message: 'CBO Partner deleted successfully'
  });
});

// ============================================
// GET CBO STATISTICS
// ============================================
export const getCBOStats = asyncHandler(async (req, res) => {
  const { district } = req.query;

  const where = {};
  if (district) where.district = district;

  const total = await CBOPartner.count({ where });

  const byStatus = await CBOPartner.findAll({
    where,
    attributes: [
      'status',
      [CBOPartner.sequelize.fn('COUNT', CBOPartner.sequelize.col('id')), 'count']
    ],
    group: ['status']
  });

  const byDistrict = await CBOPartner.findAll({
    where,
    attributes: [
      'district',
      [CBOPartner.sequelize.fn('COUNT', CBOPartner.sequelize.col('id')), 'count']
    ],
    group: ['district']
  });

  const byCapacity = await CBOPartner.findAll({
    where,
    attributes: [
      'capacity',
      [CBOPartner.sequelize.fn('COUNT', CBOPartner.sequelize.col('id')), 'count']
    ],
    group: ['capacity']
  });

  res.json({
    success: true,
    data: {
      total,
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: parseInt(s.get('count'))
      })),
      byDistrict: byDistrict.map(d => ({
        district: d.district,
        count: parseInt(d.get('count'))
      })),
      byCapacity: byCapacity.map(c => ({
        capacity: c.capacity,
        count: parseInt(c.get('count'))
      }))
    }
  });
});
