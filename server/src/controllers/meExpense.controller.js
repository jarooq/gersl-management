// Self-service expense claims for the mobile app. Distinct from /api/finance,
// which requires FINANCE_CREATE permission and is for accounting staff.
// Anyone authenticated can submit a claim (status=Pending). Approval still
// goes through Finance / HR via /api/finance for status changes.

import asyncHandler from 'express-async-handler';
import { Expense, User } from '../models/index.js';
import { createApprovalRow, syncApprovalDecision } from '../utils/approvalSync.js';

const isApprover = (user) => ['Admin', 'CEO', 'Finance Manager', 'HR Manager'].includes(user?.role);

// Categories accepted from mobile (loose enum — backend stores as STRING).
const _allowedCategories = new Set(['Travel', 'Meal', 'Communication', 'Stationery', 'Fuel', 'Other']);

// GET /api/me/expenses
export const listMine = asyncHandler(async (req, res) => {
  const where = { submittedBy: req.user.id };
  if (req.query.status) where.status = req.query.status;
  const rows = await Expense.findAll({
    where,
    order: [['date', 'DESC']]
  });
  res.json({ success: true, data: rows });
});

// GET /api/me/expenses/pending — manager queue (others' pending claims)
export const listPending = asyncHandler(async (req, res) => {
  if (!isApprover(req.user)) return res.status(403).json({ success: false, message: 'forbidden' });
  const rows = await Expense.findAll({
    where: { status: 'Pending' },
    include: [{ model: User, as: 'submitter', attributes: ['id', 'fullName', 'role'] }],
    order: [['date', 'DESC']]
  });
  res.json({ success: true, data: rows });
});

// GET /api/me/expenses/admin — Finance/HR view of every claim (any status, any user).
// Used by the web Expenses admin page.
export const listAll = asyncHandler(async (req, res) => {
  if (!isApprover(req.user)) return res.status(403).json({ success: false, message: 'forbidden' });
  const where = {};
  if (req.query.status) where.status = req.query.status;
  const rows = await Expense.findAll({
    where,
    include: [
      { model: User, as: 'submitter', attributes: ['id', 'fullName', 'role'] },
      { model: User, as: 'approver',  attributes: ['id', 'fullName'] },
    ],
    order: [['date', 'DESC']],
    limit: 500,
  });
  res.json({ success: true, data: rows });
});

// POST /api/me/expenses
export const createMine = asyncHandler(async (req, res) => {
  const { date, category, description, amount, projectId, paymentMethod, receiptUrl } = req.body;
  if (!date || !category || !description || amount == null) {
    return res.status(400).json({ success: false, message: 'date, category, description, amount required' });
  }
  if (!_allowedCategories.has(category)) {
    return res.status(400).json({ success: false, message: `unknown category: ${category}` });
  }
  if (Number(amount) <= 0) {
    return res.status(400).json({ success: false, message: 'amount must be > 0' });
  }
  const row = await Expense.create({
    date, category, description, amount,
    projectId: projectId || null,
    paymentMethod: paymentMethod || null,
    receiptUrl: receiptUrl || null,
    submittedBy: req.user.id,
    status: 'Pending'
  });
  await createApprovalRow({
    type: 'FINANCE_EXPENSE',
    entityType: 'expense',
    entityId: row.id,
    requestedBy: req.user.id,
    amount: Number(amount),
    title: `${category} — LKR ${amount}`,
    description: description,
  });
  res.status(201).json({ success: true, data: row });
});

// PATCH /api/me/expenses/:id/cancel — only the submitter can cancel a pending claim
export const cancelMine = asyncHandler(async (req, res) => {
  const row = await Expense.findByPk(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'not found' });
  if (row.submittedBy !== req.user.id) return res.status(403).json({ success: false, message: 'forbidden' });
  if (row.status !== 'Pending') return res.status(409).json({ success: false, message: `cannot cancel ${row.status}` });
  row.status = 'Rejected';
  await row.save();
  await syncApprovalDecision({
    entityType: 'expense', entityId: row.id, status: 'Cancelled', decidedBy: req.user.id,
  });
  res.json({ success: true, data: row });
});

// PATCH /api/me/expenses/:id/:action — Finance/HR approve or reject
export const decide = asyncHandler(async (req, res) => {
  if (!isApprover(req.user)) return res.status(403).json({ success: false, message: 'forbidden' });
  const action = req.params.action;
  if (!['approve', 'reject'].includes(action)) return res.status(400).json({ success: false, message: 'invalid action' });
  const row = await Expense.findByPk(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'not found' });
  if (row.status !== 'Pending') return res.status(409).json({ success: false, message: `already ${row.status}` });
  row.status = action === 'approve' ? 'Approved' : 'Rejected';
  row.approvedBy = req.user.id;
  row.approvalDate = new Date();
  await row.save();
  await syncApprovalDecision({
    entityType: 'expense', entityId: row.id, status: row.status,
    decidedBy: req.user.id, notes: req.body.notes ?? null,
  });
  res.json({ success: true, data: row });
});
