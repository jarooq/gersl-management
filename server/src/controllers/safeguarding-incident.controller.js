import { SafeguardingIncident, User } from '../models/index.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error.middleware.js';
import { Op } from 'sequelize';

// ============================================
// GET ALL INCIDENTS
// ============================================
export const getAllIncidents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, severity, incidentType } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (severity) where.severity = severity;
  if (incidentType) where.incidentType = incidentType;

  const { count, rows: incidents } = await SafeguardingIncident.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ],
    order: [['reportedDate', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      incidents,
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
// GET INCIDENT BY ID
// ============================================
export const getIncidentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const incident = await SafeguardingIncident.findByPk(id, {
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ]
  });

  if (!incident) {
    throw new NotFoundError('Incident not found');
  }

  res.json({
    success: true,
    data: { incident }
  });
});

// ============================================
// CREATE INCIDENT
// ============================================
export const createIncident = asyncHandler(async (req, res) => {
  const incidentData = req.body;

  if (!incidentData.incidentType || !incidentData.severity || !incidentData.incidentDate || !incidentData.reportedBy || !incidentData.description) {
    throw new ValidationError('Incident type, severity, date, reporter, and description are required');
  }

  // Auto-generate incident code
  if (!incidentData.incidentCode) {
    const year = new Date().getFullYear();
    const count = await SafeguardingIncident.count();
    incidentData.incidentCode = `SG-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  // Set reported date if not provided
  if (!incidentData.reportedDate) {
    incidentData.reportedDate = new Date().toISOString().split('T')[0];
  }

  if (req.user) {
    incidentData.createdBy = req.user.id;
  }

  const incident = await SafeguardingIncident.create(incidentData);

  const createdIncident = await SafeguardingIncident.findByPk(incident.id, {
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Incident reported successfully',
    data: { incident: createdIncident }
  });
});

// ============================================
// UPDATE INCIDENT
// ============================================
export const updateIncident = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const incident = await SafeguardingIncident.findByPk(id);
  if (!incident) {
    throw new NotFoundError('Incident not found');
  }

  // Auto-set resolved date if status changed to Resolved
  if (updates.status === 'Resolved' && incident.status !== 'Resolved') {
    updates.resolvedDate = new Date().toISOString().split('T')[0];
  }

  // Auto-set closed date if status changed to Closed
  if (updates.status === 'Closed' && incident.status !== 'Closed') {
    updates.closedDate = new Date().toISOString().split('T')[0];
  }

  await incident.update(updates);

  const updatedIncident = await SafeguardingIncident.findByPk(id, {
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ]
  });

  res.json({
    success: true,
    message: 'Incident updated successfully',
    data: { incident: updatedIncident }
  });
});

// ============================================
// DELETE INCIDENT
// ============================================
export const deleteIncident = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const incident = await SafeguardingIncident.findByPk(id);
  if (!incident) {
    throw new NotFoundError('Incident not found');
  }

  // Don't allow deletion of active incidents
  if (incident.status === 'Under Investigation' || incident.status === 'In Progress') {
    throw new ValidationError('Cannot delete an active incident. Please close it first.');
  }

  await incident.destroy();

  res.json({
    success: true,
    message: 'Incident deleted successfully'
  });
});

// ============================================
// ASSIGN INCIDENT
// ============================================
export const assignIncident = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { assignedTo } = req.body;

  if (!assignedTo) {
    throw new ValidationError('Assignee is required');
  }

  const incident = await SafeguardingIncident.findByPk(id);
  if (!incident) {
    throw new NotFoundError('Incident not found');
  }

  await incident.update({
    assignedTo,
    status: incident.status === 'Under Investigation' ? 'In Progress' : incident.status
  });

  const updatedIncident = await SafeguardingIncident.findByPk(id);

  res.json({
    success: true,
    message: 'Incident assigned successfully',
    data: { incident: updatedIncident }
  });
});

// ============================================
// GET INCIDENT STATISTICS
// ============================================
export const getIncidentStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const where = {};
  if (startDate && endDate) {
    where.reportedDate = {
      [Op.between]: [startDate, endDate]
    };
  }

  const total = await SafeguardingIncident.count({ where });
  const underInvestigation = await SafeguardingIncident.count({ where: { ...where, status: 'Under Investigation' } });
  const inProgress = await SafeguardingIncident.count({ where: { ...where, status: 'In Progress' } });
  const resolved = await SafeguardingIncident.count({ where: { ...where, status: 'Resolved' } });
  const closed = await SafeguardingIncident.count({ where: { ...where, status: 'Closed' } });

  // Count by severity
  const critical = await SafeguardingIncident.count({ where: { ...where, severity: 'Critical' } });
  const high = await SafeguardingIncident.count({ where: { ...where, severity: 'High' } });
  const medium = await SafeguardingIncident.count({ where: { ...where, severity: 'Medium' } });
  const low = await SafeguardingIncident.count({ where: { ...where, severity: 'Low' } });

  // Follow-up required
  const followUpRequired = await SafeguardingIncident.count({
    where: {
      ...where,
      followUpRequired: true,
      status: { [Op.ne]: 'Closed' }
    }
  });

  res.json({
    success: true,
    data: {
      total,
      byStatus: {
        underInvestigation,
        inProgress,
        resolved,
        closed
      },
      bySeverity: {
        critical,
        high,
        medium,
        low
      },
      followUpRequired
    }
  });
});
