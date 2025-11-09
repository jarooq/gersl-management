import { Op } from 'sequelize';
import { Indicator, Project } from '../models/index.js';
import { asyncHandler, NotFoundError } from '../middleware/error.middleware.js';

// ============================================
// GET ALL INDICATORS
// ============================================
export const getAllIndicators = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, type, category, projectId, status } = req.query;
  const offset = (page - 1) * limit;

  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { code: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (type) where.type = type;
  if (category) where.category = category;
  if (projectId) where.projectId = projectId;
  if (status) where.status = status;

  const { count, rows: indicators } = await Indicator.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'programmeArea']
      }
    ]
  });

  res.json({
    success: true,
    data: {
      indicators,
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
// GET SINGLE INDICATOR
// ============================================
export const getIndicatorById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const indicator = await Indicator.findByPk(id, {
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'programmeArea']
      }
    ]
  });

  if (!indicator) {
    throw new NotFoundError('Indicator not found');
  }

  res.json({
    success: true,
    data: { indicator }
  });
});

// ============================================
// CREATE INDICATOR
// ============================================
export const createIndicator = asyncHandler(async (req, res) => {
  const indicatorData = req.body;

  const indicator = await Indicator.create(indicatorData);

  const createdIndicator = await Indicator.findByPk(indicator.id, {
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'programmeArea']
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Indicator created successfully',
    data: { indicator: createdIndicator }
  });
});

// ============================================
// UPDATE INDICATOR
// ============================================
export const updateIndicator = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const indicator = await Indicator.findByPk(id);

  if (!indicator) {
    throw new NotFoundError('Indicator not found');
  }

  await indicator.update(updateData);

  const updatedIndicator = await Indicator.findByPk(id, {
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'programmeArea']
      }
    ]
  });

  res.json({
    success: true,
    message: 'Indicator updated successfully',
    data: { indicator: updatedIndicator }
  });
});

// ============================================
// DELETE INDICATOR
// ============================================
export const deleteIndicator = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const indicator = await Indicator.findByPk(id);

  if (!indicator) {
    throw new NotFoundError('Indicator not found');
  }

  await indicator.destroy();

  res.json({
    success: true,
    message: 'Indicator deleted successfully'
  });
});

// ============================================
// UPDATE INDICATOR PROGRESS
// ============================================
export const updateIndicatorProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { current, status } = req.body;

  const indicator = await Indicator.findByPk(id);

  if (!indicator) {
    throw new NotFoundError('Indicator not found');
  }

  if (current !== undefined) {
    indicator.current = current;

    // Auto-update status based on progress
    const progress = (current / indicator.target) * 100;

    if (progress >= 90) {
      indicator.status = 'On Track';
    } else if (progress >= 70) {
      indicator.status = 'At Risk';
    } else {
      indicator.status = 'Off Track';
    }
  }

  if (status) {
    indicator.status = status;
  }

  await indicator.save();

  res.json({
    success: true,
    message: 'Indicator progress updated successfully',
    data: { indicator }
  });
});

// ============================================
// GET INDICATOR STATISTICS
// ============================================
export const getIndicatorStats = asyncHandler(async (req, res) => {
  const { projectId, type, category } = req.query;

  const where = {};
  if (projectId) where.projectId = projectId;
  if (type) where.type = type;
  if (category) where.category = category;

  const total = await Indicator.count({ where });

  const byType = await Indicator.findAll({
    where,
    attributes: [
      'type',
      [Indicator.sequelize.fn('COUNT', Indicator.sequelize.col('id')), 'count']
    ],
    group: ['type']
  });

  const byStatus = await Indicator.findAll({
    where,
    attributes: [
      'status',
      [Indicator.sequelize.fn('COUNT', Indicator.sequelize.col('id')), 'count']
    ],
    group: ['status']
  });

  const byCategory = await Indicator.findAll({
    where,
    attributes: [
      'category',
      [Indicator.sequelize.fn('COUNT', Indicator.sequelize.col('id')), 'count']
    ],
    group: ['category']
  });

  // Calculate average achievement
  const achievementStats = await Indicator.findAll({
    where,
    attributes: [
      [Indicator.sequelize.fn('AVG',
        Indicator.sequelize.literal('(current::float / target::float) * 100')
      ), 'avgAchievement']
    ]
  });

  res.json({
    success: true,
    data: {
      total,
      byType: byType.map(t => ({
        type: t.type,
        count: parseInt(t.get('count'))
      })),
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: parseInt(s.get('count'))
      })),
      byCategory: byCategory.map(c => ({
        category: c.category,
        count: parseInt(c.get('count'))
      })),
      avgAchievement: parseFloat(achievementStats[0]?.get('avgAchievement') || 0)
    }
  });
});
