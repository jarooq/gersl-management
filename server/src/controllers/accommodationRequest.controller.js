// Accommodation requests — staff book lodging for field trips; HR/Ops approve.
import asyncHandler from 'express-async-handler';
import { AccommodationRequest, User } from '../models/index.js';
import { createApprovalRow, syncApprovalDecision } from '../utils/approvalSync.js';

const isApprover = (u) =>
  ['Admin', 'CEO', 'HR Manager', 'HR Officer', 'Programme Manager'].includes(u?.role);

const VALID_STATUSES = ['Pending', 'Approved', 'Rejected', 'Booked', 'Completed', 'Cancelled'];

export const list = asyncHandler(async (req, res) => {
  const { status, mine } = req.query;
  const where = {};
  if (status && VALID_STATUSES.includes(status)) where.status = status;
  if (mine === 'true' || !isApprover(req.user)) where.userId = req.user.id;
  const rows = await AccommodationRequest.findAll({
    where,
    include: [
      { model: User, as: 'user',    attributes: ['id', 'fullName', 'role'] },
      { model: User, as: 'decider', attributes: ['id', 'fullName'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: 500,
  });
  res.json({ success: true, data: rows });
});

export const stats = asyncHandler(async (req, res) => {
  const all = await AccommodationRequest.findAll({ attributes: ['status'] });
  const counts = { pending: 0, approved: 0, booked: 0, completed: 0, total: all.length };
  for (const r of all) {
    if (r.status === 'Pending')   counts.pending += 1;
    if (r.status === 'Approved')  counts.approved += 1;
    if (r.status === 'Booked')    counts.booked += 1;
    if (r.status === 'Completed') counts.completed += 1;
  }
  res.json({ success: true, data: counts });
});

export const create = asyncHandler(async (req, res) => {
  const { location, checkInDate, checkOutDate, purpose, estimatedCost, guestCount } = req.body;
  if (!location || !checkInDate || !checkOutDate || !purpose) {
    return res.status(400).json({ success: false, message: 'location, checkInDate, checkOutDate, purpose required' });
  }
  const row = await AccommodationRequest.create({
    userId: req.user.id,
    location, checkInDate, checkOutDate, purpose,
    estimatedCost: estimatedCost || null,
    guestCount: guestCount || 1,
    status: 'Pending',
  });
  await createApprovalRow({
    type: 'HR_ACCOMMODATION_REQUEST',
    entityType: 'accommodation_request',
    entityId: row.id,
    requestedBy: req.user.id,
    amount: estimatedCost ? Number(estimatedCost) : null,
    title: `Accommodation — ${location}`,
    description: `${checkInDate} → ${checkOutDate}, ${guestCount || 1} guest${(guestCount || 1) === 1 ? '' : 's'} · ${purpose}`,
  });
  res.status(201).json({ success: true, data: row });
});

export const decide = asyncHandler(async (req, res) => {
  const action = req.params.action;
  const STATUS_MAP = {
    approve: 'Approved', reject: 'Rejected',
    book: 'Booked', complete: 'Completed', cancel: 'Cancelled',
  };
  if (!STATUS_MAP[action]) return res.status(400).json({ success: false, message: 'invalid action' });
  const row = await AccommodationRequest.findByPk(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'not found' });
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
  if (action === 'approve' || action === 'reject' || action === 'cancel') {
    await syncApprovalDecision({
      entityType: 'accommodation_request',
      entityId: row.id,
      status: row.status,
      decidedBy: req.user.id,
      notes: req.body?.notes ?? null,
    });
  }
  res.json({ success: true, data: row });
});
