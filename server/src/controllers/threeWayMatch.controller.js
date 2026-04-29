import {
  ThreeWayMatch,
  PurchaseOrder,
  GoodsReceiptNote,
  GRNLine,
  POLine,
  Bill,
  Vendor,
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

const matchInclude = [
  { model: PurchaseOrder,    as: 'po',  include: [{ model: Vendor, as: 'vendor' }, { model: POLine, as: 'lines' }] },
  { model: GoodsReceiptNote, as: 'grn', include: [{ model: GRNLine, as: 'lines' }] },
  { model: User,             as: 'matcher',  attributes: ['id', 'fullName', 'role'] },
  { model: User,             as: 'resolver', attributes: ['id', 'fullName', 'role'] }
];

const QTY_TOLERANCE = 0.01;
const PRICE_TOLERANCE = 0.05;     // 5% variance allowed by default
const VARIANCE_AMOUNT_TOLERANCE = 100; // LKR 100 absorbed automatically

const pickInvoiceTotal = (invoice) => {
  if (!invoice) return null;
  return Number(invoice.totalAmount ?? invoice.total ?? invoice.amount ?? 0);
};

// ============================================
// LIST
// ============================================
export const listMatches = asyncHandler(async (req, res) => {
  const { poId, grnId, invoiceId, status } = req.query;
  const where = {};
  if (poId)      where.poId      = parseInt(poId, 10);
  if (grnId)     where.grnId     = parseInt(grnId, 10);
  if (invoiceId) where.invoiceId = parseInt(invoiceId, 10);
  if (status)    where.status    = status;
  const rows = await ThreeWayMatch.findAll({
    where,
    include: matchInclude,
    order: [['createdAt', 'DESC']]
  });
  res.json({ success: true, data: { matches: rows } });
});

export const getMatch = asyncHandler(async (req, res) => {
  const m = await ThreeWayMatch.findByPk(req.params.id, { include: matchInclude });
  if (!m) throw new NotFoundError('Three-way match not found');
  res.json({ success: true, data: { match: m } });
});

// ============================================
// CREATE — runs the match logic against PO/GRN/Invoice
// Body: { poId, grnId, invoiceId? }
// ============================================
export const createMatch = asyncHandler(async (req, res) => {
  const { poId, grnId, invoiceId } = req.body;
  if (!poId || !grnId) throw new BadRequestError('poId and grnId are required');

  const po = await PurchaseOrder.findByPk(poId, { include: [{ model: POLine, as: 'lines' }, { model: Vendor, as: 'vendor' }] });
  if (!po) throw new NotFoundError('Purchase order not found');
  const grn = await GoodsReceiptNote.findByPk(grnId, { include: [{ model: GRNLine, as: 'lines' }] });
  if (!grn) throw new NotFoundError('GRN not found');
  if (grn.poId !== po.id) throw new BadRequestError('GRN does not belong to this PO');
  if (!['Verified', 'Partial'].includes(grn.status)) {
    throw new BadRequestError(`Cannot match against an unverified GRN (status: ${grn.status})`);
  }

  let invoice = null;
  if (invoiceId) {
    invoice = await Bill.findByPk(invoiceId);
    if (!invoice) throw new BadRequestError('invoiceId is invalid');
  }

  // 1. Quantity match: every PO line must be received in full (within tolerance).
  let qtyMatch = po.lines.length > 0;
  for (const pl of po.lines) {
    const totalAccepted = grn.lines
      .filter(gl => gl.poLineId === pl.id)
      .reduce((acc, gl) => acc + Number(gl.qtyAccepted), 0);
    if (Math.abs(totalAccepted - Number(pl.qty)) > QTY_TOLERANCE) {
      qtyMatch = false;
      break;
    }
  }

  // 2. Price match: invoice total == PO total (within tolerance) when invoice present.
  const invoiceTotal = pickInvoiceTotal(invoice);
  const poTotal = Number(po.totalAmount);
  let priceMatch = true;
  let varianceAmount = 0;
  if (invoice) {
    varianceAmount = Number((invoiceTotal - poTotal).toFixed(2));
    const ratio = poTotal > 0 ? Math.abs(varianceAmount) / poTotal : 0;
    priceMatch = Math.abs(varianceAmount) <= VARIANCE_AMOUNT_TOLERANCE || ratio <= PRICE_TOLERANCE;
  }

  // 3. Vendor match: invoice vendor must equal PO vendor (when invoice present).
  let vendorMatch = true;
  if (invoice && invoice.vendorId != null && po.vendorId != null) {
    vendorMatch = Number(invoice.vendorId) === Number(po.vendorId);
  }

  const fullMatch = qtyMatch && priceMatch && vendorMatch;

  // Prevent duplicate matched rows for the same triple.
  const existing = await ThreeWayMatch.findOne({
    where: { poId, grnId, invoiceId: invoiceId || null, status: { [Op.notIn]: ['Discrepancy'] } }
  });
  if (existing) throw new ConflictError(`Match already exists (#${existing.id})`);

  const t = await sequelize.transaction();
  try {
    const match = await ThreeWayMatch.create({
      poId,
      grnId,
      invoiceId: invoiceId || null,
      qtyMatch,
      priceMatch,
      vendorMatch,
      varianceAmount,
      status: fullMatch ? 'Matched' : 'Discrepancy',
      matchedBy: req.user.id,
      matchedAt: new Date()
    }, { transaction: t });

    // If everything matches and PO is fully received, close it.
    if (fullMatch && po.status === 'Received') {
      await po.update({ status: 'Closed' }, { transaction: t });
    }
    await t.commit();
    const reloaded = await ThreeWayMatch.findByPk(match.id, { include: matchInclude });
    res.status(201).json({ success: true, data: { match: reloaded } });
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
});

// ============================================
// RESOLVE — Manager / CEO override for a Discrepancy with reason
// Body: { reason, force?: 'Matched' | 'Discrepancy' }
// ============================================
export const resolveMatch = asyncHandler(async (req, res) => {
  const { reason, force = 'Matched' } = req.body || {};
  const match = await ThreeWayMatch.findByPk(req.params.id);
  if (!match) throw new NotFoundError('Three-way match not found');
  if (match.status === 'Matched') throw new ConflictError('Match is already resolved');
  if (!reason) throw new BadRequestError('reason is required');
  if (!['Matched', 'Discrepancy', 'Overridden'].includes(force)) {
    throw new BadRequestError('force must be Matched, Discrepancy, or Overridden');
  }

  // Only Manager / CEO / Admin can override a Discrepancy to Matched.
  if (force === 'Matched' || force === 'Overridden') {
    if (!['Admin', 'CEO', 'Procurement Manager', 'Finance Manager'].includes(req.user.role)) {
      throw new ForbiddenError('Only Procurement Manager, Finance Manager, CEO or Admin can override a discrepancy');
    }
  }

  await match.update({
    status: force,
    overrideReason: reason,
    resolvedBy: req.user.id,
    resolvedAt: new Date()
  });
  const reloaded = await ThreeWayMatch.findByPk(match.id, { include: matchInclude });
  res.json({ success: true, data: { match: reloaded } });
});

// ============================================
// CHECK — payment-block helper used by the bill payment flow
// Returns the latest match status for a given (poId, invoiceId) pair.
// ============================================
export const checkPaymentEligibility = asyncHandler(async (req, res) => {
  const { poId, invoiceId } = req.query;
  if (!poId || !invoiceId) throw new BadRequestError('poId and invoiceId are required');
  const match = await ThreeWayMatch.findOne({
    where: { poId: parseInt(poId, 10), invoiceId: parseInt(invoiceId, 10) },
    order: [['createdAt', 'DESC']]
  });
  const eligible = !!match && (match.status === 'Matched' || match.status === 'Overridden');
  res.json({
    success: true,
    data: {
      eligible,
      match: match ? { id: match.id, status: match.status, varianceAmount: match.varianceAmount } : null,
      reason: !match ? 'No match record exists for this PO/invoice' :
              match.status === 'Discrepancy' ? 'Discrepancy must be resolved before payment' :
              null
    }
  });
});
