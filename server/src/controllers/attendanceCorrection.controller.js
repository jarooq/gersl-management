import {
  AttendanceCorrection,
  Attendance,
  User,
  MovementLog,
  Vehicle
} from '../models/index.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';
import {
  asyncHandler,
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError
} from '../middleware/error.middleware.js';

const PATCHABLE_FIELDS = ['checkInTime', 'checkOutTime', 'status', 'leaveType', 'location', 'notes', 'newRecord'];
const APPROVE_ROLES = ['Admin', 'CEO', 'HR Manager', 'HR Officer'];

const include = [
  { model: Attendance, as: 'attendance' },
  { model: User, as: 'requester', attributes: ['id', 'fullName', 'role'] },
  { model: User, as: 'reviewer',  attributes: ['id', 'fullName', 'role'] }
];

const isApprover = (u) => APPROVE_ROLES.includes(u?.role);

// ============================================
// LIST
// ============================================
export const listCorrections = asyncHandler(async (req, res) => {
  const { scope = 'mine', status, staffId } = req.query;
  const where = {};
  if (status) where.status = status;
  if (staffId) where.staffId = parseInt(staffId, 10);

  if (scope === 'mine') where.requestedBy = req.user.id;
  if (scope === 'pending') {
    if (!isApprover(req.user)) throw new ForbiddenError('Only HR can view pending corrections');
    where.status = 'Pending';
  }
  if (scope === 'all' && !isApprover(req.user) && req.user.role !== 'Admin') {
    throw new ForbiddenError('Only HR can list all corrections');
  }

  const rows = await AttendanceCorrection.findAll({
    where,
    include,
    order: [['createdAt', 'DESC']]
  });
  res.json({ success: true, data: { corrections: rows } });
});

export const getCorrection = asyncHandler(async (req, res) => {
  const c = await AttendanceCorrection.findByPk(req.params.id, { include });
  if (!c) throw new NotFoundError('Correction not found');
  res.json({ success: true, data: { correction: c } });
});

// ============================================
// REQUEST a correction
// Body: { attendanceId?, staffId, attendanceDate, field, newValue, reason }
// attendanceId is null for "create missing day" (field='newRecord').
// ============================================
export const requestCorrection = asyncHandler(async (req, res) => {
  const { attendanceId, staffId, attendanceDate, field, newValue, reason } = req.body || {};
  if (!staffId || !attendanceDate || !field || !reason) {
    throw new BadRequestError('staffId, attendanceDate, field, reason are required');
  }
  if (!PATCHABLE_FIELDS.includes(field)) {
    throw new BadRequestError(`field must be one of: ${PATCHABLE_FIELDS.join(', ')}`);
  }

  // Capture the current value so the audit log shows before/after.
  let oldValue = null;
  if (attendanceId) {
    const att = await Attendance.findByPk(attendanceId);
    if (!att) throw new NotFoundError('Attendance row not found');
    if (field !== 'newRecord') {
      const v = att[field];
      oldValue = v == null ? null : String(v);
    }
  }

  const corr = await AttendanceCorrection.create({
    attendanceId: attendanceId || null,
    staffId,
    attendanceDate,
    field,
    oldValue,
    newValue: newValue == null ? null : String(newValue),
    reason,
    status: 'Pending',
    requestedBy: req.user.id
  });
  const reloaded = await AttendanceCorrection.findByPk(corr.id, { include });
  res.status(201).json({ success: true, data: { correction: reloaded } });
});

// ============================================
// APPROVE — applies the patch (or creates a new attendance row)
// ============================================
export const approveCorrection = asyncHandler(async (req, res) => {
  if (!isApprover(req.user)) throw new ForbiddenError('Your role cannot approve corrections');

  const t = await sequelize.transaction();
  try {
    const corr = await AttendanceCorrection.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!corr) throw new NotFoundError('Correction not found');
    if (corr.status !== 'Pending') throw new ConflictError(`Cannot approve a ${corr.status} correction`);
    if (corr.requestedBy === req.user.id && req.user.role !== 'Admin') {
      throw new ForbiddenError('Cannot approve your own correction');
    }

    if (corr.field === 'newRecord') {
      // Create a new attendance row for the missing day. newValue carries
      // a JSON blob with at minimum { status }; check_in_time / out etc are
      // set from optional req.body.attendancePayload patch.
      let payload = {};
      try { payload = corr.newValue ? JSON.parse(corr.newValue) : {}; } catch (_) {}
      const att = await Attendance.create({
        staffId: corr.staffId,
        attendanceDate: corr.attendanceDate,
        status: payload.status || 'Present',
        checkInTime: payload.checkInTime || null,
        checkOutTime: payload.checkOutTime || null,
        leaveType: payload.leaveType || null,
        location: payload.location || null,
        notes: payload.notes ? `${payload.notes} (HR-created via correction #${corr.id})` : `HR-created via correction #${corr.id}`,
        approvedBy: req.user.id
      }, { transaction: t });
      await corr.update({
        status: 'Approved',
        attendanceId: att.id,
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      }, { transaction: t });
    } else {
      if (!corr.attendanceId) throw new BadRequestError('Field-level corrections require attendanceId');
      const att = await Attendance.findByPk(corr.attendanceId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!att) throw new NotFoundError('Underlying attendance row not found');
      const patch = {};
      patch[corr.field] = corr.newValue;
      patch.notes = att.notes
        ? `${att.notes}\n[${new Date().toISOString().slice(0, 10)} correction #${corr.id}] ${corr.reason}`
        : `[correction #${corr.id}] ${corr.reason}`;
      patch.approvedBy = req.user.id;
      await att.update(patch, { transaction: t });
      await corr.update({
        status: 'Approved',
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      }, { transaction: t });
    }

    await t.commit();
    const reloaded = await AttendanceCorrection.findByPk(corr.id, { include });
    res.json({ success: true, data: { correction: reloaded } });
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
});

