import { CashAccount, CashTransaction, User } from '../models/index.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';
import {
  asyncHandler,
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError
} from '../middleware/error.middleware.js';

const txInclude = [
  { model: CashAccount, as: 'account', attributes: ['id', 'name', 'type', 'currency'] },
  { model: CashAccount, as: 'counterparty', attributes: ['id', 'name', 'type'] },
  { model: User, as: 'performer', attributes: ['id', 'fullName', 'role'] },
  { model: User, as: 'approver',  attributes: ['id', 'fullName', 'role'] }
];

const APPROVE_ROLES = ['Admin', 'CEO', 'Finance Manager', 'Finance Officer'];

// ============================================
// Helpers
// ============================================

// Find the role required to approve a given amount, looking at the account's
// configured thresholds. Returns null when the recorder can self-post.
const requiredApproverRole = (account, amount, currentUserRole) => {
  const bands = Array.isArray(account.approvalThresholds) ? account.approvalThresholds : [];
  // Sort by minAmount asc; pick the most specific matching band.
  const matches = bands
    .filter(b => Number(amount) >= Number(b.minAmount || 0)
              && (b.maxAmount == null || Number(amount) <= Number(b.maxAmount)))
    .sort((a, b) => Number(b.minAmount || 0) - Number(a.minAmount || 0));
  const band = matches[0];
  if (!band) return null;
  // Self-posting if the current user already has the required role (or a higher-priv role like Admin/CEO).
  if (band.requiredRole === currentUserRole) return null;
  if (currentUserRole === 'Admin' || currentUserRole === 'CEO') return null;
  if (band.requiredRole === 'Finance Officer' && currentUserRole === 'Finance Manager') return null;
  return band.requiredRole;
};

// Issue the next voucher number for an account. Uses an UPDATE…RETURNING under
// a transaction-scoped row lock so concurrent requests don't collide.
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
  const seq = String(rows[0].voucher_counter).padStart(5, '0');
  return `${prefix}-${seq}`;
};

// Lock the account row and return a fresh balance.
const lockAccount = async (accountId, transaction) => {
  const acc = await CashAccount.findByPk(accountId, { transaction, lock: transaction.LOCK.UPDATE });
  if (!acc) throw new NotFoundError('Cash account not found');
  if (!acc.isActive) throw new BadRequestError('Cash account is inactive');
  return acc;
};

const computeNewBalance = (current, direction, amount) => {
  const cur = Number(current);
  const a = Number(amount);
  return direction === 'In' ? cur + a : cur - a;
};

// ============================================
// LIST per account (cash book ledger)
// ============================================
export const listTransactions = asyncHandler(async (req, res) => {
  const { accountId, from, to, type, status, page = 1, limit = 100 } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const where = {};
  if (accountId) where.cashAccountId = parseInt(accountId, 10);
  if (type) where.transactionType = type;
  if (status) where.status = status;
  if (from || to) {
    where.occurredAt = {};
    if (from) where.occurredAt[Op.gte] = new Date(from);
    if (to)   where.occurredAt[Op.lte] = new Date(to);
  }
  const { rows, count } = await CashTransaction.findAndCountAll({
    where,
    limit: parseInt(limit, 10),
    offset,
    include: txInclude,
    order: [['occurredAt', 'ASC'], ['id', 'ASC']]
  });
  res.json({
    success: true,
    data: {
      transactions: rows,
      pagination: { total: count, page: parseInt(page, 10), pages: Math.ceil(count / parseInt(limit, 10)) }
    }
  });
});

export const getTransaction = asyncHandler(async (req, res) => {
  const tx = await CashTransaction.findByPk(req.params.id, { include: txInclude });
  if (!tx) throw new NotFoundError('Cash transaction not found');
  res.json({ success: true, data: { transaction: tx } });
});

