import { CBOActivity, CBOPartner, User } from '../models/index.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error.middleware.js';
import { Op } from 'sequelize';

// ============================================
// GET ALL ACTIVITIES
// ============================================
export const getAllActivities = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, activityType, cboPartnerId } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (activityType) where.activityType = activityType;
  if (cboPartnerId) where.cboPartnerId = cboPartnerId;

  const { count, rows: activities } = await CBOActivity.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    include: [
      {
        model: CBOPartner,
        as: 'cboPartner',
        attributes: ['id', 'name', 'acronym', 'district']
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName']
      }
    ],
    order: [['activityDate', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      activities,
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
// GET ACTIVITY BY ID
// ============================================
export const getActivityById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const activity = await CBOActivity.findByPk(id, {
    include: [
      {
        model: CBOPartner,
        as: 'cboPartner',
        attributes: ['id', 'name', 'acronym', 'district', 'contactPerson', 'email']
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName']
      }
    ]
  });

  if (!activity) {
    throw new NotFoundError('Activity not found');
  }

  res.json({
    success: true,
    data: { activity }
  });
});

// ============================================
// GET ACTIVITIES BY CBO PARTNER
// ============================================
export const getActivitiesByCBO = asyncHandler(async (req, res) => {
  const { cboPartnerId } = req.params;

  const activities = await CBOActivity.findAll({
    where: { cboPartnerId },
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName']
      }
    ],
    order: [['activityDate', 'DESC']]
  });

  res.json({
    success: true,
    data: { activities }
  });
});

// ============================================
// CREATE ACTIVITY
// ============================================
export const createActivity = asyncHandler(async (req, res) => {
  const {
    activityName,
    description,
    activityType,
    cboPartnerId,
    activityDate,
    location,
    participants,
    volunteersInvolved,
    budget,
    actualCost,
    status,
    outcomes
  } = req.body;

  // Validate required fields
  if (!activityName || !activityType || !activityDate) {
    throw new ValidationError('Activity name, type, and date are required');
  }

  // Check if CBO Partner exists if provided
  if (cboPartnerId) {
    const cbo = await CBOPartner.findByPk(cboPartnerId);
    if (!cbo) {
      throw new NotFoundError('CBO Partner not found');
    }
  }

  // Create activity
  const activity = await CBOActivity.create({
    activityName,
    description,
    activityType,
    cboPartnerId,
    activityDate,
    location,
    participants: participants || 0,
    volunteersInvolved: volunteersInvolved || [],
    budget: budget || 0,
    actualCost: actualCost || 0,
    status: status || 'Upcoming',
    outcomes,
    createdBy: req.user?.id
  });

  // Fetch with associations
  const createdActivity = await CBOActivity.findByPk(activity.id, {
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
    message: 'Activity created successfully',
    data: { activity: createdActivity }
  });
});

// ============================================
// UPDATE ACTIVITY
// ============================================
export const updateActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const activity = await CBOActivity.findByPk(id);
  if (!activity) {
    throw new NotFoundError('Activity not found');
  }

  // Validate CBO Partner if being updated
  if (updates.cboPartnerId) {
    const cbo = await CBOPartner.findByPk(updates.cboPartnerId);
    if (!cbo) {
      throw new NotFoundError('CBO Partner not found');
    }
  }

  await activity.update(updates);

  // Fetch updated activity with associations
  const updatedActivity = await CBOActivity.findByPk(id, {
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
    message: 'Activity updated successfully',
    data: { activity: updatedActivity }
  });
});

// ============================================
// DELETE ACTIVITY
// ============================================
export const deleteActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const activity = await CBOActivity.findByPk(id);
  if (!activity) {
    throw new NotFoundError('Activity not found');
  }

  await activity.destroy();

  res.json({
    success: true,
    message: 'Activity deleted successfully'
  });
});

// ============================================
// GET ACTIVITY STATISTICS
// ============================================
export const getActivityStats = asyncHandler(async (req, res) => {
  const { cboPartnerId, startDate, endDate } = req.query;

  const where = {};
  if (cboPartnerId) where.cboPartnerId = cboPartnerId;
  if (startDate && endDate) {
    where.activityDate = {
      [Op.between]: [startDate, endDate]
    };
  }

  const [
    total,
    upcoming,
    inProgress,
    completed,
    cancelled
  ] = await Promise.all([
    CBOActivity.count({ where }),
    CBOActivity.count({ where: { ...where, status: 'Upcoming' } }),
    CBOActivity.count({ where: { ...where, status: 'In Progress' } }),
    CBOActivity.count({ where: { ...where, status: 'Completed' } }),
    CBOActivity.count({ where: { ...where, status: 'Cancelled' } })
  ]);

  // Calculate financial statistics
  const activities = await CBOActivity.findAll({
    where,
    attributes: ['budget', 'actualCost', 'participants']
  });

  const totalBudget = activities.reduce((sum, a) => sum + parseFloat(a.budget || 0), 0);
  const totalActualCost = activities.reduce((sum, a) => sum + parseFloat(a.actualCost || 0), 0);
  const totalParticipants = activities.reduce((sum, a) => sum + (a.participants || 0), 0);

  res.json({
    success: true,
    data: {
      total,
      byStatus: {
        upcoming,
        inProgress,
        completed,
        cancelled
      },
      totalBudget: totalBudget.toFixed(2),
      totalActualCost: totalActualCost.toFixed(2),
      budgetVariance: (totalBudget - totalActualCost).toFixed(2),
      totalParticipants,
      avgParticipantsPerActivity: total > 0 ? Math.round(totalParticipants / total) : 0,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  });
});
