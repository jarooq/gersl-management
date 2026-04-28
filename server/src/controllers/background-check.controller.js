import { BackgroundCheck, Staff, User } from '../models/index.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error.middleware.js';
import { Op } from 'sequelize';

// ============================================
// GET ALL BACKGROUND CHECKS
// ============================================
export const getAllBackgroundChecks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, checkType, staffId } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (checkType) where.checkType = checkType;
  if (staffId) where.staffId = staffId;

  const { count, rows: backgroundChecks } = await BackgroundCheck.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    include: [
      { model: Staff, as: 'staff', attributes: ['id', 'fullName'] },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ],
    order: [['requestedDate', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      backgroundChecks,
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
// GET BACKGROUND CHECK BY ID
// ============================================
export const getBackgroundCheckById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const backgroundCheck = await BackgroundCheck.findByPk(id, {
    include: [
      { model: Staff, as: 'staff', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ]
  });

  if (!backgroundCheck) {
    throw new NotFoundError('Background check not found');
  }

  res.json({
    success: true,
    data: { backgroundCheck }
  });
});

// ============================================
// CREATE BACKGROUND CHECK
// ============================================
export const createBackgroundCheck = asyncHandler(async (req, res) => {
  const checkData = req.body;

  if (!checkData.staffName || !checkData.position || !checkData.checkType || !checkData.requestedDate) {
    throw new ValidationError('Staff name, position, check type, and requested date are required');
  }

  if (req.user) {
    checkData.createdBy = req.user.id;
  }

  const backgroundCheck = await BackgroundCheck.create(checkData);

  const createdCheck = await BackgroundCheck.findByPk(backgroundCheck.id, {
    include: [
      { model: Staff, as: 'staff', attributes: ['id', 'fullName'] },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Background check created successfully',
    data: { backgroundCheck: createdCheck }
  });
});

// ============================================
// UPDATE BACKGROUND CHECK
// ============================================
export const updateBackgroundCheck = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const backgroundCheck = await BackgroundCheck.findByPk(id);
  if (!backgroundCheck) {
    throw new NotFoundError('Background check not found');
  }

  // Auto-update renewal due days if expiry date is set
  if (updates.expiryDate) {
    const expiryDate = new Date(updates.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    updates.renewalDue = daysUntilExpiry;

    // Auto-update status based on expiry
    if (daysUntilExpiry < 0) {
      updates.status = 'Expired';
    } else if (daysUntilExpiry <= 30) {
      updates.status = 'Renewal Required';
    } else if (updates.result) {
      updates.status = 'Valid';
    }
  }

  // Auto-set completed date if result is provided and not completed
  if (updates.result && !backgroundCheck.completedDate && updates.status !== 'Completed') {
    updates.completedDate = new Date().toISOString().split('T')[0];
    if (!updates.status || updates.status === 'Pending' || updates.status === 'In Progress') {
      updates.status = 'Completed';
    }
  }

  await backgroundCheck.update(updates);

  const updatedCheck = await BackgroundCheck.findByPk(id, {
    include: [
      { model: Staff, as: 'staff', attributes: ['id', 'fullName'] },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ]
  });

  res.json({
    success: true,
    message: 'Background check updated successfully',
    data: { backgroundCheck: updatedCheck }
  });
});

// ============================================
// DELETE BACKGROUND CHECK
// ============================================
export const deleteBackgroundCheck = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const backgroundCheck = await BackgroundCheck.findByPk(id);
  if (!backgroundCheck) {
    throw new NotFoundError('Background check not found');
  }

  await backgroundCheck.destroy();

  res.json({
    success: true,
    message: 'Background check deleted successfully'
  });
});

// ============================================
// GET EXPIRING CHECKS
// ============================================
export const getExpiringChecks = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + parseInt(days));

  const checks = await BackgroundCheck.findAll({
    where: {
      status: { [Op.in]: ['Valid', 'Completed'] },
      expiryDate: {
        [Op.lte]: targetDate,
        [Op.gte]: new Date()
      }
    },
    include: [
      { model: Staff, as: 'staff', attributes: ['id', 'firstName', 'lastName', 'email'] }
    ],
    order: [['expiryDate', 'ASC']]
  });

  res.json({
    success: true,
    data: { checks }
  });
});

// ============================================
// GET BACKGROUND CHECK STATISTICS
// ============================================
export const getBackgroundCheckStats = asyncHandler(async (req, res) => {
  const total = await BackgroundCheck.count();
  const pending = await BackgroundCheck.count({ where: { status: 'Pending' } });
  const inProgress = await BackgroundCheck.count({ where: { status: 'In Progress' } });
  const completed = await BackgroundCheck.count({ where: { status: 'Completed' } });
  const valid = await BackgroundCheck.count({ where: { status: 'Valid' } });
  const expired = await BackgroundCheck.count({ where: { status: 'Expired' } });
  const renewalRequired = await BackgroundCheck.count({ where: { status: 'Renewal Required' } });

  // Checks expiring in next 30 days
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const expiringSoon = await BackgroundCheck.count({
    where: {
      status: { [Op.in]: ['Valid', 'Completed'] },
      expiryDate: {
        [Op.lte]: thirtyDaysFromNow,
        [Op.gte]: new Date()
      }
    }
  });

  // Count by result
  const clear = await BackgroundCheck.count({ where: { result: 'Clear' } });
  const concernsIdentified = await BackgroundCheck.count({ where: { result: 'Concerns Identified' } });
  const notCleared = await BackgroundCheck.count({ where: { result: 'Not Cleared' } });

  res.json({
    success: true,
    data: {
      total,
      byStatus: {
        pending,
        inProgress,
        completed,
        valid,
        expired,
        renewalRequired
      },
      byResult: {
        clear,
        concernsIdentified,
        notCleared
      },
      expiringSoon
    }
  });
});