// ============================================
// RECORD — Receipt / Payment / Adjustment
// Body: { cashAccountId, transactionType, amount, payeeName?, description?,
//         categoryId?, projectId?, referenceType?, referenceId?,
//         receiptUrl?, occurredAt? }
// ============================================
export const recordTransaction = asyncHandler(async (req, res) => {
  const {
    cashAccountId,
    transactionType,
    amount,
    payeeName,
    description,
    categoryId,
    projectId,
    referenceType,
    referenceId,
    receiptUrl,
    occurredAt
  } = req.body;

  if (!cashAccountId || !transactionType) {
    throw new BadRequestError('cashAccountId and transactionType are required');
  }
  if (!['Receipt', 'Payment', 'Adjustment'].includes(transactionType)) {
    throw new BadRequestError('transactionType must be Receipt, Payment, or Adjustment');
  }
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    throw new BadRequestError('amount must be > 0');
  }

  const direction = transactionType === 'Receipt' ? 'In'
                  : transactionType === 'Payment' ? 'Out'
                  : (Number(req.body.adjustmentSign) >= 0 ? 'In' : 'Out');

  const t = await sequelize.transaction();
  try {
    const account = await lockAccount(cashAccountId, t);
    if (account.restrictedToProjectId && projectId && Number(projectId) !== Number(account.restrictedToProjectId)) {
      throw new BadRequestError(`This account is restricted to project ${account.restrictedToProjectId}`);
    }
    if (direction === 'Out' && Number(account.receiptRequiredOver) > 0
        && amt > Number(account.receiptRequiredOver) && !receiptUrl) {
      throw new BadRequestError(`Receipt is required for Out transactions over ${account.currency} ${account.receiptRequiredOver}`);
    }

    const newBalance = computeNewBalance(account.currentBalance, direction, amt);
    if (direction === 'Out' && newBalance < 0) {
      throw new BadRequestError('Transaction would push balance below zero');
    }

    const required = requiredApproverRole(account, amt, req.user.role);
    const status = required ? 'Pending-Approval' : 'Posted';

    const voucherNo = status === 'Posted'
      ? await nextVoucherNo(account.id, t)
      : null; // assigned at approval time

    const tx = await CashTransaction.create({
      cashAccountId: account.id,
      transactionType,
      direction,
      amount: amt,
      currency: account.currency,
      balanceAfter: status === 'Posted' ? newBalance : null,
      voucherNo,
      referenceType,
      referenceId,
      payeeName,
      receiptUrl,
      description,
      categoryId,
      projectId,
      status,
      performedBy: req.user.id,
      occurredAt: occurredAt ? new Date(occurredAt) : new Date()
    }, { transaction: t });

    if (status === 'Posted') {
      await account.update({ currentBalance: newBalance }, { transaction: t });
    }

    await t.commit();
    const reloaded = await CashTransaction.findByPk(tx.id, { include: txInclude });
    res.status(201).json({
      success: true,
      data: {
        transaction: reloaded,
        requiresApprovalBy: required
      }
    });
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
});

