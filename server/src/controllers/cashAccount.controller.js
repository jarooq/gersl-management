import { CashAccount, User, ChartOfAccounts } from '../models/index.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';
import {
  asyncHandler,
  BadRequestError,
  NotFoundError,
  ConflictError
} from '../middleware/error.middleware.js';

const accountInclude = [
  { model: User, as: 'custodian',    attributes: ['id', 'fullName', 'role', 'email'] },
  { model: User, as: 'altCustodian', attributes: ['id', 'fullName', 'role'] },
  { model: User, as: 'creator',      attributes: ['id', 'fullName'] },
  { model: ChartOfAccounts, as: 'coaAccount', attributes: ['id', 'accountCode', 'accountName'] }
];

const VALID_TYPES = ['Locker', 'CashBook', 'PettyCash'];

const validate = (body, { creating } = {}) => {
  if (creating || body.type !== undefined) {
    if (!VALID_TYPES.includes(body.type)) {
      throw new BadRequestError(`type must be one of: ${VALID_TYPES.join(', ')}`);
    }
  }
  if (body.type === 'PettyCash' && body.imprestLimit != null && Number(body.imprestLimit) <= 0) {
    throw new BadRequestError('imprestLimit must be > 0 for PettyCash');
  }
  if (body.type === 'Locker' && creating) {
    if (!body.altCustodianUserId) {
      throw new BadRequestError('Locker accounts require altCustodianUserId for dual-control');
    }
    if (Number(body.altCustodianUserId) === Number(body.custodianUserId)) {
      throw new BadRequestError('altCustodianUserId must differ from custodianUserId');
    }
  }
};

// ============================================
// LIST
// ============================================
export const listCashAccounts = asyncHandler(async (req, res) => {
  const { type, isActive, location } = req.query;
  const where = {};
  if (type) where.type = type;
  if (isActive !== undefined) where.isActive = String(isActive) === 'true';
  if (location) where.location = { [Op.iLike]: `%${location}%` };

  const rows = await CashAccount.findAll({
    where,
    include: accountInclude,
    order: [['type', 'ASC'], ['name', 'ASC']]
  });
  res.json({ success: true, data: { accounts: rows } });
});

export const getCashAccount = asyncHandler(async (req, res) => {
  const acc = await CashAccount.findByPk(req.params.id, { include: accountInclude });
  if (!acc) throw new NotFoundError('Cash account not found');
  res.json({ success: true, data: { account: acc } });
});

// ============================================
// CREATE
// ============================================
export const createCashAccount = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.name?.trim()) throw new BadRequestError('name is required');
  if (!body.custodianUserId) throw new BadRequestError('custodianUserId is required');
  validate(body, { creating: true });

  const custodian = await User.findByPk(body.custodianUserId);
  if (!custodian || custodian.status !== 'Active') {
    throw new BadRequestError('Custodian must be an active user');
  }
  if (body.altCustodianUserId) {
    const alt = await User.findByPk(body.altCustodianUserId);
    if (!alt || alt.status !== 'Active') {
      throw new BadRequestError('Alt custodian must be an active user');
    }
  }

  const opening = Number(body.openingBalance ?? 0);
  const acc = await CashAccount.create({
    ...body,
    openingBalance: opening,
    currentBalance: opening,
    createdBy: req.user.id
  });
  const reloaded = await CashAccount.findByPk(acc.id, { include: accountInclude });
  res.status(201).json({ success: true, data: { account: reloaded } });
});

// ============================================
// UPDATE
// ============================================
export const updateCashAccount = asyncHandler(async (req, res) => {
  const acc = await CashAccount.findByPk(req.params.id);
  if (!acc) throw new NotFoundError('Cash account not found');
  const body = req.body || {};
  validate({ ...acc.toJSON(), ...body });

  // Don't let openingBalance / currentBalance be edited here — they only
  // change via transactions or a deliberate adjustment elsewhere.
  const { openingBalance, currentBalance, ...patch } = body;
  await acc.update(patch);
  const reloaded = await CashAccount.findByPk(acc.id, { include: accountInclude });
  res.json({ success: true, data: { account: reloaded } });
});

// ============================================
// DEACTIVATE — soft close (balance must be zero)
// ============================================
export const deactivateCashAccount = asyncHandler(async (req, res) => {
  const acc = await CashAccount.findByPk(req.params.id);
  if (!acc) throw new NotFoundError('Cash account not found');
  if (Number(acc.currentBalance) !== 0) {
    throw new ConflictError('Cannot deactivate an account with non-zero balance');
  }
  await acc.update({ isActive: false });
  res.json({ success: true, data: { account: acc } });
});

// ============================================
// REACTIVATE
// ============================================
export const reactivateCashAccount = asyncHandler(async (req, res) => {
  const acc = await CashAccount.findByPk(req.params.id);
  if (!acc) throw new NotFoundError('Cash account not found');
  await acc.update({ isActive: true });
  res.json({ success: true, data: { account: acc } });
});

// ============================================
// SUMMARY — org-wide cash position
// ============================================
export const getCashSummary = asyncHandler(async (req, res) => {
  const rows = await CashAccount.findAll({
    where: { isActive: true },
    attributes: [
      'type',
      'currency',
      [sequelize.fn('SUM', sequelize.col('current_balance')), 'totalBalance'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'accountCount']
    ],
    group: ['type', 'currency']
  });

  const lowFloats = await CashAccount.findAll({
    where: {
      isActive: true,
      reorderPoint: { [Op.ne]: null },
      currentBalance: { [Op.lte]: sequelize.col('reorder_point') }
    },
    attributes: ['id', 'name', 'type', 'currentBalance', 'reorderPoint', 'currency'],
    order: [['currentBalance', 'ASC']]
  });

  res.json({
    success: true,
    data: {
      byType: rows.map(r => ({
        type: r.type,
        currency: r.currency,
        totalBalance: Number(r.get('totalBalance') || 0),
        accountCount: Number(r.get('accountCount') || 0)
      })),
      lowFloats
    }
  });
});
