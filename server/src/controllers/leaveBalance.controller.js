import asyncHandler from 'express-async-handler';
import { LeaveBalance, User } from '../models/index.js';

const isHR = (user) => ['Admin', 'CEO', 'HR Manager', 'HR Officer'].includes(user?.role);

// GET /api/leave-balances?userId=&year=
export const listForUser = asyncHandler(async (req, res) => {
  const userId = parseInt(req.query.userId, 10) || req.user.id;
  if (userId !== req.user.id && !isHR(req.user)) return res.status(403).json({ success: false, message: 'forbidden' });
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  const rows = await LeaveBalance.findAll({ where: { userId, year } });
  res.json({ success: true, data: rows });
});

// PUT /api/leave-balances  body: { userId, year, leaveType, entitledDays }
export const upsertEntitlement = asyncHandler(async (req, res) => {
  if (!isHR(req.user)) return res.status(403).json({ success: false, message: 'forbidden' });
  const { userId, year, leaveType, entitledDays } = req.body;
  if (!userId || !year || !leaveType) return res.status(400).json({ success: false, message: 'userId, year, leaveType required' });
  const [row, created] = await LeaveBalance.findOrCreate({
    where: { userId, year, leaveType },
    defaults: { entitledDays: entitledDays ?? 0, takenDays: 0 }
  });
  if (!created && entitledDays !== undefined) {
    row.entitledDays = entitledDays;
    await row.save();
  }
  res.json({ success: true, data: row });
});
