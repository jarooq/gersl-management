import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { LocationPoint } from '../models/index.js';

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
  const from   = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const to     = req.query.to   ? new Date(req.query.to)   : new Date();
  const rows = await LocationPoint.findAll({
    where: { userId, recordedAt: { [Op.between]: [from, to] } },
    order: [['recordedAt', 'ASC']],
    limit: 5000
  });
  res.json({ success: true, data: rows });
});

// GET /api/locations/live — latest point per user (admin live map)
export const liveSnapshot = asyncHandler(async (req, res) => {
  const sequelize = LocationPoint.sequelize;
  const rows = await sequelize.query(
    `SELECT DISTINCT ON (user_id) user_id, latitude, longitude, accuracy_m, speed_kmh, recorded_at
     FROM location_points
     WHERE recorded_at > NOW() - INTERVAL '15 minutes'
     ORDER BY user_id, recorded_at DESC`,
    { type: sequelize.QueryTypes.SELECT }
  );
  res.json({ success: true, data: rows });
});
