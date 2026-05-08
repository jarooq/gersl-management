import asyncHandler from 'express-async-handler';
import { OrphanVisitLog, OrphanProgressRating, Orphan, User, Visit } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * @desc    Get all visit logs with optional filters
 * @route   GET /api/visit-logs
 * @access  Private
 */
export const getAllVisitLogs = asyncHandler(async (req, res) => {
  const {
    orphanId,
    coordinatorId,
    startDate,
    endDate,
    limit = 50,
    offset = 0
  } = req.query;

  const where = {};

  if (orphanId) where.orphanId = orphanId;
  if (coordinatorId) where.coordinatorId = coordinatorId;

  if (startDate || endDate) {
    where.visitDate = {};
    if (startDate) where.visitDate[Op.gte] = startDate;
    if (endDate) where.visitDate[Op.lte] = endDate;
  }

  const { count, rows: visitLogs } = await OrphanVisitLog.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['visitDate', 'DESC']],
    include: [
      {
        model: Orphan,
        as: 'orphan',
        attributes: ['id', 'fullName', 'age', 'district']
      },
      {
        model: User,
        as: 'coordinator',
        attributes: ['id', 'username', 'fullName']
      },
      {
        model: OrphanProgressRating,
        as: 'rating',
        attributes: ['id', 'educationalProgress', 'healthWellbeing', 'socialDevelopment', 'behavioralProgress', 'overallRating']
      }
    ]
  });

  res.json({
    success: true,
    data: {
      visitLogs,
      count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  });
});

/**
 * @desc    Get visit logs for a specific orphan
 * @route   GET /api/visit-logs/orphan/:orphanId
 * @access  Private
 */
export const getVisitLogsByOrphan = asyncHandler(async (req, res) => {
  const { orphanId } = req.params;
  const { limit = 20, offset = 0 } = req.query;

  // Pull from BOTH the legacy OrphanVisitLog table (admin-created visits with
  // progress ratings + coordinator) AND the new generic Visit table (mobile-
  // logged visits where the field staff selected this orphan). Merge by date.
  const [vlResp, visitRows] = await Promise.all([
    OrphanVisitLog.findAndCountAll({
      where: { orphanId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['visitDate', 'DESC']],
      include: [
        { model: User, as: 'coordinator', attributes: ['id', 'username', 'fullName'] },
        { model: OrphanProgressRating, as: 'rating' },
      ],
    }),
    Visit.findAll({
      where: { orphanId },
      order: [['occurredAt', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'fullName'] }],
    }).catch(() => []),
  ]);

  const adapted = (visitRows || []).map(v => ({
    id: `mobile-${v.id}`,
    source: 'mobile',
    orphanId: v.orphanId,
    visitDate: v.occurredAt,
    visitType: v.visitType || 'general',
    notes: v.notes || v.purpose || null,
    photoUrl: v.photoUrl || null,
    latitude: v.latitude,
    longitude: v.longitude,
    coordinator: v.user || null,
    rating: null,
  }));

  const merged = [
    ...vlResp.rows.map(r => ({ ...r.toJSON(), source: 'web' })),
    ...adapted,
  ].sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));

  res.json({
    success: true,
    data: {
      visitLogs: merged,
      count: vlResp.count + adapted.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
    },
  });
});

/**
 * @desc    Get single visit log by ID
 * @route   GET /api/visit-logs/:id
 * @access  Private
 */
export const getVisitLogById = asyncHandler(async (req, res) => {
  const visitLog = await OrphanVisitLog.findByPk(req.params.id, {
    include: [
      {
        model: Orphan,
        as: 'orphan',
        attributes: ['id', 'fullName', 'age', 'district', 'donor']
      },
      {
        model: User,
        as: 'coordinator',
        attributes: ['id', 'username', 'fullName', 'email']
      },
      {
        model: OrphanProgressRating,
        as: 'rating'
      }
    ]
  });

  if (!visitLog) {
    res.status(404);
    throw new Error('Visit log not found');
  }

  res.json({
    success: true,
    data: { visitLog }
  });
});

/**
 * @desc    Create new visit log
 * @route   POST /api/visit-logs
 * @access  Private
 */
