import asyncHandler from 'express-async-handler';
import { SalaryAdvance, User } from '../models/index.js';
import { createApprovalRow, syncApprovalDecision } from '../utils/approvalSync.js';

const isAdmin = (user) => ['Admin', 'CEO', 'HR Manager', 'Finance Manager'].includes(user?.role);

export const list = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.status) where.status = req.query.status;
  // Non-admins only see their own.
  if (!isAdmin(req.user)) where.userId = req.user.id;
  else if (req.query.userId) where.userId = parseInt(req.query.userId, 10);

  const rows = await SalaryAdvance.findAll({
    where,
    include: [
      { model: User, as: 'user',    attributes: ['id', 'fullName', 'email'] },
      { model: User, as: 'decider', attributes: ['id', 'fullName'] }
    ],
    order: [['createdAt', 'DESC']]
  });
  res.json({ success: true, data: rows });
});

export const create = asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'amount > 0 required' });
  const row = await SalaryAdvance.create({ userId: req.user.id, amount, reason, status: 'Pending' });
  await createApprovalRow({
    type: 'HR_SALARY_ADVANCE',
    entityType: 'salary_advance',
    entityId: row.id,
    requestedBy: req.user.id,
    amount: Number(amount),
    title: `Salary advance — LKR ${amount}`,
    description: reason || null,
  });
  res.status(201).json({ success: true, data: row });
});

export const decide = asyncHandler(async (req, res) => {
  const action = req.params.action; // approve | reject
  if (!['approve', 'reject'].includes(action)) return res.status(400).json({ success: false, message: 'invalid action' });
  const row = await SalaryAdvance.findByPk(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'not found' });
  if (row.status !== 'Pending') return res.status(409).json({ success: false, message: `already ${row.status}` });
  row.status = action === 'approve' ? 'Approved' : 'Rejected';
  row.decidedBy = req.user.id;
  row.decidedAt = new Date();
  row.decisionNotes = req.body.notes || null;
  await row.save();
  await syncApprovalDecision({
    entityType: 'salary_advance', entityId: row.id, status: row.status,
    decidedBy: req.user.id, notes: req.body.notes ?? null,
  });
  res.json({ success: true, data: row });
});

export const cancel = asyncHandler(async (req, res) => {
  const row = await SalaryAdvance.findByPk(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'not found' });
  if (row.userId !== req.user.id && !isAdmin(req.user)) return res.status(403).json({ success: false, message: 'forbidden' });
  if (row.status !== 'Pending') return res.status(409).json({ success: false, message: `cannot cancel ${row.status}` });
  row.status = 'Cancelled';
  await row.save();
  await syncApprovalDecision({
    entityType: 'salary_advance', entityId: row.id, status: 'Cancelled', decidedBy: req.user.id,
  });
  res.json({ success: true, data: row });
});