// ============================================
// TRANSFER — locker -> cashbook -> petty (or any direction).
// Body: { fromAccountId, toAccountId, amount, description?, occurredAt? }
// Creates two paired transactions: Out from source, In to destination.
// ============================================
export const transferBetweenAccounts = asyncHandler(async (req, res) => {
  const { fromAccountId, toAccountId, amount, description, occurredAt } = req.body;
  if (!fromAccountId || !toAccountId) throw new BadRequestError('fromAccountId and toAccountId are required');
  if (Number(fromAccountId) === Number(toAccountId)) throw new BadRequestError('Cannot transfer to the same account');
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) throw new BadRequestError('amount must be > 0');

  const t = await sequelize.transaction();
  try {
    // Lock both accounts in stable order (lower id first) to avoid deadlock.
    const [aId, bId] = Number(fromAccountId) < Number(toAccountId) ? [fromAccountId, toAccountId] : [toAccountId, fromAccountId];
    const [accA, accB] = await Promise.all([lockAccount(aId, t), lockAccount(bId, t)]);
    const fromAcc = accA.id === Number(fromAccountId) ? accA : accB;
    const toAcc   = accA.id === Number(toAccountId)   ? accA : accB;

    if (fromAcc.currency !== toAcc.currency) {
      throw new BadRequestError('Cross-currency transfers not supported here');
    }
    const newFrom = computeNewBalance(fromAcc.currentBalance, 'Out', amt);
    if (newFrom < 0) throw new BadRequestError('Transfer would push source balance below zero');
    const newTo = computeNewBalance(toAcc.currentBalance, 'In', amt);

    // Transfers always need approval if either side has thresholds matching.
    const required = requiredApproverRole(fromAcc, amt, req.user.role);
    const status = required ? 'Pending-Approval' : 'Posted';

    // Voucher numbers issued only on Posted transfers.
    let outVoucher = null, inVoucher = null;
    if (status === 'Posted') {
      outVoucher = await nextVoucherNo(fromAcc.id, t);
      inVoucher  = await nextVoucherNo(toAcc.id, t);
    }

    const occurred = occurredAt ? new Date(occurredAt) : new Date();
    const outTx = await CashTransaction.create({
      cashAccountId: fromAcc.id,
      transactionType: 'Transfer',
      direction: 'Out',
      amount: amt,
      currency: fromAcc.currency,
      balanceAfter: status === 'Posted' ? newFrom : null,
      voucherNo: outVoucher,
      referenceType: 'Transfer',
      counterpartyAccountId: toAcc.id,
      description,
      status,
      performedBy: req.user.id,
      occurredAt: occurred
    }, { transaction: t });

    const inTx = await CashTransaction.create({
      cashAccountId: toAcc.id,
      transactionType: 'Transfer',
      direction: 'In',
      amount: amt,
      currency: toAcc.currency,
      balanceAfter: status === 'Posted' ? newTo : null,
      voucherNo: inVoucher,
      referenceType: 'Transfer',
      counterpartyAccountId: fromAcc.id,
      pairId: outTx.id,
      description,
      status,
      performedBy: req.user.id,
      occurredAt: occurred
    }, { transaction: t });

    // Back-link the out side to the in side too
    await outTx.update({ pairId: inTx.id }, { transaction: t });

    if (status === 'Posted') {
      await fromAcc.update({ currentBalance: newFrom }, { transaction: t });
      await toAcc.update  ({ currentBalance: newTo   }, { transaction: t });
    }

    await t.commit();
    const reloadedOut = await CashTransaction.findByPk(outTx.id, { include: txInclude });
    const reloadedIn  = await CashTransaction.findByPk(inTx.id,  { include: txInclude });
    res.status(201).json({
      success: true,
      data: {
        out: reloadedOut,
        in: reloadedIn,
        requiresApprovalBy: required
      }
    });
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
});

// ============================================
// APPROVE — Pending-Approval -> Posted (also posts paired transfer leg)
// ============================================
export const approveTransaction = asyncHandler(async (req, res) => {
  if (!APPROVE_ROLES.includes(req.user.role)) {
    throw new ForbiddenError('Your role cannot approve cash transactions');
  }

  const t = await sequelize.transaction();
  try {
    const tx = await CashTransaction.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!tx) throw new NotFoundError('Cash transaction not found');
    if (tx.status !== 'Pending-Approval') {
      throw new ConflictError(`Cannot approve a ${tx.status} transaction`);
    }
    if (tx.performedBy === req.user.id && req.user.role !== 'Admin') {
      throw new ForbiddenError('Cannot approve your own transaction');
    }

    const post = async (transaction, relatedAccount) => {
      const account = await lockAccount(transaction.cashAccountId, t);
      const newBal = computeNewBalance(account.currentBalance, transaction.direction, transaction.amount);
      if (transaction.direction === 'Out' && newBal < 0) {
        throw new BadRequestError(`Approval would push ${account.name} balance below zero`);
      }
      const voucher = await nextVoucherNo(account.id, t);
      await transaction.update({
        status: 'Posted',
        balanceAfter: newBal,
        voucherNo: voucher,
        approvedBy: req.user.id,
        approvedAt: new Date()
      }, { transaction: t });
      await account.update({ currentBalance: newBal }, { transaction: t });
    };

    await post(tx);
    if (tx.pairId) {
      const pair = await CashTransaction.findByPk(tx.pairId, { transaction: t, lock: t.LOCK.UPDATE });
      if (pair && pair.status === 'Pending-Approval') await post(pair);
    }

    await t.commit();
    const reloaded = await CashTransaction.findByPk(tx.id, { include: txInclude });
    res.json({ success: true, data: { transaction: reloaded } });
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
});

