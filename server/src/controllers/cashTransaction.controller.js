import { Bill, CashAccount, CashTransaction, Expense, Payroll, SalaryAdvance, User } from '../models/index.js';
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
// ACTIVITY SUMMARY — org-wide cash movement for a date range, broken down by
// account and by reference type. Used by Finance Manager / accountant for
// monthly board reports.
// Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD (defaults: last 30 days)
// ============================================
export const getActivitySummary = asyncHandler(async (req, res) => {
  const toDate = req.query.to ? new Date(req.query.to) : new Date();
  const fromDate = req.query.from
    ? new Date(req.query.from)
    : (() => { const d = new Date(toDate); d.setDate(d.getDate() - 30); return d; })();

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    throw new BadRequestError('Invalid date range');
  }

  // Pull only Posted transactions in window. Pending-Approval and Reversed
  // intentionally excluded so the summary matches what actually moved cash.
  const txs = await CashTransaction.findAll({
    where: {
      status: 'Posted',
      occurredAt: { [Op.gte]: fromDate, [Op.lte]: toDate }
    },
    include: [{ model: CashAccount, as: 'account', attributes: ['id', 'name', 'type', 'currency'] }],
    order: [['occurredAt', 'ASC']]
  });

  // By account
  const byAccountMap = new Map();
  // By reference type (Expense / SalaryAdvance / Bill / Payroll / null)
  const byRefMap = new Map();
  let totalIn = 0;
  let totalOut = 0;

  for (const t of txs) {
    const amt = Number(t.amount);
    const accId = t.cashAccountId;
    if (!byAccountMap.has(accId)) {
      byAccountMap.set(accId, {
        accountId: accId,
        accountName: t.account?.name || `Account #${accId}`,
        accountType: t.account?.type || null,
        currency: t.account?.currency || 'LKR',
        receipts: 0,
        payments: 0,
        net: 0,
        txCount: 0,
      });
    }
    const acc = byAccountMap.get(accId);
    acc.txCount += 1;
    if (t.direction === 'In')  { acc.receipts += amt; totalIn  += amt; }
    else                       { acc.payments += amt; totalOut += amt; }
    acc.net = acc.receipts - acc.payments;

    const refKey = t.referenceType || 'Manual';
    if (!byRefMap.has(refKey)) {
      byRefMap.set(refKey, { referenceType: refKey, count: 0, in: 0, out: 0 });
    }
    const ref = byRefMap.get(refKey);
    ref.count += 1;
    if (t.direction === 'In') ref.in  += amt;
    else                      ref.out += amt;
  }

  res.json({
    success: true,
    data: {
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      totals: {
        receipts: Number(totalIn.toFixed(2)),
        payments: Number(totalOut.toFixed(2)),
        net:      Number((totalIn - totalOut).toFixed(2)),
        transactionCount: txs.length,
      },
      byAccount: [...byAccountMap.values()]
        .map(a => ({
          ...a,
          receipts: Number(a.receipts.toFixed(2)),
          payments: Number(a.payments.toFixed(2)),
          net:      Number(a.net.toFixed(2)),
        }))
        .sort((a, b) => b.receipts + b.payments - (a.receipts + a.payments)),
      byReferenceType: [...byRefMap.values()]
        .map(r => ({
          ...r,
          in:  Number(r.in.toFixed(2)),
          out: Number(r.out.toFixed(2)),
        }))
        .sort((a, b) => b.in + b.out - (a.in + a.out)),
    }
  });
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
    // Imprest ceiling — petty-cash accounts have an imprestLimit (max float).
    // Block In-direction transactions that would push the balance over it so
    // the float doesn't quietly drift above policy.
    if (direction === 'In' && account.type === 'PettyCash'
        && Number(account.imprestLimit) > 0 && newBalance > Number(account.imprestLimit)) {
      throw new BadRequestError(
        `Receipt would push ${account.name} above its imprest limit `
        + `(${account.currency} ${account.imprestLimit}). Current balance: `
        + `${account.currentBalance}; this receipt: ${amt}.`
      );
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

// ============================================
// DISBURSE — pay an approved Expense or SalaryAdvance from a cash account.
// Body: { sourceType, sourceId, cashAccountId, payeeName?, description? }
//   sourceType: 'Expense' | 'SalaryAdvance'
//   sourceId:   id of the row in that table
// Creates one Payment-type CashTransaction with referenceType/referenceId
// linking back to the source. On Expense, also flips Expense.status -> 'Paid'.
// Wires the "accountant clicks one button to disburse" flow that previously
// required manual cash-ledger re-entry.
// ============================================
export const disburseFromSource = asyncHandler(async (req, res) => {
  const { sourceType, sourceId, cashAccountId, payeeName, description } = req.body;

  if (!sourceType || !sourceId || !cashAccountId) {
    throw new BadRequestError('sourceType, sourceId, and cashAccountId are required');
  }
  if (!['Expense', 'SalaryAdvance', 'Bill'].includes(sourceType)) {
    throw new BadRequestError(`sourceType must be 'Expense', 'SalaryAdvance', or 'Bill'`);
  }

  // Load + validate the source record
  let source;
  let amount;
  let defaultDescription;
  if (sourceType === 'Expense') {
    source = await Expense.findByPk(sourceId);
    if (!source) throw new NotFoundError('Expense not found');
    if (source.status !== 'Approved') {
      throw new BadRequestError(`Expense must be in 'Approved' status to disburse (current: ${source.status})`);
    }
    amount = Number(source.amount);
    defaultDescription = `Expense #${source.id}: ${source.description || source.category || 'staff expense'}`;
  } else if (sourceType === 'SalaryAdvance') {
    source = await SalaryAdvance.findByPk(sourceId);
    if (!source) throw new NotFoundError('Salary advance not found');
    if (source.status !== 'Approved') {
      throw new BadRequestError(`Salary advance must be in 'Approved' status to disburse (current: ${source.status})`);
    }
    amount = Number(source.amount);
    defaultDescription = `Salary advance #${source.id}`;
  } else { // Bill
    source = await Bill.findByPk(sourceId);
    if (!source) throw new NotFoundError('Bill not found');
    if (source.status === 'Paid') {
      throw new BadRequestError(`Bill ${source.billNumber} is already fully paid`);
    }
    // Pay the outstanding balance, falling back to the total when paidAmount
    // hasn't been tracked yet (legacy rows). Allows the same endpoint to
    // close out partially-paid bills correctly.
    const total = Number(source.totalAmount);
    const paid  = Number(source.paidAmount || 0);
    const balance = Number(source.balanceDue ?? (total - paid));
    if (!Number.isFinite(balance) || balance <= 0) {
      throw new BadRequestError(`Bill ${source.billNumber} has no outstanding balance`);
    }
    amount = balance;
    defaultDescription = `Bill ${source.billNumber} — ${source.vendorName || 'vendor'}`;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new BadRequestError(`Source ${sourceType} has invalid amount (${amount})`);
  }

  // Post the cash transaction (Payment, direction Out) — mirrors recordTransaction's
  // logic but skips the user-supplied amount and pins it to the source's amount.
  const t = await sequelize.transaction();
  try {
    const account = await lockAccount(cashAccountId, t);
    const newBalance = computeNewBalance(account.currentBalance, 'Out', amount);
    if (newBalance < 0) {
      throw new BadRequestError(`Disburse would push ${account.name} balance below zero`);
    }

    const required = requiredApproverRole(account, amount, req.user.role);
    const status = required ? 'Pending-Approval' : 'Posted';
    const voucherNo = status === 'Posted' ? await nextVoucherNo(account.id, t) : null;

    const tx = await CashTransaction.create({
      cashAccountId: account.id,
      transactionType: 'Payment',
      direction: 'Out',
      amount,
      currency: account.currency,
      balanceAfter: status === 'Posted' ? newBalance : null,
      voucherNo,
      referenceType: sourceType,
      referenceId: source.id,
      payeeName: payeeName || null,
      description: description || defaultDescription,
      status,
      performedBy: req.user.id,
      occurredAt: new Date()
    }, { transaction: t });

    if (status === 'Posted') {
      await account.update({ currentBalance: newBalance }, { transaction: t });
      // Flip the source record so HR/Finance pages reflect the payment
      if (sourceType === 'Expense') {
        await source.update({ status: 'Paid' }, { transaction: t });
      } else if (sourceType === 'Bill') {
        // Increment paidAmount, recompute balanceDue, flip status to Paid
        // when balance lands at zero.
        const total = Number(source.totalAmount);
        const newPaid = Number(source.paidAmount || 0) + amount;
        const newBalance = total - newPaid;
        await source.update({
          paidAmount: newPaid,
          balanceDue: newBalance,
          status: newBalance <= 0 ? 'Paid' : (source.status || 'PartiallyPaid'),
        }, { transaction: t });
      }
      // SalaryAdvance.status enum has no 'Paid' (the workflow is Pending →
      // Approved → Deducted, where Deducted means recovered via payroll).
      // We leave its status alone; the cash transaction's reference fields
      // are the audit trail.
    }

    await t.commit();
    const reloaded = await CashTransaction.findByPk(tx.id, { include: txInclude });
    res.status(201).json({
      success: true,
      data: {
        transaction: reloaded,
        sourceStatus: status === 'Posted' && (sourceType === 'Expense' || sourceType === 'Bill')
          ? source.status  // refreshed by the .update() above
          : source.status,
        requiresApprovalBy: required
      }
    });
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
});

// ============================================
// BATCH DISBURSE — pay an entire payroll run from a cash account.
// Body: { payrollIds: number[], cashAccountId, description? }
// Each payroll row in payrollIds that's in 'Pending' or 'Processed' status
// gets a single Payment-type CashTransaction posted for its netPay amount.
// Failures on individual rows roll back the whole batch (single sequelize
// transaction) so an accountant either pays everyone or nobody — no partial
// disbursement messes that have to be untangled by hand.
// ============================================
export const disbursePayroll = asyncHandler(async (req, res) => {
  const { payrollIds, cashAccountId, description } = req.body;

  if (!Array.isArray(payrollIds) || payrollIds.length === 0) {
    throw new BadRequestError('payrollIds must be a non-empty array');
  }
  if (!cashAccountId) {
    throw new BadRequestError('cashAccountId is required');
  }

  const payrolls = await Payroll.findAll({ where: { id: payrollIds } });
  if (payrolls.length === 0) {
    throw new NotFoundError('No matching payroll records found');
  }

  // Reject if any selected row is already Paid (idempotency / mistake guard).
  const alreadyPaid = payrolls.filter(p => p.status === 'Paid');
  if (alreadyPaid.length) {
    throw new BadRequestError(
      `Already paid: ${alreadyPaid.map(p => p.payrollCode).join(', ')}`
    );
  }

  const totalNet = payrolls.reduce((s, p) => s + Number(p.netPay || 0), 0);
  if (!Number.isFinite(totalNet) || totalNet <= 0) {
    throw new BadRequestError(`Total net pay is invalid (${totalNet})`);
  }

  const t = await sequelize.transaction();
  try {
    const account = await lockAccount(cashAccountId, t);

    // Block early if the account doesn't have enough cash to cover the batch.
    const finalBalance = Number(account.currentBalance) - totalNet;
    if (finalBalance < 0) {
      throw new BadRequestError(
        `Account ${account.name} would go below zero: balance ${account.currency} ${account.currentBalance} - payout ${totalNet}`
      );
    }

    // For payroll batches we always self-post — the payroll batch itself is
    // the approval surface. Threshold approvals would block the disbursement
    // mid-batch, which is the partial-state nightmare we're avoiding.
    let runningBalance = Number(account.currentBalance);
    const vouchers = [];

    for (const p of payrolls) {
      const amt = Number(p.netPay || 0);
      if (amt <= 0) {
        throw new BadRequestError(`Payroll ${p.payrollCode} has invalid netPay (${amt})`);
      }
      runningBalance -= amt;
      const voucherNo = await nextVoucherNo(account.id, t);

      const tx = await CashTransaction.create({
        cashAccountId: account.id,
        transactionType: 'Payment',
        direction: 'Out',
        amount: amt,
        currency: account.currency,
        balanceAfter: runningBalance,
        voucherNo,
        referenceType: 'Payroll',
        referenceId: p.id,
        description: description
          ? `${description} (${p.payrollCode})`
          : `Payroll ${p.payrollCode}: ${p.payPeriodStart} → ${p.payPeriodEnd}`,
        status: 'Posted',
        performedBy: req.user.id,
        occurredAt: new Date()
      }, { transaction: t });

      await p.update({
        status: 'Paid',
        paymentMethod: 'Cash',
        paymentReference: voucherNo,
        processedBy: p.processedBy || req.user.id,
        processedDate: p.processedDate || new Date(),
      }, { transaction: t });

      vouchers.push({ payrollId: p.id, payrollCode: p.payrollCode, voucherNo, amount: amt, transactionId: tx.id });
    }

    await account.update({ currentBalance: runningBalance }, { transaction: t });
    await t.commit();

    res.status(201).json({
      success: true,
      data: {
        count: vouchers.length,
        totalPaid: totalNet,
        currency: account.currency,
        accountId: account.id,
        accountName: account.name,
        finalBalance: runningBalance,
        vouchers,
      }
    });
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
});

// ============================================
// BULK RECEIPTS — batch-post many cash receipts to a single account.
// Body: {
//   cashAccountId,
//   rows: [{ amount, payeeName?, description?, occurredAt?, referenceType?, referenceId? }]
// }
// Designed for donor / fundraiser receipt batches the accountant enters from
// a spreadsheet. Every row is a Receipt (In). Atomic — if any row fails
// validation, none post. Each row still gets its own voucher number.
// ============================================
export const bulkReceipts = asyncHandler(async (req, res) => {
  const { cashAccountId, rows } = req.body;

  if (!cashAccountId) {
    throw new BadRequestError('cashAccountId is required');
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new BadRequestError('rows must be a non-empty array');
  }
  if (rows.length > 200) {
    throw new BadRequestError('Maximum 200 rows per batch — split larger imports');
  }

  // Validate every row's amount up front before opening the transaction.
  const cleanRows = rows.map((r, idx) => {
    const amt = Number(r.amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      throw new BadRequestError(`Row ${idx + 1}: invalid amount (${r.amount})`);
    }
    return {
      amount: amt,
      payeeName: r.payeeName ? String(r.payeeName).slice(0, 200) : null,
      description: r.description ? String(r.description).slice(0, 500) : null,
      occurredAt: r.occurredAt ? new Date(r.occurredAt) : new Date(),
      referenceType: r.referenceType ? String(r.referenceType).slice(0, 50) : null,
      referenceId:   r.referenceId   ? Number(r.referenceId) || null : null,
    };
  });

  const totalIn = cleanRows.reduce((s, r) => s + r.amount, 0);

  const t = await sequelize.transaction();
  try {
    const account = await lockAccount(cashAccountId, t);
    const startingBalance = Number(account.currentBalance);

    // Imprest ceiling check up-front for petty-cash accounts.
    if (account.type === 'PettyCash' && Number(account.imprestLimit) > 0
        && startingBalance + totalIn > Number(account.imprestLimit)) {
      throw new BadRequestError(
        `Batch would push ${account.name} above its imprest limit `
        + `(${account.currency} ${account.imprestLimit}). Starting: ${startingBalance}, batch total: ${totalIn}.`
      );
    }

    let runningBalance = startingBalance;
    const vouchers = [];

    for (const r of cleanRows) {
      runningBalance += r.amount;
      const voucherNo = await nextVoucherNo(account.id, t);
      const tx = await CashTransaction.create({
        cashAccountId: account.id,
        transactionType: 'Receipt',
        direction: 'In',
        amount: r.amount,
        currency: account.currency,
        balanceAfter: runningBalance,
        voucherNo,
        referenceType: r.referenceType,
        referenceId: r.referenceId,
        payeeName: r.payeeName,
        description: r.description,
        status: 'Posted',
        performedBy: req.user.id,
        occurredAt: r.occurredAt,
      }, { transaction: t });
      vouchers.push({ voucherNo, amount: r.amount, transactionId: tx.id });
    }

    await account.update({ currentBalance: runningBalance }, { transaction: t });
    await t.commit();

    res.status(201).json({
      success: true,
      data: {
        count: vouchers.length,
        totalReceived: totalIn,
        currency: account.currency,
        accountId: account.id,
        accountName: account.name,
        finalBalance: runningBalance,
        vouchers,
      }
    });
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
});
