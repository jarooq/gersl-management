import { CBOVolunteer, CBOPartner, User } from '../models/index.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error.middleware.js';
import { Op } from 'sequelize';

// ============================================
// GET ALL VOLUNTEERS
// ============================================
export const getAllVolunteers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, district, cboPartnerId } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (district) where.district = district;
  if (cboPartnerId) where.cboPartnerId = cboPartnerId;

  const { count, rows: volunteers } = await CBOVolunteer.findAndCountAll({
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
    order: [['joinedDate', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      volunteers,
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
// GET VOLUNTEER BY ID
// ============================================
export const getVolunteerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const volunteer = await CBOVolunteer.findByPk(id, {
    include: [
      {
        model: CBOPartner,
        as: 'cboPartner',
        attributes: ['id', 'name', 'acronym', 'district', 'contactPerson', 'email', 'phone']
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName']
      }
    ]
  });

  if (!volunteer) {
    throw new NotFoundError('Volunteer not found');
  }

  res.json({
    success: true,
    data: { volunteer }
  });
});

// ============================================
// GET VOLUNTEERS BY CBO PARTNER
// ============================================
export const getVolunteersByCBO = asyncHandler(async (req, res) => {
  const { cboPartnerId } = req.params;

  const volunteers = await CBOVolunteer.findAll({
    where: { cboPartnerId },
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName']
      }
    ],
    order: [['joinedDate', 'DESC']]
  });

  res.json({
    success: true,
    data: { volunteers }
  });
});

// ============================================
// CREATE VOLUNTEER
// ============================================
export const createVolunteer = asyncHandler(async (req, res) => {
  const {
    fullName,
    cboAffiliation,
    cboPartnerId,
    district,
    email,
    phone,
    skills,
    joinedDate,
    hoursContributed,
    projectsParticipated,
    rating,
    status
  } = req.body;

  // Validate required fields
  if (!fullName || !cboAffiliation || !district || !joinedDate) {
    throw new ValidationError('Full name, CBO affiliation, district, and joined date are required');
  }

  // Check if CBO Partner exists if provided
  if (cboPartnerId) {
    const cbo = await CBOPartner.findByPk(cboPartnerId);
    if (!cbo) {
      throw new NotFoundError('CBO Partner not found');
    }
  }

  // Create volunteer
  const volunteer = await CBOVolunteer.create({
    fullName,
    cboAffiliation,
    cboPartnerId,
    district,
    email,
    phone,
    skills: skills || [],
    joinedDate,
    hoursContributed: hoursContributed || 0,
    projectsParticipated: projectsParticipated || 0,
    rating,
    status: status || 'Pending Orientation',
    createdBy: req.user?.id
  });

  // Fetch with associations
  const createdVolunteer = await CBOVolunteer.findByPk(volunteer.id, {
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
    message: 'Volunteer created successfully',
    data: { volunteer: createdVolunteer }
  });
});

// ============================================
// UPDATE VOLUNTEER
// ============================================
export const updateVolunteer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const volunteer = await CBOVolunteer.findByPk(id);
  if (!volunteer) {
    throw new NotFoundError('Volunteer not found');
  }

  // Validate CBO Partner if being updated
  if (updates.cboPartnerId) {
    const cbo = await CBOPartner.findByPk(updates.cboPartnerId);
    if (!cbo) {
      throw new NotFoundError('CBO Partner not found');
    }
  }

  // Validate rating if provided
  if (updates.rating !== undefined && (updates.rating < 0 || updates.rating > 5)) {
    throw new ValidationError('Rating must be between 0 and 5');
  }

  await volunteer.update(updates);

  // Fetch updated volunteer with associations
  const updatedVolunteer = await CBOVolunteer.findByPk(id, {
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
    message: 'Volunteer updated successfully',
    data: { volunteer: updatedVolunteer }
  });
});

// ============================================
// DELETE VOLUNTEER
// ============================================
export const deleteVolunteer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const volunteer = await CBOVolunteer.findByPk(id);
  if (!volunteer) {
    throw new NotFoundError('Volunteer not found');
  }

  await volunteer.destroy();

  res.json({
    success: true,
    message: 'Volunteer deleted successfully'
  });
});

// ============================================
// SEARCH VOLUNTEERS
// ============================================
export const searchVolunteers = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query || query.trim().length < 2) {
    throw new ValidationError('Search query must be at least 2 characters');
  }

  const volunteers = await CBOVolunteer.findAll({
    where: {
      [Op.or]: [
        { fullName: { [Op.iLike]: `%${query}%` } },
        { cboAffiliation: { [Op.iLike]: `%${query}%` } },
        { district: { [Op.iLike]: `%${query}%` } },
        { email: { [Op.iLike]: `%${query}%` } }
      ]
    },
    include: [
      {
        model: CBOPartner,
        as: 'cboPartner',
        attributes: ['id', 'name', 'acronym']
      }
    ],
    limit: 20,
    order: [['fullName', 'ASC']]
  });

  res.json({
    success: true,
    data: { volunteers }
  });
});

// ============================================
// GET VOLUNTEER STATISTICS
// ============================================
export const getVolunteerStats = asyncHandler(async (req, res) => {
  const { cboPartnerId, district } = req.query;

  const where = {};
  if (cboPartnerId) where.cboPartnerId = cboPartnerId;
  if (district) where.district = district;

  const [
    total,
    active,
    inactive,
    pendingOrientation
  ] = await Promise.all([
    CBOVolunteer.count({ where }),
    CBOVolunteer.count({ where: { ...where, status: 'Active' } }),
    CBOVolunteer.count({ where: { ...where, status: 'Inactive' } }),
    CBOVolunteer.count({ where: { ...where, status: 'Pending Orientation' } })
  ]);

  // Calculate totals and averages
  const volunteers = await CBOVolunteer.findAll({
    where,
    attributes: ['hoursContributed', 'projectsParticipated', 'rating']
  });

  const totalHours = volunteers.reduce((sum, v) => sum + (v.hoursContributed || 0), 0);
  const totalProjects = volunteers.reduce((sum, v) => sum + (v.projectsParticipated || 0), 0);
  const ratedVolunteers = volunteers.filter(v => v.rating !== null);
  const avgRating = ratedVolunteers.length > 0
    ? (ratedVolunteers.reduce((sum, v) => sum + parseFloat(v.rating), 0) / ratedVolunteers.length).toFixed(2)
    : 0;

  res.json({
    success: true,
    data: {
      total,
      byStatus: {
        active,
        inactive,
        pendingOrientation
      },
      totalHours,
      totalProjects,
      avgRating,
      avgHoursPerVolunteer: total > 0 ? Math.round(totalHours / total) : 0,
      avgProjectsPerVolunteer: total > 0 ? (totalProjects / total).toFixed(1) : 0
    }
  });
});
