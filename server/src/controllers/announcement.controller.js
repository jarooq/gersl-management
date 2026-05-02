import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { Announcement, User } from '../models/index.js';

const isPublisher = (user) => ['Admin', 'CEO', 'HR Manager', 'Programme Manager'].includes(user?.role);

export const list = asyncHandler(async (req, res) => {
  const now = new Date();
  const where = {
    publishedAt: { [Op.lte]: now },
    [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: now } }]
  };
  const rows = await Announcement.findAll({
    where,
    include: [{ model: User, as: 'creator', attributes: ['id', 'fullName'] }],
    order: [['publishedAt', 'DESC']]
  });
  res.json({ success: true, data: rows });
});

export const create = asyncHandler(async (req, res) => {
  if (!isPublisher(req.user)) return res.status(403).json({ success: false, message: 'forbidden' });
  const row = await Announcement.create({ ...req.body, createdBy: req.user.id });
  res.status(201).json({ success: true, data: row });
});

export const update = asyncHandler(async (req, res) => {
  if (!isPublisher(req.user)) return res.status(403).json({ success: false, message: 'forbidden' });
  const row = await Announcement.findByPk(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'not found' });
  await row.update(req.body);
  res.json({ success: true, data: row });
});

export const remove = asyncHandler(async (req, res) => {
  if (!isPublisher(req.user)) return res.status(403).json({ success: false, message: 'forbidden' });
  const row = await Announcement.findByPk(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'not found' });
  await row.destroy();
  res.json({ success: true });
});
