// Manual trigger + read endpoints for the movement clusterer.
// The daily cron runs automatically; these are for backfill, debugging,
// and serving the admin movement-segments view.

import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { MovementSegment, User } from '../models/index.js';
import { clusterAllUsersForDate, clusterDay } from '../services/movementClusterer.js';

const isAdmin = (u) => ['Admin', 'CEO', 'HR Manager', 'Programme Manager'].includes(u?.role);

// POST /api/locations/cluster
// Body: { date: 'YYYY-MM-DD' (default = yesterday), userId? }
export const runClusterer = asyncHandler(async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ success: false, message: 'forbidden' });

  const date = req.body?.date || (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  if (req.body?.userId) {
    const segs = await clusterDay({ userId: Number(req.body.userId), date });
    return res.json({ success: true, date, userId: Number(req.body.userId), segments: segs.length });
  }
  const summary = await clusterAllUsersForDate(date);
  res.json({ success: true, date, summary });
});

// GET /api/movement-segments?userId=&from=&to=
export const listSegments = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.userId) where.userId = Number(req.query.userId);
  else if (!isAdmin(req.user)) where.userId = req.user.id;

  if (req.query.from || req.query.to) {
    where.date = {};
    if (req.query.from) where.date[Op.gte] = req.query.from;
    if (req.query.to)   where.date[Op.lte] = req.query.to;
  }

  const rows = await MovementSegment.findAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['id', 'fullName'] }],
    order: [['startedAt', 'ASC']],
    limit: 1000
  });
  res.json({ success: true, data: rows });
});
