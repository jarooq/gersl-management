import { AttendancePunch, User } from '../models/index.js';
import { Op } from 'sequelize';
import {
  asyncHandler,
  BadRequestError,
  NotFoundError
} from '../middleware/error.middleware.js';

const VALID_TYPES = ['In', 'Out', 'BreakIn', 'BreakOut'];

// Optional org-wide geofence config from env. If not set, geofence_match is null.
const ORG_LAT  = process.env.ORG_GEOFENCE_LAT  ? Number(process.env.ORG_GEOFENCE_LAT)  : null;
const ORG_LNG  = process.env.ORG_GEOFENCE_LNG  ? Number(process.env.ORG_GEOFENCE_LNG)  : null;
const ORG_RAD  = process.env.ORG_GEOFENCE_RADIUS_M ? Number(process.env.ORG_GEOFENCE_RADIUS_M) : 200;

const haversineMeters = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

// ============================================
// RECORD PUNCH
// Body: { punchType, latitude?, longitude?, accuracyM?, selfieUrl?, deviceId?, notes?, occurredAt? }
// ============================================
export const recordPunch = asyncHandler(async (req, res) => {
  const {
    punchType, latitude, longitude, accuracyM,
    selfieUrl, deviceId, notes, occurredAt
  } = req.body || {};
  if (!VALID_TYPES.includes(punchType)) {
    throw new BadRequestError(`punchType must be one of: ${VALID_TYPES.join(', ')}`);
  }

  // Geofence check (best-effort; null if either side missing).
  let geofenceMatch = false;
  if (ORG_LAT != null && ORG_LNG != null && latitude != null && longitude != null) {
    const dist = haversineMeters(ORG_LAT, ORG_LNG, Number(latitude), Number(longitude));
    geofenceMatch = dist <= ORG_RAD;
  }

  const punch = await AttendancePunch.create({
    userId: req.user.id,
    punchType,
    occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
    latitude: latitude != null ? Number(latitude) : null,
    longitude: longitude != null ? Number(longitude) : null,
    accuracyM: accuracyM != null ? Number(accuracyM) : null,
    selfieUrl: selfieUrl || null,
    deviceId: deviceId || null,
    geofenceMatch,
    source: 'mobile',
    notes: notes || null
  });
  res.status(201).json({ success: true, data: { punch, geofenceMatch } });
});

// ============================================
// LIST own punches (default last 7 days)
// ============================================
export const listMyPunches = asyncHandler(async (req, res) => {
  const { from, to, limit = 200 } = req.query;
  const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to) : new Date();
  const rows = await AttendancePunch.findAll({
    where: { userId: req.user.id, occurredAt: { [Op.between]: [fromDate, toDate] } },
    order: [['occurredAt', 'DESC']],
    limit: Math.min(parseInt(limit, 10) || 200, 1000)
  });
  res.json({ success: true, data: { punches: rows, period: { from: fromDate.toISOString(), to: toDate.toISOString() } } });
});

// ============================================
// TODAY status — last punch + In/Out summary
// ============================================
export const todayStatus = asyncHandler(async (req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  const punches = await AttendancePunch.findAll({
    where: { userId: req.user.id, occurredAt: { [Op.between]: [start, end] } },
    order: [['occurredAt', 'ASC']]
  });
  const last = punches[punches.length - 1];
  const isClockedIn = last && (last.punchType === 'In' || last.punchType === 'BreakIn');
  res.json({
    success: true,
    data: {
      date: start.toISOString().slice(0, 10),
      isClockedIn: !!isClockedIn,
      lastPunch: last || null,
      punches
    }
  });
});

// ============================================
// HR view: punches by user (HR roles)
// ============================================
export const listPunchesByUser = asyncHandler(async (req, res) => {
  const { userId, from, to } = req.query;
  if (!userId) throw new BadRequestError('userId is required');
  const HR_ROLES = ['Admin', 'CEO', 'HR Manager', 'HR Officer'];
  if (!HR_ROLES.includes(req.user.role)) {
    throw new BadRequestError('Only HR can list other users\' punches');
  }
  const where = { userId: parseInt(userId, 10) };
  if (from || to) {
    where.occurredAt = {};
    if (from) where.occurredAt[Op.gte] = new Date(from);
    if (to)   where.occurredAt[Op.lte] = new Date(to);
  }
  const rows = await AttendancePunch.findAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['id', 'fullName'] }],
    order: [['occurredAt', 'DESC']],
    limit: 500
  });
  res.json({ success: true, data: { punches: rows } });
});
