import { LearningEvent } from '../models/index.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { Op } from 'sequelize';

// Get all learning events with filtering and pagination
export const getAllLearningEvents = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    type,
    status,
    facilitator,
    search,
    startDate,
    endDate,
    sortBy = 'eventDate',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;
  const where = {};

  // Apply filters
  if (type) where.type = type;
  if (status) where.status = status;
  if (facilitator) where.facilitator = { [Op.iLike]: `%${facilitator}%` };

  if (startDate || endDate) {
    where.eventDate = {};
    if (startDate) where.eventDate[Op.gte] = startDate;
    if (endDate) where.eventDate[Op.lte] = endDate;
  }

  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { eventCode: { [Op.iLike]: `%${search}%` } },
      { facilitator: { [Op.iLike]: `%${search}%` } },
      { venue: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const { count, rows } = await LearningEvent.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, sortOrder]]
  });

  res.json({
    success: true,
    data: {
      learningEvents: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// Get single learning event by ID
export const getLearningEventById = asyncHandler(async (req, res) => {
  const learningEvent = await LearningEvent.findByPk(req.params.id);

  if (!learningEvent) {
    return res.status(404).json({
      success: false,
      message: 'Learning event not found'
    });
  }

  res.json({
    success: true,
    data: { learningEvent }
  });
});

// Create new learning event
export const createLearningEvent = asyncHandler(async (req, res) => {
  const {
    eventCode,
    title,
    type,
    eventDate,
    facilitator,
    participants,
    totalParticipants,
    description,
    keyLearnings,
    actionPoints,
    status,
    venue,
    duration,
    materials,
    followUpRequired,
    followUpDate
  } = req.body;

  // Validate required fields
  if (!title || !type || !eventDate || !facilitator) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields: title, type, eventDate, facilitator'
    });
  }

  // Check if event code already exists (if provided)
  if (eventCode) {
    const existingEvent = await LearningEvent.findOne({ where: { eventCode } });
    if (existingEvent) {
      return res.status(400).json({
        success: false,
        message: 'Event code already exists'
      });
    }
  }

  const learningEvent = await LearningEvent.create({
    eventCode,
    title,
    type,
    eventDate,
    facilitator,
    participants: participants || [],
    totalParticipants: totalParticipants || (participants ? participants.length : 0),
    description,
    keyLearnings,
    actionPoints: actionPoints || [],
    status: status || 'Planned',
    venue,
    duration,
    materials: materials || [],
    followUpRequired: followUpRequired || false,
    followUpDate
  });

  res.status(201).json({
    success: true,
    data: { learningEvent },
    message: 'Learning event created successfully'
  });
});

// Update learning event
export const updateLearningEvent = asyncHandler(async (req, res) => {
  const learningEvent = await LearningEvent.findByPk(req.params.id);

  if (!learningEvent) {
    return res.status(404).json({
      success: false,
      message: 'Learning event not found'
    });
  }

  const {
    eventCode,
    title,
    type,
    eventDate,
    facilitator,
    participants,
    totalParticipants,
    description,
    keyLearnings,
    actionPoints,
    status,
    venue,
    duration,
    materials,
    followUpRequired,
    followUpDate
  } = req.body;

  // If updating event code, check uniqueness
  if (eventCode && eventCode !== learningEvent.eventCode) {
    const existingEvent = await LearningEvent.findOne({ where: { eventCode } });
    if (existingEvent) {
      return res.status(400).json({
        success: false,
        message: 'Event code already exists'
      });
    }
  }

  // Calculate total participants if participants array is updated
  const updatedParticipants = participants !== undefined ? participants : learningEvent.participants;
  const updatedTotalParticipants = totalParticipants !== undefined
    ? totalParticipants
    : (participants ? participants.length : learningEvent.totalParticipants);

  await learningEvent.update({
    eventCode: eventCode !== undefined ? eventCode : learningEvent.eventCode,
    title: title || learningEvent.title,
    type: type || learningEvent.type,
    eventDate: eventDate || learningEvent.eventDate,
    facilitator: facilitator || learningEvent.facilitator,
    participants: updatedParticipants,
    totalParticipants: updatedTotalParticipants,
    description: description !== undefined ? description : learningEvent.description,
    keyLearnings: keyLearnings !== undefined ? keyLearnings : learningEvent.keyLearnings,
    actionPoints: actionPoints !== undefined ? actionPoints : learningEvent.actionPoints,
    status: status || learningEvent.status,
    venue: venue !== undefined ? venue : learningEvent.venue,
    duration: duration !== undefined ? duration : learningEvent.duration,
    materials: materials !== undefined ? materials : learningEvent.materials,
    followUpRequired: followUpRequired !== undefined ? followUpRequired : learningEvent.followUpRequired,
    followUpDate: followUpDate !== undefined ? followUpDate : learningEvent.followUpDate
  });

  res.json({
    success: true,
    data: { learningEvent },
    message: 'Learning event updated successfully'
  });
});

// Delete learning event
export const deleteLearningEvent = asyncHandler(async (req, res) => {
  const learningEvent = await LearningEvent.findByPk(req.params.id);

  if (!learningEvent) {
    return res.status(404).json({
      success: false,
      message: 'Learning event not found'
    });
  }

  await learningEvent.destroy();

  res.json({
    success: true,
    message: 'Learning event deleted successfully'
  });
});

// Add participant to learning event
export const addParticipant = asyncHandler(async (req, res) => {
  const learningEvent = await LearningEvent.findByPk(req.params.id);

  if (!learningEvent) {
    return res.status(404).json({
      success: false,
      message: 'Learning event not found'
    });
  }

  const { participant } = req.body;

  if (!participant || !participant.name) {
    return res.status(400).json({
      success: false,
      message: 'Please provide participant information with at least a name'
    });
  }

  const participants = learningEvent.participants || [];
  participants.push(participant);

  await learningEvent.update({
    participants,
    totalParticipants: participants.length
  });

  res.json({
    success: true,
    data: { learningEvent },
    message: 'Participant added successfully'
  });
});

// Get learning event statistics
export const getLearningEventStats = asyncHandler(async (req, res) => {
  const [
    total,
    byType,
    byStatus,
    completedCount,
    upcomingCount,
    totalParticipants
  ] = await Promise.all([
    LearningEvent.count(),
    LearningEvent.findAll({
      attributes: [
        'type',
        [LearningEvent.sequelize.fn('COUNT', LearningEvent.sequelize.col('id')), 'count']
      ],
      group: ['type'],
      raw: true
    }),
    LearningEvent.findAll({
      attributes: [
        'status',
        [LearningEvent.sequelize.fn('COUNT', LearningEvent.sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    }),
    LearningEvent.count({ where: { status: 'Completed' } }),
    LearningEvent.count({
      where: {
        status: 'Planned',
        eventDate: { [Op.gte]: new Date() }
      }
    }),
    LearningEvent.sum('totalParticipants')
  ]);

  res.json({
    success: true,
    data: {
      total,
      completedCount,
      upcomingCount,
      totalParticipants: totalParticipants || 0,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = parseInt(item.count);
        return acc;
      }, {}),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {})
    }
  });
});
