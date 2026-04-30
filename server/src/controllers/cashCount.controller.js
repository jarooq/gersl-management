import {
  CashAccount,
  CashCountSession,
  CashTransaction,
  User
} from '../models/index.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';
import {
  asyncHandler,
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError
} from '../middleware/error.middleware.js';

const countInclude = [
  { model: CashAccount, as: 'account', attributes: ['id', 'name', 'type', 'currency', 'currentBalance'] },
  { model: User, as: 'counter',  attributes: ['id', 'fullName', 'role'] },
  { model: User, as: 'witness',  attributes: ['id', 'fullName', 'role'] },
  { model: User, as: 'approver', attributes: ['id', 'fullName', 'role'] },
  { model: CashTransaction, as: 'adjustmentTx', attributes: ['id', 'voucherNo', 'amount', 'direction', 'balanceAfter'] }
];

const APPROVE_ROLES = ['Admin', 'CEO', 'Finance Manager'];

const sumDenoms = (breakdown = {}) =>
  Object.entries(breakdown).reduce((acc, [denom, qty]) => acc + Number(denom) * Number(qty || 0), 0);

const lockAccount = async (id, t) => {
  const acc = await CashAccount.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
  if (!acc) throw new NotFoundError('Cash account not found');
  if (!acc.isActive) throw new BadRequestError('Cash account is inactive');
  return acc;
};

const nextVoucherNo = async (accountId, transaction) => {
  const [rows] = await sequelize.query(
    `UPDATE cash_accounts
        SET voucher_counter = voucher_counter + 1,
            updated_at      = NOW()
      WHERE id = :id
   RETURNING voucher_counter, type;`,
    { replacements: { id: accountId }, transaction }
  );
  if (!rows[0]) throw new NotFoundError('Cash account not found');
  const prefix = { Locker: 'LK', CashBook: 'CB', PettyCash: 'PC' }[rows[0].type] || 'CT';
  return `${prefix}-${String(rows[0].voucher_counter).padStart(5, '0')}`;
};

// ============================================
// LIST per account
// ============================================
export const listCounts = asyncHandler(async (req, res) => {
  const { accountId, status, from, to } = req.query;
  const where = {};
  if (accountId) where.cashAccountId = parseInt(accountId, 10);
  if (status) where.status = status;
  if (from || to) {
    where.occurredAt = {};
    if (from) where.occurredAt[Op.gte] = new Date(from);
    if (to)   where.occurredAt[Op.lte] = new Date(to);
  }
  const rows = await CashCountSession.findAll({
    where,
    include: countInclude,
    order: [['occurredAt', 'DESC']]
  });
  res.json({ success: true, data: { counts: rows } });
});

export const getCount = asyncHandler(async (req, res) => {
  const c = await CashCountSession.findByPk(req.params.id, { include: countInclude });
  if (!c) throw new NotFoundError('Cash count not found');
  res.json({ success: true, data: { count: c } });
});

