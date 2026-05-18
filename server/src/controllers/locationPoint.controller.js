import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { LocationPoint } from '../models/index.js';

const isHR = (user) => ['Admin', 'CEO', 'HR Manager', 'HR Officer'].includes(user?.role);

// POST /api/locations/batch — mobile uploads batches of GPS points (lower overhead than per-point).
export const ingestBatch = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { points } = req.body;
  if (!Array.isArray(points) || points.length === 0) {
    return res.status(400).json({ success: false, message: 'points[] required' });
  }
  if (points.length > 500) {
    return res.status(413).json({ success: false, message: 'max 500 points per batch' });
  }
  const rows = points.map(p => ({
    userId,
    recordedAt: p.recordedAt || p.timestamp,
    latitude:   p.latitude  ?? p.lat,
    longitude:  p.longitude ?? p.lng,
    accuracyM:  p.accuracyM ?? p.accuracy,
    speedKmh:   p.speedKmh  ?? p.speed,
    source:     'mobile'
  }));
  const created = await LocationPoint.bulkCreate(rows, { validate: true });
  res.status(201).json({ success: true, count: created.length });
});

// GET /api/locations?userId=&from=&to=  — admin view of someone's track
export const listForUser = asyncHandler(async (req, res) => {
  const userId = parseInt(req.query.userId, 10) || req.user.id;
  if (userId !== req.user.id && !isHR(req.user)) return res.status(403).json({ success: false, message: 'forbidden' });
  const from   = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const to     = req.query.to   ? new Date(req.query.to)   : new Date();
  const rows = await LocationPoint.findAll({
    where: { userId, recordedAt: { [Op.between]: [from, to] } },
    order: [['recordedAt', 'ASC']],
    limit: 5000
  });
  res.json({ success: true, data: rows });
});

// GET /api/locations/live — latest point per user (admin live map).
// Returns the most recent LocationPoint per user within the configurable
// window, joined to the user's full name + role so the popup/table can
// render real labels instead of "User #1".
//
// Query: ?windowMin=N  (1..360, default 60). Default was 15 but most
// stationary staff never showed because the mobile tracker only pushes
// after 10m of movement; a 60-min window captures anyone who stepped
// out of their desk during the hour.
export const liveSnapshot = asyncHandler(async (req, res) => {
  const sequelize = LocationPoint.sequelize;
  const requested = parseInt(req.query.windowMin, 10);
  const windowMin = Number.isFinite(requested) && requested >= 1 && requested <= 360
    ? requested
    : 60;
  const rows = await sequelize.query(
    `SELECT DISTINCT ON (lp.user_id)
            lp.user_id,
            lp.latitude, lp.longitude,
            lp.accuracy_m, lp.speed_kmh, lp.recorded_at,
            u.full_name AS user_full_name,
            u.role      AS user_role,
            u.department AS user_department
       FROM location_points lp
       LEFT JOIN users u ON u.id = lp.user_id
      WHERE lp.recorded_at > NOW() - (CAST($1 AS INTEGER) || ' minutes')::INTERVAL
   ORDER BY lp.user_id, lp.recorded_at DESC`,
    { bind: [windowMin], type: sequelize.QueryTypes.SELECT }
  );
  res.json({ success: true, data: rows, windowMin });
});
