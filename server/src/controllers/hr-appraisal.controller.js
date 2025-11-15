import { AppraisalRecord, Staff, User } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { Op } from 'sequelize';

// ============================================
// GET ALL APPRAISAL RECORDS
// ============================================
export const getAllAppraisalRecords = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, staffId, appraisalType } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (staffId) where.staffId = staffId;
  if (appraisalType) where.appraisalType = appraisalType;

  const { count, rows: records } = await AppraisalRecord.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    include: [
      {
        model: Staff,
        as: 'staff',
        attributes: ['id', 'fullName', 'position', 'department', 'email']
      },
      {
        model: User,
        as: 'appraiserUser',
        attributes: ['id', 'fullName', 'email']
      },
      {
        model: User,
        as: 'reviewerUser',
        attributes: ['id', 'fullName', 'email']
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName']
      }
    ],
    order: [['appraisalDate', 'DESC']]
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
// GET APPRAISAL RECORD BY ID
// ============================================
export const getAppraisalRecordById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const record = await AppraisalRecord.findByPk(id, {
    include: [
      {
        model: Staff,
        as: 'staff',
        attributes: ['id', 'fullName', 'position', 'department', 'email', 'phone']
      },
      {
        model: User,
        as: 'appraiserUser',
        attributes: ['id', 'fullName', 'email']
      },
      {
        model: User,
        as: 'reviewerUser',
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
    throw new NotFoundError('Appraisal record not found');
  }

  res.json({
    success: true,
    data: { record }
  });
});

// ============================================
// GET APPRAISAL RECORDS BY STAFF
// ============================================
export const getAppraisalRecordsByStaff = asyncHandler(async (req, res) => {
  const { staffId } = req.params;

  const records = await AppraisalRecord.findAll({
    where: { staffId },
    include: [
      {
        model: User,
        as: 'appraiserUser',
        attributes: ['id', 'fullName']
      },
      {
        model: User,
        as: 'reviewerUser',
        attributes: ['id', 'fullName']
      }
    ],
    order: [['appraisalDate', 'DESC']]
  });

  res.json({
    success: true,
    data: { records }
  });
});

// ============================================
// CREATE APPRAISAL RECORD
// ============================================
export const createAppraisalRecord = asyncHandler(async (req, res) => {
  const {
    staffId,
    appraisalPeriod,
    appraisalDate,
    appraisalType,
    appraiser,
    reviewer,
    overallRating,
    performanceRatings,
    strengths,
    areasOfImprovement,
    goals,
    trainingNeeds,
    employeeComments,
    appraiserComments,
    reviewerComments,
    status
  } = req.body;

  // Validate required fields
  if (!staffId || !appraisalPeriod || !appraisalDate || !appraisalType || !appraiser) {
    throw new ValidationError('Staff ID, appraisal period, date, type, and appraiser are required');
  }

  // Validate rating if provided
  if (overallRating !== undefined && (overallRating < 0 || overallRating > 5)) {
    throw new ValidationError('Overall rating must be between 0 and 5');
  }

  // Check if staff exists
  const staff = await Staff.findByPk(staffId);
  if (!staff) {
    throw new NotFoundError('Staff member not found');
  }

  // Create appraisal record
  const record = await AppraisalRecord.create({
    staffId,
    appraisalPeriod,
    appraisalDate,
    appraisalType,
    appraiser,
    reviewer,
    overallRating,
    performanceRatings: performanceRatings || {},
    strengths,
    areasOfImprovement,
    goals: goals || [],
    trainingNeeds: trainingNeeds || [],
    employeeComments,
    appraiserComments,
    reviewerComments,
    status: status || 'Draft',
    createdBy: req.user?.id
  });

  // Fetch with associations
  const createdRecord = await AppraisalRecord.findByPk(record.id, {
    include: [
      {
        model: Staff,
        as: 'staff',
        attributes: ['id', 'fullName', 'position', 'department']
      },
      {
        model: User,
        as: 'appraiserUser',
        attributes: ['id', 'fullName', 'email']
      },
      {
        model: User,
        as: 'reviewerUser',
        attributes: ['id', 'fullName', 'email']
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Appraisal record created successfully',
    data: { record: createdRecord }
  });
});

// ============================================
// UPDATE APPRAISAL RECORD
// ============================================
export const updateAppraisalRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const record = await AppraisalRecord.findByPk(id);
  if (!record) {
    throw new NotFoundError('Appraisal record not found');
  }

  // Validate rating if provided
  if (updates.overallRating !== undefined) {
    if (updates.overallRating < 0 || updates.overallRating > 5) {
      throw new ValidationError('Overall rating must be between 0 and 5');
    }
  }

  await record.update(updates);

  // Fetch updated record with associations
  const updatedRecord = await AppraisalRecord.findByPk(id, {
    include: [
      {
        model: Staff,
        as: 'staff',
        attributes: ['id', 'fullName', 'position', 'department']
      },
      {
        model: User,
        as: 'appraiserUser',
        attributes: ['id', 'fullName', 'email']
      },
      {
        model: User,
        as: 'reviewerUser',
        attributes: ['id', 'fullName', 'email']
      }
    ]
  });

  res.json({
    success: true,
    message: 'Appraisal record updated successfully',
    data: { record: updatedRecord }
  });
});

// ============================================
// SUBMIT APPRAISAL
// ============================================
export const submitAppraisal = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const record = await AppraisalRecord.findByPk(id);
  if (!record) {
    throw new NotFoundError('Appraisal record not found');
  }

  if (record.status !== 'Draft') {
    throw new ValidationError('Only draft appraisals can be submitted');
  }

  await record.update({
    status: 'Submitted',
    submittedDate: new Date().toISOString().split('T')[0]
  });

  const updatedRecord = await AppraisalRecord.findByPk(id, {
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
    message: 'Appraisal submitted successfully',
    data: { record: updatedRecord }
  });
});

