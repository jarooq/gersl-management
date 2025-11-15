import { ComplianceTraining, User } from '../models/index.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error.middleware.js';
import { Op } from 'sequelize';

// ============================================
// GET ALL TRAININGS
// ============================================
export const getAllTrainings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, trainingType } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (trainingType) where.trainingType = trainingType;

  const { count, rows: trainings } = await ComplianceTraining.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ],
    order: [['trainingDate', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      trainings,
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
// GET TRAINING BY ID
// ============================================
export const getTrainingById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const training = await ComplianceTraining.findByPk(id, {
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ]
  });

  if (!training) {
    throw new NotFoundError('Training record not found');
  }

  res.json({
    success: true,
    data: { training }
  });
});

// ============================================
// CREATE TRAINING
// ============================================
export const createTraining = asyncHandler(async (req, res) => {
  const trainingData = req.body;

  if (!trainingData.trainingName || !trainingData.trainingType || !trainingData.trainingDate) {
    throw new ValidationError('Training name, type, and date are required');
  }

  // Auto-set total attendees from attendees array
  if (trainingData.attendees && Array.isArray(trainingData.attendees)) {
    trainingData.totalAttendees = trainingData.attendees.length;
  }

  if (req.user) {
    trainingData.createdBy = req.user.id;
  }

  const training = await ComplianceTraining.create(trainingData);

  const createdTraining = await ComplianceTraining.findByPk(training.id, {
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Training record created successfully',
    data: { training: createdTraining }
  });
});

// ============================================
// UPDATE TRAINING
// ============================================
export const updateTraining = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const training = await ComplianceTraining.findByPk(id);
  if (!training) {
    throw new NotFoundError('Training record not found');
  }

  // Auto-update total attendees if attendees array is updated
  if (updates.attendees && Array.isArray(updates.attendees)) {
    updates.totalAttendees = updates.attendees.length;
  }

  await training.update(updates);

  const updatedTraining = await ComplianceTraining.findByPk(id, {
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ]
  });

  res.json({
    success: true,
    message: 'Training record updated successfully',
    data: { training: updatedTraining }
  });
});

// ============================================
// DELETE TRAINING
// ============================================
export const deleteTraining = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const training = await ComplianceTraining.findByPk(id);
  if (!training) {
    throw new NotFoundError('Training record not found');
  }

  await training.destroy();

  res.json({
    success: true,
    message: 'Training record deleted successfully'
  });
});

// ============================================
// ADD ATTENDEE TO TRAINING
// ============================================
export const addAttendee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { attendee } = req.body;

  if (!attendee || !attendee.staffId || !attendee.staffName) {
    throw new ValidationError('Attendee staff ID and name are required');
  }

  const training = await ComplianceTraining.findByPk(id);
  if (!training) {
    throw new NotFoundError('Training record not found');
  }

  const attendees = training.attendees || [];
  const existingAttendee = attendees.find(a => a.staffId === attendee.staffId);

  if (existingAttendee) {
    throw new ValidationError('Staff member is already registered for this training');
  }

  attendees.push({
    ...attendee,
    registeredDate: new Date().toISOString().split('T')[0]
  });

  await training.update({
    attendees,
    totalAttendees: attendees.length
  });

  const updatedTraining = await ComplianceTraining.findByPk(id);

  res.json({
    success: true,
    message: 'Attendee added successfully',
    data: { training: updatedTraining }
  });
});

// ============================================
// MARK ATTENDANCE
// ============================================
export const markAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { staffId, attended } = req.body;

  if (!staffId || attended === undefined) {
    throw new ValidationError('Staff ID and attendance status are required');
  }

  const training = await ComplianceTraining.findByPk(id);
  if (!training) {
    throw new NotFoundError('Training record not found');
  }

  const attendees = training.attendees || [];
  const attendeeIndex = attendees.findIndex(a => a.staffId === staffId);

  if (attendeeIndex === -1) {
    throw new NotFoundError('Attendee not found in this training');
  }

  attendees[attendeeIndex] = {
    ...attendees[attendeeIndex],
    attended,
    attendanceMarkedDate: new Date().toISOString().split('T')[0]
  };

  await training.update({ attendees });

  const updatedTraining = await ComplianceTraining.findByPk(id);

  res.json({
    success: true,
    message: 'Attendance marked successfully',
    data: { training: updatedTraining }
  });
});

// ============================================
// GET TRAINING STATISTICS
// ============================================
export const getTrainingStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const where = {};
  if (startDate && endDate) {
    where.trainingDate = {
      [Op.between]: [startDate, endDate]
    };
  }

  const total = await ComplianceTraining.count({ where });
  const scheduled = await ComplianceTraining.count({ where: { ...where, status: 'Scheduled' } });
  const completed = await ComplianceTraining.count({ where: { ...where, status: 'Completed' } });
  const cancelled = await ComplianceTraining.count({ where: { ...where, status: 'Cancelled' } });

  // Get trainings with certificates issued
  const withCertificates = await ComplianceTraining.count({
    where: { ...where, certificateIssued: true }
  });

  // Calculate total attendees across all trainings
  const trainings = await ComplianceTraining.findAll({
    where,
    attributes: ['totalAttendees', 'attendees', 'evaluationScore']
  });

  const totalAttendees = trainings.reduce((sum, t) => sum + (t.totalAttendees || 0), 0);

  // Calculate attended count
  const totalAttended = trainings.reduce((sum, t) => {
    const attendees = t.attendees || [];
    return sum + attendees.filter(a => a.attended === true).length;
  }, 0);

  // Calculate average evaluation score
  const scoresSum = trainings.reduce((sum, t) => sum + (parseFloat(t.evaluationScore) || 0), 0);
  const trainingsWithScores = trainings.filter(t => t.evaluationScore).length;
  const avgEvaluationScore = trainingsWithScores > 0 ? (scoresSum / trainingsWithScores).toFixed(2) : 0;

  res.json({
    success: true,
    data: {
      total,
      byStatus: {
        scheduled,
        completed,
        cancelled
      },
      totalAttendees,
      totalAttended,
      attendanceRate: totalAttendees > 0 ? Math.round((totalAttended / totalAttendees) * 100) : 0,
      withCertificates,
      avgEvaluationScore
    }
  });
});
