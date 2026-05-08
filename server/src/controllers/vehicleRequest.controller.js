// Vehicle requests — staff book org vehicles for trips/pickups; HR/Ops approve.
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { VehicleRequest, User, Vehicle } from '../models/index.js';
import { createApprovalRow, syncApprovalDecision } from '../utils/approvalSync.js';

const isApprover = (u) =>
  ['Admin', 'CEO', 'HR Manager', 'HR Officer', 'Programme Manager'].includes(u?.role);

const VALID_STATUSES = ['Pending', 'Approved', 'Rejected', 'In Use', 'Completed', 'Cancelled'];

// GET /api/vehicle-requests
export const list = asyncHandler(async (req, res) => {
  const { status, mine } = req.query;
  const where = {};
  if (status && VALID_STATUSES.includes(status)) where.status = status;
  if (mine === 'true' || !isApprover(req.user)) where.userId = req.user.id;
  const rows = await VehicleRequest.findAll({
    where,
    include: [
      { model: User,    as: 'user',    attributes: ['id', 'fullName', 'role'] },
      { model: User,    as: 'decider', attributes: ['id', 'fullName'] },
      { model: Vehicle, as: 'vehicle', attributes: ['id', 'plateNo', 'type'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: 500,
  });
  res.json({ success: true, data: rows });
});

// GET /api/vehicle-requests/stats
export const stats = asyncHandler(async (req, res) => {
  const all = await VehicleRequest.findAll({ attributes: ['status'] });
  const counts = { pending: 0, approved: 0, inUse: 0, completed: 0, total: all.length };
  for (const r of all) {
    if (r.status === 'Pending')   counts.pending += 1;
    if (r.status === 'Approved')  counts.approved += 1;
    if (r.status === 'In Use')    counts.inUse += 1;
    if (r.status === 'Completed') counts.completed += 1;
  }
  res.json({ success: true, data: counts });
});

// POST /api/vehicle-requests
export const create = asyncHandler(async (req, res) => {
  const { vehicleId, purpose, startDate, endDate, pickupLocation, dropoffLocation, passengerCount } = req.body;
  if (!purpose || !startDate || !endDate) {
    return res.status(400).json({ success: false, message: 'purpose, startDate, endDate required' });
  }
  const row = await VehicleRequest.create({
    userId: req.user.id,
    vehicleId: vehicleId || null,
    purpose,
    startDate,
    endDate,
    pickupLocation: pickupLocation || null,
    dropoffLocation: dropoffLocation || null,
    passengerCount: passengerCount || 1,
    status: 'Pending',
  });
  await createApprovalRow({
    type: 'HR_VEHICLE_REQUEST',
    entityType: 'vehicle_request',
    entityId: row.id,
    requestedBy: req.user.id,
    title: `Vehicle request — ${purpose}`,
    description: `${pickupLocation || '—'} → ${dropoffLocation || '—'}, ${new Date(startDate).toLocaleString()} → ${new Date(endDate).toLocaleString()}`,
  });
  res.status(201).json({ success: true, data: row });
});

// PATCH /api/vehicle-requests/:id/:action(approve|reject|in-use|complete|cancel)
export const decide = asyncHandler(async (req, res) => {
  const action = req.params.action;
  const STATUS_MAP = {
    approve: 'Approved', reject: 'Rejected',
    'in-use': 'In Use', complete: 'Completed', cancel: 'Cancelled',
  };
  if (!STATUS_MAP[action]) return res.status(400).json({ success: false, message: 'invalid action' });
  const row = await VehicleRequest.findByPk(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'not found' });
  // Cancel: only the requester (or approver) can cancel a pending request
  if (action === 'cancel') {
    if (row.userId !== req.user.id && !isApprover(req.user)) {
      return res.status(403).json({ success: false, message: 'forbidden' });
    }
  } else if (!isApprover(req.user)) {
    return res.status(403).json({ success: false, message: 'forbidden' });
  }
  row.status = STATUS_MAP[action];
  row.decidedBy = req.user.id;
  row.decidedAt = new Date();
  if (req.body?.notes) row.decisionNotes = req.body.notes;
  await row.save();
  // Sync decisive transitions to the central Approval row.
  if (action === 'approve' || action === 'reject' || action === 'cancel') {
    await syncApprovalDecision({
      entityType: 'vehicle_request',
      entityId: row.id,
      status: row.status,
      decidedBy: req.user.id,
      notes: req.body?.notes ?? null,
    });
  }
  res.json({ success: true, data: row });
});