// ============================================
// REJECT — Pending-Approval -> Rejected
// ============================================
export const rejectTransaction = asyncHandler(async (req, res) => {
  if (!APPROVE_ROLES.includes(req.user.role)) {
    throw new ForbiddenError('Your role cannot reject cash transactions');
  }
  const { reason } = req.body || {};
  if (!reason) throw new BadRequestError('reason is required');

  const t = await sequelize.transaction();
  try {
    const tx = await CashTransaction.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!tx) throw new NotFoundError('Cash transaction not found');
    if (tx.status !== 'Pending-Approval') {
      throw new ConflictError(`Cannot reject a ${tx.status} transaction`);
    }

    await tx.update({
      status: 'Rejected',
      approvedBy: req.user.id,
      approvedAt: new Date(),
      rejectionReason: reason
    }, { transaction: t });

    if (tx.pairId) {
      const pair = await CashTransaction.findByPk(tx.pairId, { transaction: t, lock: t.LOCK.UPDATE });
      if (pair && pair.status === 'Pending-Approval') {
        await pair.update({
          status: 'Rejected',
          approvedBy: req.user.id,
          approvedAt: new Date(),
          rejectionReason: reason
        }, { transaction: t });
      }
    }

    await t.commit();
    const reloaded = await CashTransaction.findByPk(tx.id, { include: txInclude });
    res.json({ success: true, data: { transaction: reloaded } });
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
});

// ============================================
// REVERSE — creates an offsetting Posted transaction
// ============================================
export const reverseTransaction = asyncHandler(async (req, res) => {
  if (!APPROVE_ROLES.includes(req.user.role)) {
    throw new ForbiddenError('Your role cannot reverse cash transactions');
  }
  const { reason } = req.body || {};
  if (!reason) throw new BadRequestError('reason is required');

  const t = await sequelize.transaction();
  try {
    const orig = await CashTransaction.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!orig) throw new NotFoundError('Cash transaction not found');
    if (orig.status !== 'Posted') {
      throw new ConflictError(`Only Posted transactions can be reversed (current: ${orig.status})`);
    }
    if (orig.reversedById) throw new ConflictError('Transaction is already reversed');

    const account = await lockAccount(orig.cashAccountId, t);
    const oppositeDir = orig.direction === 'In' ? 'Out' : 'In';
    const newBal = computeNewBalance(account.currentBalance, oppositeDir, orig.amount);
    if (oppositeDir === 'Out' && newBal < 0) {
      throw new BadRequestError('Reversal would push balance below zero — review before retrying');
    }

    const voucherNo = await nextVoucherNo(account.id, t);
    const reversal = await CashTransaction.create({
      cashAccountId: account.id,
      transactionType: 'Adjustment',
      direction: oppositeDir,
      amount: orig.amount,
      currency: account.currency,
      balanceAfter: newBal,
      voucherNo,
      referenceType: 'Reversal',
      referenceId: orig.id,
      description: `Reversal of ${orig.voucherNo || `tx#${orig.id}`}: ${reason}`,
      status: 'Posted',
      performedBy: req.user.id,
      approvedBy: req.user.id,
      approvedAt: new Date(),
      occurredAt: new Date()
    }, { transaction: t });

    await account.update({ currentBalance: newBal }, { transaction: t });
    await orig.update({
      status: 'Reversed',
      reversedById: reversal.id
    }, { transaction: t });

    await t.commit();
    const reloaded = await CashTransaction.findByPk(reversal.id, { include: txInclude });
    res.status(201).json({ success: true, data: { reversal: reloaded } });
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
});
