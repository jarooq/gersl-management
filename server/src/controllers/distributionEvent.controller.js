import { DistributionEvent, DistributionScan, Project, User } from '../models/index.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/error.middleware.js';

// ============================================
// DISTRIBUTION EVENT CONTROLLER
// ============================================
// CRUD for distribution events — the occasions field staff scan beneficiary
// QR codes against. Status lifecycle: Planned → Active → Closed.

const STATUSES = ['Planned', 'Active', 'Closed'];

const defaultIncludes = [
  { model: Project, as: 'project', attributes: ['id', 'name', 'projectCode'] },
  { model: User, as: 'creator', attributes: ['id', 'fullName'] }
];

// ============================================
// POST /api/distribution-events
// Body: { projectId, name, scheduledDate, location, notes }
// ============================================
export const create = asyncHandler(async (req, res) => {
  const { projectId, name, scheduledDate, location, notes, status } = req.body;

  if (!projectId || !name || !scheduledDate) {
    throw new ValidationError('projectId, name and scheduledDate are required');
  }
  if (status && !STATUSES.includes(status)) {
    throw new ValidationError(`status must be one of: ${STATUSES.join(', ')}`);
  }

  const project = await Project.findByPk(projectId, { attributes: ['id'] });
  if (!project) throw new NotFoundError('Project not found');

  const event = await DistributionEvent.create({
    projectId,
    name,
    scheduledDate,
    location: location || null,
    notes: notes || null,
    status: status || 'Planned',
    createdBy: req.user?.id || null
  });

  res.status(201).json({ success: true, message: 'Distribution event created', data: { event } });
});

// ============================================
// GET /api/distribution-events?projectId=&status=&page=&limit=
// ============================================
export const list = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);

  const where = {};
  if (req.query.projectId) where.projectId = parseInt(req.query.projectId, 10);
  if (req.query.status) where.status = req.query.status;

  const { rows, count } = await DistributionEvent.findAndCountAll({
    where,
    include: defaultIncludes,
    order: [['scheduledDate', 'DESC'], ['id', 'DESC']],
    limit,
    offset: (page - 1) * limit
  });

  res.json({
    success: true,
    data: {
      events: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
    }
  });
});

// ============================================
// GET /api/distribution-events/:id
// ============================================
export const getById = asyncHandler(async (req, res) => {
  const event = await DistributionEvent.findByPk(req.params.id, { include: defaultIncludes });
  if (!event) throw new NotFoundError('Distribution event not found');

  const scanCount = await DistributionScan.count({ where: { eventId: event.id } });
  res.json({ success: true, data: { event, scanCount } });
});

// ============================================
// PUT /api/distribution-events/:id
// ============================================
export const update = asyncHandler(async (req, res) => {
  const event = await DistributionEvent.findByPk(req.params.id);
  if (!event) throw new NotFoundError('Distribution event not found');
  if (event.status === 'Closed') throw new ValidationError('Closed events cannot be edited');

  const { name, scheduledDate, location, notes, status } = req.body;
  if (status && !STATUSES.includes(status)) {
    throw new ValidationError(`status must be one of: ${STATUSES.join(', ')}`);
  }

  await event.update({
    ...(name !== undefined && { name }),
    ...(scheduledDate !== undefined && { scheduledDate }),
    ...(location !== undefined && { location }),
    ...(notes !== undefined && { notes }),
    ...(status !== undefined && { status })
  });

  res.json({ success: true, message: 'Distribution event updated', data: { event } });
});

// ============================================
// PATCH /api/distribution-events/:id/close
// Idempotent — closing a closed event is a no-op success.
// ============================================
export const close = asyncHandler(async (req, res) => {
  const event = await DistributionEvent.findByPk(req.params.id);
  if (!event) throw new NotFoundError('Distribution event not found');

  if (event.status !== 'Closed') {
    await event.update({ status: 'Closed' });
  }

  res.json({ success: true, message: 'Distribution event closed', data: { event } });
});