// ============================================
// REJECT
// ============================================
export const rejectCorrection = asyncHandler(async (req, res) => {
  if (!isApprover(req.user)) throw new ForbiddenError('Your role cannot reject corrections');
  const { reason } = req.body || {};
  if (!reason) throw new BadRequestError('reason is required');
  const corr = await AttendanceCorrection.findByPk(req.params.id);
  if (!corr) throw new NotFoundError('Correction not found');
  if (corr.status !== 'Pending') throw new ConflictError(`Cannot reject a ${corr.status} correction`);
  await corr.update({
    status: 'Rejected',
    reviewedBy: req.user.id,
    reviewedAt: new Date(),
    rejectionReason: reason
  });
  const reloaded = await AttendanceCorrection.findByPk(corr.id, { include });
  res.json({ success: true, data: { correction: reloaded } });
});

// ============================================
// CANCEL — requester only
// ============================================
export const cancelCorrection = asyncHandler(async (req, res) => {
  const corr = await AttendanceCorrection.findByPk(req.params.id);
  if (!corr) throw new NotFoundError('Correction not found');
  if (corr.requestedBy !== req.user.id && req.user.role !== 'Admin') {
    throw new ForbiddenError('Only the requester or Admin can cancel');
  }
  if (corr.status !== 'Pending') throw new ConflictError(`Cannot cancel a ${corr.status} correction`);
  await corr.update({ status: 'Cancelled' });
  const reloaded = await AttendanceCorrection.findByPk(corr.id, { include });
  res.json({ success: true, data: { correction: reloaded } });
});

// ============================================
// REGISTER REPORTS — attendance + movement
// ============================================
const escapeCsv = (s) => {
  if (s == null) return '';
  const str = String(s);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

export const attendanceRegister = asyncHandler(async (req, res) => {
  const { from, to, staffId, format = 'json' } = req.query;
  if (!from || !to) throw new BadRequestError('from and to are required (YYYY-MM-DD)');
  const where = {
    attendanceDate: { [Op.gte]: from, [Op.lte]: to }
  };
  if (staffId) where.staffId = parseInt(staffId, 10);

  const rows = await Attendance.findAll({
    where,
    order: [['attendanceDate', 'ASC'], ['staffId', 'ASC']]
  });

  if (format === 'csv') {
    const header = ['Date', 'StaffId', 'Status', 'CheckIn', 'CheckOut', 'WorkHours', 'Overtime', 'Location', 'LeaveType', 'Notes'];
    const lines = [header.join(',')];
    for (const r of rows) {
      lines.push([
        r.attendanceDate, r.staffId, r.status,
        r.checkInTime || '', r.checkOutTime || '',
        r.workHours ?? '', r.overtimeHours ?? '',
        r.location || '', r.leaveType || '', r.notes || ''
      ].map(escapeCsv).join(','));
    }
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="attendance-${from}-${to}.csv"`);
    return res.send(lines.join('\n'));
  }

  res.json({
    success: true,
    data: {
      period: { from, to },
      rows
    }
  });
});

export const movementRegister = asyncHandler(async (req, res) => {
  const { from, to, userId, format = 'json' } = req.query;
  if (!from || !to) throw new BadRequestError('from and to are required (YYYY-MM-DD)');
  const where = {
    [Op.or]: [
      { departureAt: { [Op.gte]: from, [Op.lte]: to } },
      { plannedDepartureAt: { [Op.gte]: from, [Op.lte]: to } }
    ]
  };
  if (userId) where.userId = parseInt(userId, 10);

  const rows = await MovementLog.findAll({
    where,
    include: [
      { model: User, as: 'staff', attributes: ['id', 'fullName', 'role'] },
      { model: Vehicle, as: 'vehicle', attributes: ['id', 'type', 'plateNo'] }
    ],
    order: [['departureAt', 'ASC']]
  });

  if (format === 'csv') {
    const header = ['Staff', 'From', 'To', 'Purpose', 'Vehicle', 'Status', 'Departure', 'Arrival', 'Return', 'DistanceKm'];
    const lines = [header.join(',')];
    for (const r of rows) {
      lines.push([
        r.staff?.fullName || `#${r.userId}`,
        r.fromLocation, r.toLocation,
        r.purpose || '',
        r.vehicle ? `${r.vehicle.type}${r.vehicle.plateNo ? ` ${r.vehicle.plateNo}` : ''}` : '',
        r.status,
        r.departureAt ? new Date(r.departureAt).toISOString() : '',
        r.arrivalAt   ? new Date(r.arrivalAt).toISOString()   : '',
        r.returnAt    ? new Date(r.returnAt).toISOString()    : '',
        r.distanceKm ?? ''
      ].map(escapeCsv).join(','));
    }
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="movements-${from}-${to}.csv"`);
    return res.send(lines.join('\n'));
  }

  res.json({
    success: true,
    data: {
      period: { from, to },
      rows
    }
  });
});
