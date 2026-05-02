import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { Shift, User } from '../models/index.js';

const isManager = (user) => ['Admin', 'CEO', 'HR Manager', 'HR Officer', 'Programme Manager'].includes(user?.role);

export const list = asyncHandler(async (req, res) => {
  const where = {};
  if (!isManager(req.user)) where.userId = req.user.id;
  else if (req.query.userId) where.userId = parseInt(req.query.userId, 10);
  if (req.query.from || req.query.to) {
    where.date = {};
    if (req.query.from) where.date[Op.gte] = req.query.from;
    if (req.query.to)   where.date[Op.lte] = req.query.to;
  }
  const rows = await Shift.findAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['id', 'fullName'] }],
    order: [['date', 'ASC'], ['startTime', 'ASC']]
  });
  res.json({ success: true, data: rows });
});

export const create = asyncHandler(async (req, res) => {
  if (!isManager(req.user)) return res.status(403).json({ success: false, message: 'forbidden' });
  const row = await Shift.create({ ...req.body, createdBy: req.user.id });
  res.status(201).json({ success: true, data: row });
});

export const update = asyncHandler(async (req, res) => {
  const row = await Shift.findByPk(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'not found' });
  if (!isManager(req.user)) return res.status(403).json({ success: false, message: 'forbidden' });
  await row.update(req.body);
  res.json({ success: true, data: row });
});

export const remove = asyncHandler(async (req, res) => {
  if (!isManager(req.user)) return res.status(403).json({ success: false, message: 'forbidden' });
  const row = await Shift.findByPk(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'not found' });
  await row.destroy();
  res.json({ success: true });
});