// ============================================
// START — captures expected balance from account row
// Body: { cashAccountId, occurredAt? }
// ============================================
export const startCount = asyncHandler(async (req, res) => {
  const { cashAccountId, occurredAt } = req.body;
  if (!cashAccountId) throw new BadRequestError('cashAccountId is required');

  const t = await sequelize.transaction();
  try {
    const account = await lockAccount(cashAccountId, t);

    // Block if there's an existing Pending or Submitted count on this account.
    const open = await CashCountSession.findOne({
      where: { cashAccountId: account.id, status: { [Op.in]: ['Pending', 'Submitted'] } },
      transaction: t
    });
    if (open) {
      throw new ConflictError(`An open count session exists for this account (#${open.id})`);
    }

    const session = await CashCountSession.create({
      cashAccountId: account.id,
      expectedBalance: account.currentBalance,
      status: 'Pending',
      countedBy: req.user.id,
      occurredAt: occurredAt ? new Date(occurredAt) : new Date()
    }, { transaction: t });

    await t.commit();
    const reloaded = await CashCountSession.findByPk(session.id, { include: countInclude });
    res.status(201).json({ success: true, data: { count: reloaded } });
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
});

// ============================================
// SUBMIT — custodian fills in denomination breakdown + counted total
// Body: { denominationBreakdown {}, countedBalance?, witnessUserId?, notes? }
// ============================================
export const submitCount = asyncHandler(async (req, res) => {
  const { denominationBreakdown, countedBalance, witnessUserId, notes } = req.body;
  const session = await CashCountSession.findByPk(req.params.id, { include: [{ model: CashAccount, as: 'account' }] });
  if (!session) throw new NotFoundError('Cash count not found');
  if (session.status !== 'Pending') {
    throw new ConflictError(`Cannot submit a ${session.status} count`);
  }

  const breakdown = denominationBreakdown && typeof denominationBreakdown === 'object' ? denominationBreakdown : null;
  // Either the breakdown sum or an explicit countedBalance must be provided.
  let counted = countedBalance != null ? Number(countedBalance) : null;
  if (counted == null && breakdown) counted = sumDenoms(breakdown);
  if (!Number.isFinite(counted) || counted < 0) {
    throw new BadRequestError('countedBalance (or denominationBreakdown) is required');
  }
  // If both provided, they must reconcile.
  if (breakdown && countedBalance != null && Math.abs(sumDenoms(breakdown) - Number(countedBalance)) > 0.01) {
    throw new BadRequestError('countedBalance does not match the denomination breakdown');
  }

  // Locker requires a witness.
  if (session.account?.type === 'Locker') {
    if (!witnessUserId && !session.witnessUserId) {
      throw new BadRequestError('Locker counts require a witnessUserId');
    }
    if (witnessUserId && Number(witnessUserId) === session.countedBy) {
      throw new BadRequestError('Witness must differ from the person counting');
    }
  }
  if (witnessUserId) {
    const witness = await User.findByPk(witnessUserId);
    if (!witness || witness.status !== 'Active') {
      throw new BadRequestError('Witness must be an active user');
    }
  }

  const variance = Number((counted - Number(session.expectedBalance)).toFixed(2));
  await session.update({
    status: 'Submitted',
    denominationBreakdown: breakdown,
    countedBalance: counted,
    variance,
    witnessUserId: witnessUserId ?? session.witnessUserId,
    notes: notes ?? session.notes
  });

  const reloaded = await CashCountSession.findByPk(session.id, { include: countInclude });
  res.json({ success: true, data: { count: reloaded } });
});

// ============================================
// APPROVE — Manager approves; auto-creates Adjustment when variance != 0
// ============================================
export const approveCount = asyncHandler(async (req, res) => {
  if (!APPROVE_ROLES.includes(req.user.role)) {
    throw new ForbiddenError('Only Finance Manager / CEO / Admin can approve counts');
  }

  const t = await sequelize.transaction();
  try {
    const session = await CashCountSession.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!session) throw new NotFoundError('Cash count not found');
    if (session.status !== 'Submitted') {
      throw new ConflictError(`Cannot approve a ${session.status} count`);
    }
    if (session.countedBy === req.user.id && req.user.role !== 'Admin') {
      throw new ForbiddenError('Counter cannot approve their own count');
    }

    const account = await lockAccount(session.cashAccountId, t);
    const variance = Number(session.variance);

    let adjustmentTxId = null;
    if (Math.abs(variance) > 0.005) {
      // Always post an adjustment to keep the account in sync with the physical
      // count. The tolerance flag on the account governs whether this is a
      // routine correction or one Manager review needed (we still record it).
      const direction = variance > 0 ? 'In' : 'Out';
      const newBal = Number(account.currentBalance) + (direction === 'In' ? Math.abs(variance) : -Math.abs(variance));
      if (newBal < 0) {
        throw new BadRequestError('Variance adjustment would push balance below zero — investigate');
      }
      const voucher = await nextVoucherNo(account.id, t);
      const adjustment = await CashTransaction.create({
        cashAccountId: account.id,
        transactionType: 'Reconciliation',
        direction,
        amount: Math.abs(variance),
        currency: account.currency,
        balanceAfter: newBal,
        voucherNo: voucher,
        referenceType: 'CashCount',
        referenceId: session.id,
        description: `Cash count variance ${variance >= 0 ? '+' : ''}${variance.toFixed(2)} on count #${session.id}`,
        status: 'Posted',
        performedBy: req.user.id,
        approvedBy: req.user.id,
        approvedAt: new Date(),
        occurredAt: new Date()
      }, { transaction: t });
      await account.update({ currentBalance: newBal }, { transaction: t });
      adjustmentTxId = adjustment.id;
    }

    await account.update({ lastCountAt: new Date() }, { transaction: t });
    await session.update({
      status: 'Approved',
      approvedBy: req.user.id,
      approvedAt: new Date(),
      adjustmentTxId
    }, { transaction: t });

    await t.commit();
    const reloaded = await CashCountSession.findByPk(session.id, { include: countInclude });
    res.json({ success: true, data: { count: reloaded } });
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
});

// ============================================
// DISPUTE — Manager flags the submitted count for re-count
// ============================================
export const disputeCount = asyncHandler(async (req, res) => {
  if (!APPROVE_ROLES.includes(req.user.role)) {
    throw new ForbiddenError('Only Finance Manager / CEO / Admin can dispute counts');
  }
  const { reason } = req.body || {};
  if (!reason) throw new BadRequestError('reason is required');

  const session = await CashCountSession.findByPk(req.params.id);
  if (!session) throw new NotFoundError('Cash count not found');
  if (session.status !== 'Submitted') {
    throw new ConflictError(`Cannot dispute a ${session.status} count`);
  }
  await session.update({
    status: 'Disputed',
    approvedBy: req.user.id,
    approvedAt: new Date(),
    disputeReason: reason
  });
  const reloaded = await CashCountSession.findByPk(session.id, { include: countInclude });
  res.json({ success: true, data: { count: reloaded } });
});

// ============================================
// CANCEL — Pending counts can be cancelled by the counter or a Manager
// ============================================
export const cancelCount = asyncHandler(async (req, res) => {
  const session = await CashCountSession.findByPk(req.params.id);
  if (!session) throw new NotFoundError('Cash count not found');
  if (session.status !== 'Pending') {
    throw new ConflictError(`Cannot cancel a ${session.status} count`);
  }
  const isOwner = session.countedBy === req.user.id;
  if (!isOwner && !APPROVE_ROLES.includes(req.user.role)) {
    throw new ForbiddenError('Only the counter or a Manager can cancel a Pending count');
  }
  await session.destroy();
  res.json({ success: true });
});
