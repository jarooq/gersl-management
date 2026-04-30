import {
  MovementLog,
  Vehicle,
  User
} from '../models/index.js';
import { Op } from 'sequelize';
import {
  asyncHandler,
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError
} from '../middleware/error.middleware.js';

const include = [
  { model: User,    as: 'staff',    attributes: ['id', 'fullName', 'role', 'email'] },
  { model: User,    as: 'approver', attributes: ['id', 'fullName', 'role'] },
  { model: Vehicle, as: 'vehicle' },
  { model: MovementLog, as: 'primaryMovement', attributes: ['id', 'userId', 'fromLocation', 'toLocation'] }
];

const APPROVE_ROLES = [
  'Admin', 'CEO', 'Director Programmes',
  'Programme Manager', 'HR Manager', 'Finance Manager', 'Procurement Manager'
];

const isApprover = (user) => APPROVE_ROLES.includes(user?.role);
const reportsToMe = (movement, supervisor) => {
  // Lightweight: same department + supervisor in approver list. The full
  // org-chart resolution lives in roleHierarchy; here we accept any
  // approver-role user.
  return isApprover(supervisor);
};

// ============================================
// LIST
// scope=mine | team | all (default mine)
// ============================================
export const listMovements = asyncHandler(async (req, res) => {
  const {
    scope = 'mine',
    status,
    from,
    to,
    page = 1,
    limit = 50
  } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const where = {};
  if (status) where.status = status;
  if (from || to) {
    where.departureAt = {};
    if (from) where.departureAt[Op.gte] = new Date(from);
    if (to)   where.departureAt[Op.lte] = new Date(to);
  }

  if (scope === 'mine') where.userId = req.user.id;
  if (scope === 'team') {
    if (!isApprover(req.user)) throw new ForbiddenError('Only managers can see team movements');
    // Team scope = all non-self in department (best-effort) OR approvable.
    where.userId = { [Op.ne]: req.user.id };
  }
  if (scope === 'all') {
    if (!['Admin', 'CEO'].includes(req.user.role)) {
      throw new ForbiddenError('Only Admin / CEO can list all movements');
    }
  }

  const { rows, count } = await MovementLog.findAndCountAll({
    where,
    include,
    limit: parseInt(limit, 10),
    offset,
    order: [['createdAt', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      movements: rows,
      pagination: { total: count, page: parseInt(page, 10), pages: Math.ceil(count / parseInt(limit, 10)) }
    }
  });
});

export const getMovement = asyncHandler(async (req, res) => {
  const m = await MovementLog.findByPk(req.params.id, { include });
  if (!m) throw new NotFoundError('Movement not found');
  // View access: owner, manager, or admin.
  const isOwner = m.userId === req.user.id;
  if (!isOwner && !isApprover(req.user) && req.user.role !== 'Admin') {
    throw new ForbiddenError('Cannot view this movement');
  }
  res.json({ success: true, data: { movement: m } });
});

// ============================================
// CREATE — staff plans a trip
// Body: { fromLocation, toLocation, purpose?, projectId?, taskId?, vehicleId?,
//         plannedDepartureAt?, plannedReturnAt?, isPassenger?, primaryMovementId? }
// ============================================
export const createMovement = asyncHandler(async (req, res) => {
  const {
    fromLocation, toLocation, purpose,
    projectId, taskId, vehicleId,
    plannedDepartureAt, plannedReturnAt,
    isPassenger = false, primaryMovementId, notes
  } = req.body;

  if (!fromLocation || !toLocation) throw new BadRequestError('fromLocation and toLocation are required');
  if (vehicleId) {
    const v = await Vehicle.findByPk(vehicleId);
    if (!v) throw new BadRequestError('vehicleId is invalid');
    if (!v.isActive) throw new BadRequestError('Vehicle is inactive');
  }
  if (isPassenger) {
    if (!primaryMovementId) throw new BadRequestError('Passenger movements require primaryMovementId');
    const primary = await MovementLog.findByPk(primaryMovementId);
    if (!primary) throw new BadRequestError('primaryMovementId is invalid');
    if (primary.userId === req.user.id) throw new BadRequestError('Cannot be a passenger on your own movement');
  }
  if (plannedDepartureAt && plannedReturnAt &&
      new Date(plannedReturnAt) <= new Date(plannedDepartureAt)) {
    throw new BadRequestError('plannedReturnAt must be after plannedDepartureAt');
  }

  const m = await MovementLog.create({
    userId: req.user.id,
    fromLocation, toLocation, purpose,
    projectId: projectId ?? null,
    taskId: taskId ?? null,
    vehicleId: vehicleId ?? null,
    plannedDepartureAt: plannedDepartureAt ? new Date(plannedDepartureAt) : null,
    plannedReturnAt:   plannedReturnAt   ? new Date(plannedReturnAt)   : null,
    isPassenger: !!isPassenger,
    primaryMovementId: isPassenger ? primaryMovementId : null,
    status: 'Planned',
    notes: notes || null
  });
  const reloaded = await MovementLog.findByPk(m.id, { include });
  res.status(201).json({ success: true, data: { movement: reloaded } });
});

// ============================================
// APPROVE — supervisor approves a Planned movement
// ============================================
export const approveMovement = asyncHandler(async (req, res) => {
  if (!isApprover(req.user)) {
    throw new ForbiddenError('Your role cannot approve movements');
  }
  const m = await MovementLog.findByPk(req.params.id);
  if (!m) throw new NotFoundError('Movement not found');
  if (m.status !== 'Planned') throw new ConflictError(`Cannot approve a ${m.status} movement`);
  if (m.userId === req.user.id && req.user.role !== 'Admin') {
    throw new ForbiddenError('Cannot approve your own movement');
  }
  await m.update({ status: 'Approved', approvedBy: req.user.id, approvedAt: new Date() });
  const reloaded = await MovementLog.findByPk(m.id, { include });
  res.json({ success: true, data: { movement: reloaded } });
});

// ============================================
// REJECT
// ============================================
export const rejectMovement = asyncHandler(async (req, res) => {
  if (!isApprover(req.user)) {
    throw new ForbiddenError('Your role cannot reject movements');
  }
  const { reason } = req.body || {};
  if (!reason) throw new BadRequestError('reason is required');
  const m = await MovementLog.findByPk(req.params.id);
  if (!m) throw new NotFoundError('Movement not found');
  if (m.status !== 'Planned') throw new ConflictError(`Cannot reject a ${m.status} movement`);
  await m.update({
    status: 'Rejected',
    approvedBy: req.user.id,
    approvedAt: new Date(),
    rejectionReason: reason
  });
  const reloaded = await MovementLog.findByPk(m.id, { include });
  res.json({ success: true, data: { movement: reloaded } });
});

// ============================================
// DEPART — owner stamps actual departure
// ============================================
export const departMovement = asyncHandler(async (req, res) => {
  const m = await MovementLog.findByPk(req.params.id);
  if (!m) throw new NotFoundError('Movement not found');
  if (m.userId !== req.user.id && req.user.role !== 'Admin') {
    throw new ForbiddenError('Only the owner can depart');
  }
  if (!['Planned', 'Approved'].includes(m.status)) {
    throw new ConflictError(`Cannot depart from a ${m.status} movement`);
  }
  await m.update({
    status: 'InMovement',
    departureAt: req.body?.departureAt ? new Date(req.body.departureAt) : new Date()
  });
  const reloaded = await MovementLog.findByPk(m.id, { include });
  res.json({ success: true, data: { movement: reloaded } });
});

// ============================================
// ARRIVE — owner stamps arrival at destination
// ============================================
export const arriveMovement = asyncHandler(async (req, res) => {
  const m = await MovementLog.findByPk(req.params.id);
  if (!m) throw new NotFoundError('Movement not found');
  if (m.userId !== req.user.id && req.user.role !== 'Admin') {
    throw new ForbiddenError('Only the owner can record arrival');
  }
  if (m.status !== 'InMovement') {
    throw new ConflictError(`Cannot record arrival on a ${m.status} movement`);
  }
  await m.update({
    status: 'Arrived',
    arrivalAt: req.body?.arrivalAt ? new Date(req.body.arrivalAt) : new Date()
  });
  const reloaded = await MovementLog.findByPk(m.id, { include });
  res.json({ success: true, data: { movement: reloaded } });
});

// ============================================
// RETURN — owner closes the trip
// Body: { distanceKm? }
// ============================================
export const returnMovement = asyncHandler(async (req, res) => {
  const m = await MovementLog.findByPk(req.params.id);
  if (!m) throw new NotFoundError('Movement not found');
  if (m.userId !== req.user.id && req.user.role !== 'Admin') {
    throw new ForbiddenError('Only the owner can close the movement');
  }
  if (!['InMovement', 'Arrived'].includes(m.status)) {
    throw new ConflictError(`Cannot return from a ${m.status} movement`);
  }
  const { distanceKm } = req.body || {};
  await m.update({
    status: 'Returned',
    returnAt: req.body?.returnAt ? new Date(req.body.returnAt) : new Date(),
    distanceKm: distanceKm != null ? Number(distanceKm) : m.distanceKm
  });
  const reloaded = await MovementLog.findByPk(m.id, { include });
  res.json({ success: true, data: { movement: reloaded } });
});

// ============================================
// CANCEL — owner or manager
// ============================================
export const cancelMovement = asyncHandler(async (req, res) => {
  const { reason } = req.body || {};
  const m = await MovementLog.findByPk(req.params.id);
  if (!m) throw new NotFoundError('Movement not found');
  const isOwner = m.userId === req.user.id;
  if (!isOwner && !isApprover(req.user)) {
    throw new ForbiddenError('Only the owner or a manager can cancel');
  }
  if (['Returned', 'Cancelled', 'Rejected'].includes(m.status)) {
    throw new ConflictError(`Cannot cancel a ${m.status} movement`);
  }
  await m.update({ status: 'Cancelled', cancelReason: reason || null });
  const reloaded = await MovementLog.findByPk(m.id, { include });
  res.json({ success: true, data: { movement: reloaded } });
});

// ============================================
// PING — push a single GPS coord while in movement
// Body: { lat, lng, ts? }
// ============================================
export const pingMovement = asyncHandler(async (req, res) => {
  const { lat, lng, ts } = req.body || {};
  if (lat == null || lng == null) throw new BadRequestError('lat and lng are required');
  const m = await MovementLog.findByPk(req.params.id);
  if (!m) throw new NotFoundError('Movement not found');
  if (m.userId !== req.user.id && req.user.role !== 'Admin') {
    throw new ForbiddenError('Only the owner can push GPS pings');
  }
  if (m.status !== 'InMovement') return res.json({ success: true, data: { movement: m } });
  const track = Array.isArray(m.gpsTrack) ? [...m.gpsTrack] : [];
  track.push({ lat: Number(lat), lng: Number(lng), ts: ts ? new Date(ts).toISOString() : new Date().toISOString() });
  await m.update({ gpsTrack: track });
  res.json({ success: true, data: { movement: m } });
});
