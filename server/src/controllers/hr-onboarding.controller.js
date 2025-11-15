import { OnboardingRecord, Staff, User } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

// ============================================
// GET ALL ONBOARDING RECORDS
// ============================================
export const getAllOnboardingRecords = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, staffId } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (staffId) where.staffId = staffId;

  const { count, rows: records } = await OnboardingRecord.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    include: [
      {
        model: Staff,
        as: 'staff',
        attributes: ['id', 'fullName', 'position', 'department']
      },
      {
        model: User,
        as: 'assignee',
        attributes: ['id', 'fullName', 'email']
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      records,
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
// GET ONBOARDING RECORD BY ID
// ============================================
export const getOnboardingRecordById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const record = await OnboardingRecord.findByPk(id, {
    include: [
      {
        model: Staff,
        as: 'staff',
        attributes: ['id', 'fullName', 'position', 'department', 'email', 'phone']
      },
      {
        model: User,
        as: 'assignee',
        attributes: ['id', 'fullName', 'email']
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName']
      }
    ]
  });

  if (!record) {
    throw new NotFoundError('Onboarding record not found');
  }

  res.json({
    success: true,
    data: { record }
  });
});

// ============================================
// GET ONBOARDING RECORDS BY STAFF
// ============================================
export const getOnboardingRecordsByStaff = asyncHandler(async (req, res) => {
  const { staffId } = req.params;

  const records = await OnboardingRecord.findAll({
    where: { staffId },
    include: [
      {
        model: User,
        as: 'assignee',
        attributes: ['id', 'fullName', 'email']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  res.json({
    success: true,
    data: { records }
  });
});

// ============================================
// CREATE ONBOARDING RECORD
// ============================================
export const createOnboardingRecord = asyncHandler(async (req, res) => {
  const {
    staffId,
    onboardingDate,
    completionDate,
    status,
    progress,
    assignedTo,
    checklist,
    documents,
    notes
  } = req.body;

  // Validate required fields
  if (!staffId || !onboardingDate) {
    throw new ValidationError('Staff ID and onboarding date are required');
  }

  // Check if staff exists
  const staff = await Staff.findByPk(staffId);
  if (!staff) {
    throw new NotFoundError('Staff member not found');
  }

  // Create onboarding record
  const record = await OnboardingRecord.create({
    staffId,
    onboardingDate,
    completionDate,
    status: status || 'Not Started',
    progress: progress || 0,
    assignedTo,
    checklist: checklist || [],
    documents: documents || [],
    notes,
    createdBy: req.user?.id
  });

  // Fetch with associations
  const createdRecord = await OnboardingRecord.findByPk(record.id, {
    include: [
      {
        model: Staff,
        as: 'staff',
        attributes: ['id', 'fullName', 'position', 'department']
      },
      {
        model: User,
        as: 'assignee',
        attributes: ['id', 'fullName', 'email']
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Onboarding record created successfully',
    data: { record: createdRecord }
  });
});

// ============================================
// UPDATE ONBOARDING RECORD
// ============================================
export const updateOnboardingRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const record = await OnboardingRecord.findByPk(id);
  if (!record) {
    throw new NotFoundError('Onboarding record not found');
  }

  // Validate progress if provided
  if (updates.progress !== undefined) {
    if (updates.progress < 0 || updates.progress > 100) {
      throw new ValidationError('Progress must be between 0 and 100');
    }
  }

  // Auto-complete if progress is 100
  if (updates.progress === 100 && record.status !== 'Completed') {
    updates.status = 'Completed';
    updates.completionDate = updates.completionDate || new Date().toISOString().split('T')[0];
  }

  await record.update(updates);

  // Fetch updated record with associations
  const updatedRecord = await OnboardingRecord.findByPk(id, {
    include: [
      {
        model: Staff,
        as: 'staff',
        attributes: ['id', 'fullName', 'position', 'department']
      },
      {
        model: User,
        as: 'assignee',
        attributes: ['id', 'fullName', 'email']
      }
    ]
  });

  res.json({
    success: true,
    message: 'Onboarding record updated successfully',
    data: { record: updatedRecord }
  });
});

// ============================================
// UPDATE ONBOARDING PROGRESS
// ============================================
export const updateOnboardingProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { progress, checklist } = req.body;

  const record = await OnboardingRecord.findByPk(id);
  if (!record) {
    throw new NotFoundError('Onboarding record not found');
  }

  const updates = {};

  if (progress !== undefined) {
    if (progress < 0 || progress > 100) {
      throw new ValidationError('Progress must be between 0 and 100');
    }
    updates.progress = progress;
    updates.status = progress === 100 ? 'Completed' : 'In Progress';

    if (progress === 100) {
      updates.completionDate = new Date().toISOString().split('T')[0];
    }
  }

  if (checklist) {
    updates.checklist = checklist;
  }

  await record.update(updates);

  // Fetch updated record
  const updatedRecord = await OnboardingRecord.findByPk(id, {
    include: [
      {
        model: Staff,
        as: 'staff',
        attributes: ['id', 'fullName', 'position']
      }
    ]
  });

  res.json({
    success: true,
    message: 'Onboarding progress updated successfully',
    data: { record: updatedRecord }
  });
});

// ============================================
// DELETE ONBOARDING RECORD
// ============================================
export const deleteOnboardingRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const record = await OnboardingRecord.findByPk(id);
  if (!record) {
    throw new NotFoundError('Onboarding record not found');
  }

  await record.destroy();

  res.json({
    success: true,
    message: 'Onboarding record deleted successfully'
  });
});

// ============================================
// GET ONBOARDING STATISTICS
// ============================================
export const getOnboardingStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const where = {};
  if (startDate && endDate) {
    where.onboardingDate = {
      [Op.between]: [startDate, endDate]
    };
  }

  const [
    total,
    notStarted,
    inProgress,
    completed,
    onHold
  ] = await Promise.all([
    OnboardingRecord.count({ where }),
    OnboardingRecord.count({ where: { ...where, status: 'Not Started' } }),
    OnboardingRecord.count({ where: { ...where, status: 'In Progress' } }),
    OnboardingRecord.count({ where: { ...where, status: 'Completed' } }),
    OnboardingRecord.count({ where: { ...where, status: 'On Hold' } })
  ]);

  // Calculate average progress
  const records = await OnboardingRecord.findAll({
    where,
    attributes: ['progress']
  });

  const avgProgress = records.length > 0
    ? Math.round(records.reduce((sum, r) => sum + r.progress, 0) / records.length)
    : 0;

  res.json({
    success: true,
    data: {
      total,
      byStatus: {
        notStarted,
        inProgress,
        completed,
        onHold
      },
      avgProgress,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  });
});