// ============================================
// ACKNOWLEDGE APPRAISAL (Employee)
// ============================================
export const acknowledgeAppraisal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { employeeComments } = req.body;

  const record = await AppraisalRecord.findByPk(id);
  if (!record) {
    throw new NotFoundError('Appraisal record not found');
  }

  if (record.status !== 'Completed') {
    throw new ValidationError('Only completed appraisals can be acknowledged');
  }

  await record.update({
    status: 'Acknowledged',
    acknowledgedDate: new Date().toISOString().split('T')[0],
    employeeComments: employeeComments || record.employeeComments
  });

  const updatedRecord = await AppraisalRecord.findByPk(id, {
    include: [
      {
        model: Staff,
        as: 'staff',
        attributes: ['id', 'fullName']
      }
    ]
  });

  res.json({
    success: true,
    message: 'Appraisal acknowledged successfully',
    data: { record: updatedRecord }
  });
});

// ============================================
// DELETE APPRAISAL RECORD
// ============================================
export const deleteAppraisalRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const record = await AppraisalRecord.findByPk(id);
  if (!record) {
    throw new NotFoundError('Appraisal record not found');
  }

  // Only allow deletion of drafts
  if (record.status !== 'Draft') {
    throw new ValidationError('Only draft appraisals can be deleted');
  }

  await record.destroy();

  res.json({
    success: true,
    message: 'Appraisal record deleted successfully'
  });
});

// ============================================
// GET APPRAISAL STATISTICS
// ============================================
export const getAppraisalStats = asyncHandler(async (req, res) => {
  const { startDate, endDate, appraisalType } = req.query;

  const where = {};
  if (startDate && endDate) {
    where.appraisalDate = {
      [Op.between]: [startDate, endDate]
    };
  }
  if (appraisalType) {
    where.appraisalType = appraisalType;
  }

  const [
    total,
    draft,
    submitted,
    underReview,
    completed,
    acknowledged
  ] = await Promise.all([
    AppraisalRecord.count({ where }),
    AppraisalRecord.count({ where: { ...where, status: 'Draft' } }),
    AppraisalRecord.count({ where: { ...where, status: 'Submitted' } }),
    AppraisalRecord.count({ where: { ...where, status: 'Under Review' } }),
    AppraisalRecord.count({ where: { ...where, status: 'Completed' } }),
    AppraisalRecord.count({ where: { ...where, status: 'Acknowledged' } })
  ]);

  // Calculate average rating
  const records = await AppraisalRecord.findAll({
    where: {
      ...where,
      overallRating: { [Op.not]: null }
    },
    attributes: ['overallRating']
  });

  const avgRating = records.length > 0
    ? (records.reduce((sum, r) => sum + parseFloat(r.overallRating), 0) / records.length).toFixed(2)
    : 0;

  // Count by appraisal type
  const byType = await AppraisalRecord.findAll({
    where,
    attributes: [
      'appraisalType',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['appraisalType'],
    raw: true
  });

  res.json({
    success: true,
    data: {
      total,
      byStatus: {
        draft,
        submitted,
        underReview,
        completed,
        acknowledged
      },
      byType,
      avgRating,
      completionRate: total > 0 ? Math.round(((completed + acknowledged) / total) * 100) : 0
    }
  });
});
