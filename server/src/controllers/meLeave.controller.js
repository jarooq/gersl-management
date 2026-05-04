// Self-service leave-request endpoints — used by the mobile app.
// Distinct from the admin-facing controllers in attendance.controller.js
// which are scoped to staffId. These use the authenticated User.id directly,
// so a user can submit a leave without a Staff record.

import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { LeaveRequest, User } from '../models/index.js';
import { createApprovalRow, syncApprovalDecision } from '../utils/approvalSync.js';

const isApprover = (user) => ['Admin', 'CEO', 'HR Manager', 'HR Officer', 'Manager'].includes(user?.role);

const computeDays = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(1, Math.round((e - s) / 86400000) + 1);
};

// GET /api/me/leave-requests
export const listMine = asyncHandler(async (req, res) => {
  const where = { userId: req.user.id };
  if (req.query.status) where.status = req.query.status;
  const rows = await LeaveRequest.findAll({
    where,
    include: [{ model: User, as: 'approver', attributes: ['id', 'fullName'] }],
    order: [['createdAt', 'DESC']]
  });
  res.json({ success: true, data: rows });
});

// GET /api/me/leave-requests/pending — for managers reviewing direct reports
export const listPending = asyncHandler(async (req, res) => {
  if (!isApprover(req.user)) return res.status(403).json({ success: false, message: 'forbidden' });
  const rows = await LeaveRequest.findAll({
    where: { status: 'Pending', userId: { [Op.ne]: null } },
    include: [{ model: User, as: 'requester', attributes: ['id', 'fullName', 'role', 'department'] }],
    order: [['createdAt', 'DESC']]
  });
  res.json({ success: true, data: rows });
});

// POST /api/me/leave-requests
export const createMine = asyncHandler(async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;
  if (!leaveType || !startDate || !endDate) {
    return res.status(400).json({ success: false, message: 'leaveType, startDate, endDate required' });
  }
  const row = await LeaveRequest.create({
    userId:    req.user.id,
    leaveType,
    startDate,
    endDate,
    daysCount: computeDays(startDate, endDate),
    reason:    reason || null,
    status:    'Pending'
  });
  await createApprovalRow({
    type: 'HR_LEAVE_REQUEST',
    entityType: 'leave_request',
    entityId: row.id,
    requestedBy: req.user.id,
    title: `${leaveType} leave — ${row.daysCount} day${row.daysCount === 1 ? '' : 's'}`,
    description: reason || `${startDate} → ${endDate}`,
  });
  res.status(201).json({ success: true, data: row });
});

// PATCH /api/me/leave-requests/:id/cancel — only the requester can cancel
export const cancelMine = asyncHandler(async (req, res) => {
  const row = await LeaveRequest.findByPk(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'not found' });
  if (row.userId !== req.user.id) return res.status(403).json({ success: false, message: 'forbidden' });
  if (row.status !== 'Pending') return res.status(409).json({ success: false, message: `already ${row.status}` });
  row.status = 'Cancelled';
  await row.save();
  await syncApprovalDecision({
    entityType: 'leave_request', entityId: row.id, status: 'Cancelled', decidedBy: req.user.id,
  });
  res.json({ success: true, data: row });
});

// PATCH /api/me/leave-requests/:id/approve  /  /reject  — manager action
export const decide = asyncHandler(async (req, res) => {
  if (!isApprover(req.user)) return res.status(403).json({ success: false, message: 'forbidden' });
  const action = req.params.action;
  if (!['approve', 'reject'].includes(action)) return res.status(400).json({ success: false, message: 'invalid action' });
  const row = await LeaveRequest.findByPk(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'not found' });
  if (row.status !== 'Pending') return res.status(409).json({ success: false, message: `already ${row.status}` });
  row.status = action === 'approve' ? 'Approved' : 'Rejected';
  row.approvedBy = req.user.id;
  row.approvalDate = new Date();
  if (action === 'reject') row.rejectionReason = req.body.reason || null;
  await row.save();
  await syncApprovalDecision({
    entityType: 'leave_request', entityId: row.id, status: row.status,
    decidedBy: req.user.id, notes: req.body.reason ?? null,
  });
  res.json({ success: true, data: row });
});