export const createVisitLog = asyncHandler(async (req, res) => {
  const {
    orphanId,
    visitDate,
    visitNotes,
    observations,
    photos,
    drawings,
    letters,
    rating
  } = req.body;

  // Set coordinator from authenticated user
  const visitLogData = {
    orphanId,
    visitDate,
    coordinatorId: req.user.id,
    visitNotes,
    observations,
    photos: photos || [],
    drawings: drawings || [],
    letters: letters || []
  };

  const visitLog = await OrphanVisitLog.create(visitLogData);

  // Create progress rating if provided
  if (rating) {
    const ratingData = {
      visitLogId: visitLog.id,
      orphanId,
      ratingDate: visitDate,
      educationalProgress: rating.educationalProgress,
      healthWellbeing: rating.healthWellbeing,
      socialDevelopment: rating.socialDevelopment,
      behavioralProgress: rating.behavioralProgress,
      notes: rating.notes
    };

    // Calculate overall rating
    const ratings = [
      rating.educationalProgress,
      rating.healthWellbeing,
      rating.socialDevelopment,
      rating.behavioralProgress
    ].filter(r => r != null);

    if (ratings.length > 0) {
      ratingData.overallRating = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2);
    }

    await OrphanProgressRating.create(ratingData);
  }

  // Fetch with associations
  const fullVisitLog = await OrphanVisitLog.findByPk(visitLog.id, {
    include: [
      {
        model: Orphan,
        as: 'orphan',
        attributes: ['id', 'fullName', 'age', 'district']
      },
      {
        model: User,
        as: 'coordinator',
        attributes: ['id', 'username', 'fullName']
      },
      {
        model: OrphanProgressRating,
        as: 'rating'
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Visit log created successfully',
    data: { visitLog: fullVisitLog }
  });
});

/**
 * @desc    Update visit log
 * @route   PUT /api/visit-logs/:id
 * @access  Private
 */
export const updateVisitLog = asyncHandler(async (req, res) => {
  const visitLog = await OrphanVisitLog.findByPk(req.params.id);

  if (!visitLog) {
    res.status(404);
    throw new Error('Visit log not found');
  }

  const {
    visitDate,
    visitNotes,
    observations,
    photos,
    drawings,
    letters,
    rating
  } = req.body;

  // Update visit log
  await visitLog.update({
    visitDate: visitDate || visitLog.visitDate,
    visitNotes,
    observations,
    photos: photos !== undefined ? photos : visitLog.photos,
    drawings: drawings !== undefined ? drawings : visitLog.drawings,
    letters: letters !== undefined ? letters : visitLog.letters
  });

  // Update or create rating if provided
  if (rating) {
    const existingRating = await OrphanProgressRating.findOne({
      where: { visitLogId: visitLog.id }
    });

    const ratingData = {
      educationalProgress: rating.educationalProgress,
      healthWellbeing: rating.healthWellbeing,
      socialDevelopment: rating.socialDevelopment,
      behavioralProgress: rating.behavioralProgress,
      notes: rating.notes
    };

    // Calculate overall rating
    const ratings = [
      rating.educationalProgress,
      rating.healthWellbeing,
      rating.socialDevelopment,
      rating.behavioralProgress
    ].filter(r => r != null);

    if (ratings.length > 0) {
      ratingData.overallRating = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2);
    }

    if (existingRating) {
      await existingRating.update(ratingData);
    } else {
      await OrphanProgressRating.create({
        visitLogId: visitLog.id,
        orphanId: visitLog.orphanId,
        ratingDate: visitLog.visitDate,
        ...ratingData
      });
    }
  }

  // Fetch updated visit log with associations
  const updatedVisitLog = await OrphanVisitLog.findByPk(visitLog.id, {
    include: [
      {
        model: Orphan,
        as: 'orphan',
        attributes: ['id', 'fullName', 'age', 'district']
      },
      {
        model: User,
        as: 'coordinator',
        attributes: ['id', 'username', 'fullName']
      },
      {
        model: OrphanProgressRating,
        as: 'rating'
      }
    ]
  });

  res.json({
    success: true,
    message: 'Visit log updated successfully',
    data: { visitLog: updatedVisitLog }
  });
});

/**
 * @desc    Delete visit log
 * @route   DELETE /api/visit-logs/:id
 * @access  Private
 */
export const deleteVisitLog = asyncHandler(async (req, res) => {
  const visitLog = await OrphanVisitLog.findByPk(req.params.id);

  if (!visitLog) {
    res.status(404);
    throw new Error('Visit log not found');
  }

  await visitLog.destroy();

  res.json({
    success: true,
    message: 'Visit log deleted successfully'
  });
});

/**
 * @desc    Get visit logs within a date range (for report generation)
 * @route   GET /api/visit-logs/range/:orphanId
 * @access  Private
 */
export const getVisitLogsByDateRange = asyncHandler(async (req, res) => {
  const { orphanId } = req.params;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    res.status(400);
    throw new Error('Start date and end date are required');
  }

  const visitLogs = await OrphanVisitLog.findAll({
    where: {
      orphanId,
      visitDate: {
        [Op.between]: [startDate, endDate]
      }
    },
    order: [['visitDate', 'ASC']],
    include: [
      {
        model: User,
        as: 'coordinator',
        attributes: ['id', 'username', 'fullName']
      },
      {
        model: OrphanProgressRating,
        as: 'rating'
      }
    ]
  });

  // Aggregate media from all visits
  const allPhotos = visitLogs.flatMap(log => log.photos || []);
  const allDrawings = visitLogs.flatMap(log => log.drawings || []);
  const allLetters = visitLogs.flatMap(log => log.letters || []);

  res.json({
    success: true,
    data: {
      visitLogs,
      count: visitLogs.length,
      media: {
        photos: allPhotos,
        drawings: allDrawings,
        letters: allLetters
      }
    }
  });
});
