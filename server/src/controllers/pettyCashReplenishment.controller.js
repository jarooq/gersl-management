import {
  CashAccount,
  CashTransaction,
  PettyCashReplenishment,
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

const include = [
  { model: CashAccount, as: 'pettyCashAccount', attributes: ['id', 'name', 'type', 'currency', 'currentBalance', 'imprestLimit'] },
  { model: CashAccount, as: 'sourceAccount',    attributes: ['id', 'name', 'type', 'currency', 'currentBalance'] },
  { model: User,        as: 'requester', attributes: ['id', 'fullName', 'role'] },
  { model: User,        as: 'approver',  attributes: ['id', 'fullName', 'role'] },
  { model: User,        as: 'disburser', attributes: ['id', 'fullName', 'role'] },
  { model: CashTransaction, as: 'disbursementTx', attributes: ['id', 'voucherNo', 'amount', 'balanceAfter'] }
];

const APPROVE_ROLES = ['Admin', 'CEO', 'Finance Manager'];

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
// LIST (custodian self / manager queue)
// ============================================
export const listReplenishments = asyncHandler(async (req, res) => {
  const { pettyCashAccountId, status, mine } = req.query;
  const where = {};
  if (pettyCashAccountId) where.pettyCashAccountId = parseInt(pettyCashAccountId, 10);
  if (status) where.status = status;
  if (String(mine) === 'true') where.requestedBy = req.user.id;

  const rows = await PettyCashReplenishment.findAll({
    where,
    include,
    order: [['createdAt', 'DESC']]
  });
  res.json({ success: true, data: { replenishments: rows } });
});

export const getReplenishment = asyncHandler(async (req, res) => {
  const r = await PettyCashReplenishment.findByPk(req.params.id, { include });
  if (!r) throw new NotFoundError('Replenishment not found');
  res.json({ success: true, data: { replenishment: r } });
});

// ============================================
// REQUEST — custodian asks for a top-up
// Body: { pettyCashAccountId, sourceAccountId?, notes? }
// ============================================
export const requestReplenishment = asyncHandler(async (req, res) => {
  const { pettyCashAccountId, sourceAccountId, notes } = req.body;
  if (!pettyCashAccountId) throw new BadRequestError('pettyCashAccountId is required');

  const acc = await CashAccount.findByPk(pettyCashAccountId);
  if (!acc) throw new NotFoundError('Petty cash account not found');
  if (acc.type !== 'PettyCash') throw new BadRequestError('Replenishment is only valid for PettyCash accounts');
  if (!acc.imprestLimit || Number(acc.imprestLimit) <= 0) {
    throw new BadRequestError('Petty cash account must have an imprestLimit configured');
  }

  // Block if there's an open request already.
  const open = await PettyCashReplenishment.findOne({
    where: {
      pettyCashAccountId: acc.id,
      status: { [Op.in]: ['Requested', 'Approved'] }
    }
  });
  if (open) throw new ConflictError(`An open replenishment exists for this account (#${open.id})`);

  // Permission: only the custodian (or alt) or a Manager can request.
  const isCustodian = acc.custodianUserId === req.user.id || acc.altCustodianUserId === req.user.id;
  if (!isCustodian && !APPROVE_ROLES.includes(req.user.role)) {
    throw new ForbiddenError('Only the petty cash custodian or a Finance Manager can request replenishment');
  }

  if (sourceAccountId) {
    const src = await CashAccount.findByPk(sourceAccountId);
    if (!src) throw new BadRequestError('sourceAccountId is invalid');
    if (src.id === acc.id) throw new BadRequestError('source must differ from petty cash account');
    if (src.currency !== acc.currency) throw new BadRequestError('source currency must match petty cash currency');
    if (!['CashBook', 'Locker'].includes(src.type)) {
      throw new BadRequestError('source must be a CashBook or Locker account');
    }
  }

  const requested = Number(acc.imprestLimit) - Number(acc.currentBalance);
  if (requested <= 0) {
    throw new BadRequestError('Petty cash is at or above imprest limit — nothing to replenish');
  }

  // Pull every Posted Out transaction since the previous Disbursed replenishment.
  const lastDisbursed = await PettyCashReplenishment.findOne({
    where: { pettyCashAccountId: acc.id, status: 'Disbursed' },
    order: [['disbursedAt', 'DESC']]
  });
  const since = lastDisbursed?.disbursedAt || acc.openingDate || new Date(0);

  const vouchers = await CashTransaction.findAll({
    where: {
      cashAccountId: acc.id,
      direction: 'Out',
      status: 'Posted',
      transactionType: { [Op.in]: ['Payment', 'Adjustment'] },
      occurredAt: { [Op.gt]: since }
    },
    attributes: ['id'],
    order: [['occurredAt', 'ASC']]
  });

  const r = await PettyCashReplenishment.create({
    pettyCashAccountId: acc.id,
    sourceAccountId: sourceAccountId || null,
    requestedAmount: Number(requested.toFixed(2)),
    currency: acc.currency,
    status: 'Requested',
    voucherIds: vouchers.map(v => v.id),
    requestedBy: req.user.id,
    requestedAt: new Date(),
    notes: notes || null
  });
  const reloaded = await PettyCashReplenishment.findByPk(r.id, { include });
  res.status(201).json({ success: true, data: { replenishment: reloaded } });
});

// ============================================
// APPROVE — Manager approves with optional approvedAmount + sourceAccountId
// Body: { approvedAmount?, sourceAccountId?, notes? }
// ============================================
export const approveReplenishment = asyncHandler(async (req, res) => {
  if (!APPROVE_ROLES.includes(req.user.role)) {
    throw new ForbiddenError('Only Finance Manager / CEO / Admin can approve replenishments');
  }
  const { approvedAmount, sourceAccountId, notes } = req.body || {};
  const r = await PettyCashReplenishment.findByPk(req.params.id);
  if (!r) throw new NotFoundError('Replenishment not found');
  if (r.status !== 'Requested') throw new ConflictError(`Cannot approve a ${r.status} replenishment`);

  const amt = approvedAmount != null ? Number(approvedAmount) : Number(r.requestedAmount);
  if (!Number.isFinite(amt) || amt <= 0) throw new BadRequestError('approvedAmount must be > 0');

  if (sourceAccountId) {
    const src = await CashAccount.findByPk(sourceAccountId);
    if (!src) throw new BadRequestError('sourceAccountId is invalid');
    if (src.currency !== r.currency) throw new BadRequestError('source currency must match');
    if (!['CashBook', 'Locker'].includes(src.type)) {
      throw new BadRequestError('source must be a CashBook or Locker account');
    }
  }

  await r.update({
    status: 'Approved',
    approvedAmount: amt,
    sourceAccountId: sourceAccountId || r.sourceAccountId,
    approvedBy: req.user.id,
    approvedAt: new Date(),
    notes: notes ?? r.notes
  });
  const reloaded = await PettyCashReplenishment.findByPk(r.id, { include });
  res.json({ success: true, data: { replenishment: reloaded } });
});

// ============================================
// REJECT
// ============================================
export const rejectReplenishment = asyncHandler(async (req, res) => {
  if (!APPROVE_ROLES.includes(req.user.role)) {
    throw new ForbiddenError('Only Finance Manager / CEO / Admin can reject replenishments');
  }
  const { reason } = req.body || {};
  if (!reason) throw new BadRequestError('reason is required');
  const r = await PettyCashReplenishment.findByPk(req.params.id);
  if (!r) throw new NotFoundError('Replenishment not found');
  if (r.status !== 'Requested') throw new ConflictError(`Cannot reject a ${r.status} replenishment`);

  await r.update({
    status: 'Rejected',
    approvedBy: req.user.id,
    approvedAt: new Date(),
    rejectionReason: reason
  });
  const reloaded = await PettyCashReplenishment.findByPk(r.id, { include });
  res.json({ success: true, data: { replenishment: reloaded } });
});

// ============================================
// DISBURSE — posts a Transfer pair (source -> petty)
// ============================================
export const disburseReplenishment = asyncHandler(async (req, res) => {
  if (!APPROVE_ROLES.includes(req.user.role)) {
    throw new ForbiddenError('Only Finance Manager / CEO / Admin can disburse replenishments');
  }

  const t = await sequelize.transaction();
  try {
    const r = await PettyCashReplenishment.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!r) throw new NotFoundError('Replenishment not found');
    if (r.status !== 'Approved') throw new ConflictError(`Cannot disburse a ${r.status} replenishment`);
    if (!r.sourceAccountId) throw new BadRequestError('sourceAccountId is required to disburse');
    const amt = Number(r.approvedAmount);
    if (!Number.isFinite(amt) || amt <= 0) throw new BadRequestError('approvedAmount is invalid');

    // Lock both accounts in stable order to avoid deadlock.
    const [aId, bId] = Number(r.sourceAccountId) < Number(r.pettyCashAccountId)
      ? [r.sourceAccountId, r.pettyCashAccountId]
      : [r.pettyCashAccountId, r.sourceAccountId];
    const [accA, accB] = await Promise.all([lockAccount(aId, t), lockAccount(bId, t)]);
    const fromAcc = accA.id === Number(r.sourceAccountId)    ? accA : accB;
    const toAcc   = accA.id === Number(r.pettyCashAccountId) ? accA : accB;

    if (fromAcc.currency !== toAcc.currency) {
      throw new BadRequestError('Cross-currency transfers not supported');
    }
    const newFrom = Number(fromAcc.currentBalance) - amt;
    if (newFrom < 0) throw new BadRequestError('Source balance insufficient');
    const newTo = Number(toAcc.currentBalance) + amt;

    const occurred = new Date();
    const outVoucher = await nextVoucherNo(fromAcc.id, t);
    const inVoucher  = await nextVoucherNo(toAcc.id, t);

    const outTx = await CashTransaction.create({
      cashAccountId: fromAcc.id,
      transactionType: 'Transfer',
      direction: 'Out',
      amount: amt,
      currency: fromAcc.currency,
      balanceAfter: newFrom,
      voucherNo: outVoucher,
      referenceType: 'Replenishment',
      referenceId: r.id,
      counterpartyAccountId: toAcc.id,
      description: `Petty cash replenishment #${r.id}`,
      status: 'Posted',
      performedBy: req.user.id,
      approvedBy: req.user.id,
      approvedAt: occurred,
      occurredAt: occurred
    }, { transaction: t });

    const inTx = await CashTransaction.create({
      cashAccountId: toAcc.id,
      transactionType: 'Transfer',
      direction: 'In',
      amount: amt,
      currency: toAcc.currency,
      balanceAfter: newTo,
      voucherNo: inVoucher,
      referenceType: 'Replenishment',
      referenceId: r.id,
      counterpartyAccountId: fromAcc.id,
      pairId: outTx.id,
      description: `Petty cash replenishment #${r.id}`,
      status: 'Posted',
      performedBy: req.user.id,
      approvedBy: req.user.id,
      approvedAt: occurred,
      occurredAt: occurred
    }, { transaction: t });

    await outTx.update({ pairId: inTx.id }, { transaction: t });
    await fromAcc.update({ currentBalance: newFrom }, { transaction: t });
    await toAcc.update  ({ currentBalance: newTo   }, { transaction: t });

    await r.update({
      status: 'Disbursed',
      disbursedBy: req.user.id,
      disbursedAt: occurred,
      disbursementTxId: outTx.id
    }, { transaction: t });

    await t.commit();
    const reloaded = await PettyCashReplenishment.findByPk(r.id, { include });
    res.json({ success: true, data: { replenishment: reloaded } });
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
});

// ============================================
// CANCEL — Requested only, by requester or manager
// ============================================
export const cancelReplenishment = asyncHandler(async (req, res) => {
  const r = await PettyCashReplenishment.findByPk(req.params.id);
  if (!r) throw new NotFoundError('Replenishment not found');
  if (r.status !== 'Requested') throw new ConflictError(`Cannot cancel a ${r.status} replenishment`);
  const isOwner = r.requestedBy === req.user.id;
  if (!isOwner && !APPROVE_ROLES.includes(req.user.role)) {
    throw new ForbiddenError('Only the requester or a Manager can cancel a Requested replenishment');
  }
  await r.update({ status: 'Cancelled' });
  const reloaded = await PettyCashReplenishment.findByPk(r.id, { include });
  res.json({ success: true, data: { replenishment: reloaded } });
});
