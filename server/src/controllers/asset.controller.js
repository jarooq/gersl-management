// Asset register — assignable equipment / inventory tracked separately from
// FixedAsset (which is the accounting/depreciation register). This is the
// HR / Operations view: "who has the laptop right now?"

import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { Asset } from '../models/index.js';

const ALLOWED_STATUSES = ['Active', 'Assigned', 'Under Repair', 'Disposed'];

const isHR = (u) =>
  ['Admin', 'CEO', 'HR Manager', 'HR Officer', 'Finance Manager'].includes(u?.role);

// GET /api/assets
export const list = asyncHandler(async (req, res) => {
  const { status, search, limit = 200 } = req.query;
  const where = {};
  if (status && ALLOWED_STATUSES.includes(status)) where.status = status;
  if (search) {
    where[Op.or] = [
      { assetTag:  { [Op.iLike]: `%${search}%` } },
      { assetName: { [Op.iLike]: `%${search}%` } },
      { category:  { [Op.iLike]: `%${search}%` } },
      { assignedTo:{ [Op.iLike]: `%${search}%` } },
    ];
  }
  const rows = await Asset.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: Math.min(parseInt(limit, 10) || 200, 500),
  });
  res.json({ success: true, data: rows });
});

// GET /api/assets/stats
export const stats = asyncHandler(async (req, res) => {
  const all = await Asset.findAll({ attributes: ['id', 'status'] });
  const counts = { total: all.length, active: 0, assigned: 0, underRepair: 0, disposed: 0 };
  for (const a of all) {
    switch (a.status) {
      case 'Active':       counts.active += 1; break;
      case 'Assigned':     counts.assigned += 1; break;
      case 'Under Repair': counts.underRepair += 1; break;
      case 'Disposed':     counts.disposed += 1; break;
    }
  }
  res.json({ success: true, data: counts });
});

// GET /api/assets/:id
export const getById = asyncHandler(async (req, res) => {
  const row = await Asset.findByPk(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'not found' });
  res.json({ success: true, data: row });
});

// POST /api/assets
export const create = asyncHandler(async (req, res) => {
  if (!isHR(req.user)) return res.status(403).json({ success: false, message: 'forbidden' });
  const {
    assetTag, assetName, category, purchaseDate, purchaseCost, vendorId,
    location, warrantyExpiry, status = 'Active',
  } = req.body;
  if (!assetTag || !assetName || !category) {
    return res.status(400).json({ success: false, message: 'assetTag, assetName, category required' });
  }
  if (!ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: `unknown status: ${status}` });
  }
  const row = await Asset.create({
    assetTag, assetName, category,
    purchaseDate, purchaseCost, vendorId,
    location, warrantyExpiry, status,
    createdBy: req.user.id,
  });
  res.status(201).json({ success: true, data: row });
});

// PATCH /api/assets/:id
export const update = asyncHandler(async (req, res) => {
  if (!isHR(req.user)) return res.status(403).json({ success: false, message: 'forbidden' });
  const row = await Asset.findByPk(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'not found' });
  const editable = ['assetName', 'category', 'purchaseDate', 'purchaseCost', 'vendorId',
    'location', 'warrantyExpiry', 'status', 'assignedTo', 'assignmentDate', 'assignmentNotes'];
  for (const k of editable) {
    if (k in req.body) row[k] = req.body[k];
  }
  if (req.body.status && !ALLOWED_STATUSES.includes(req.body.status)) {
    return res.status(400).json({ success: false, message: `unknown status: ${req.body.status}` });
  }
  await row.save();
  res.json({ success: true, data: row });
});

// PATCH /api/assets/:id/assign  body: { assignedTo, assignmentDate?, assignmentNotes? }
export const assign = asyncHandler(async (req, res) => {
  if (!isHR(req.user)) return res.status(403).json({ success: false, message: 'forbidden' });
  const row = await Asset.findByPk(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'not found' });
  const { assignedTo, assignmentDate, assignmentNotes } = req.body;
  if (!assignedTo) return res.status(400).json({ success: false, message: 'assignedTo required' });
  row.assignedTo = assignedTo;
  row.assignmentDate = assignmentDate || new Date();
  row.assignmentNotes = assignmentNotes || null;
  row.status = 'Assigned';
  await row.save();
  res.json({ success: true, data: row });
});

// PATCH /api/assets/:id/return  — clears assignment, status -> Active
export const returnAsset = asyncHandler(async (req, res) => {
  if (!isHR(req.user)) return res.status(403).json({ success: false, message: 'forbidden' });
  const row = await Asset.findByPk(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'not found' });
  row.assignedTo = null;
  row.assignmentDate = null;
  row.assignmentNotes = null;
  row.status = 'Active';
  await row.save();
  res.json({ success: true, data: row });
});

// DELETE /api/assets/:id
export const remove = asyncHandler(async (req, res) => {
  if (!isHR(req.user)) return res.status(403).json({ success: false, message: 'forbidden' });
  const row = await Asset.findByPk(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'not found' });
  await row.destroy();
  res.json({ success: true });
});
