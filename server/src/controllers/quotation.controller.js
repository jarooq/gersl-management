import {
  Quotation,
  QuotationLine,
  RFQ,
  RFQVendor,
  Vendor,
  User
} from '../models/index.js';
import sequelize from '../config/database.js';
import {
  asyncHandler,
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError
} from '../middleware/error.middleware.js';

const quotationInclude = [
  { model: Vendor, as: 'vendor' },
  { model: User,   as: 'recorder', attributes: ['id', 'fullName', 'role'] },
  { model: QuotationLine, as: 'lines' }
];

const computeLineTotals = (lines = []) =>
  lines.map(l => {
    const qty = Number(l.qty ?? 1);
    const unitPrice = Number(l.unitPrice ?? 0);
    return {
      ...l,
      lineTotal: Number((qty * unitPrice).toFixed(2))
    };
  });

const sumLines = (lines) =>
  Number(lines.reduce((acc, l) => acc + Number(l.lineTotal || 0), 0).toFixed(2));

const ensureRfqAcceptsQuotations = (rfq) => {
  if (!rfq) throw new NotFoundError('RFQ not found');
  if (rfq.status === 'Cancelled') throw new BadRequestError('RFQ is cancelled');
  // Allow Sent or Closed (sometimes quotations arrive late and are accepted by exception).
  if (!['Sent', 'Closed', 'Draft'].includes(rfq.status)) {
    throw new BadRequestError(`RFQ status ${rfq.status} does not accept quotations`);
  }
};

// ============================================
// LIST quotations for an RFQ
// ============================================
export const listQuotationsForRFQ = asyncHandler(async (req, res) => {
  const rfq = await RFQ.findByPk(req.params.id);
  if (!rfq) throw new NotFoundError('RFQ not found');

  const quotations = await Quotation.findAll({
    where: { rfqId: rfq.id },
    include: quotationInclude,
    order: [['receivedAt', 'ASC']]
  });

  res.json({ success: true, data: { quotations } });
});

export const getQuotation = asyncHandler(async (req, res) => {
  const q = await Quotation.findByPk(req.params.id, { include: quotationInclude });
  if (!q) throw new NotFoundError('Quotation not found');
  res.json({ success: true, data: { quotation: q } });
});

// ============================================
// CREATE quotation for an RFQ
// ============================================
export const createQuotation = asyncHandler(async (req, res) => {
  const rfq = await RFQ.findByPk(req.params.id);
  ensureRfqAcceptsQuotations(rfq);

  const {
    vendorId,
    totalAmount,
    currency = 'LKR',
    deliveryDays,
    validityDays,
    paymentTerms,
    technicalComplianceScore,
    attachments = [],
    notes,
    receivedAt,
    lines = []
  } = req.body;

  if (!vendorId) throw new BadRequestError('vendorId is required');
  if (!Array.isArray(lines)) throw new BadRequestError('lines must be an array');

  // Vendor must be one of those invited on this RFQ.
  const invited = await RFQVendor.findOne({ where: { rfqId: rfq.id, vendorId } });
  if (!invited) {
    throw new BadRequestError('Vendor was not invited to this RFQ');
  }
  const existing = await Quotation.findOne({ where: { rfqId: rfq.id, vendorId } });
  if (existing) throw new ConflictError('Quotation already recorded for this vendor on this RFQ');

  const computed = computeLineTotals(lines);
  const computedTotal = computed.length > 0 ? sumLines(computed) : Number(totalAmount);
  if (totalAmount != null && computed.length > 0 && Math.abs(computedTotal - Number(totalAmount)) > 0.01) {
    throw new BadRequestError(`totalAmount (${totalAmount}) does not match sum of line totals (${computedTotal})`);
  }
  const finalTotal = totalAmount != null ? Number(totalAmount) : computedTotal;
  if (!Number.isFinite(finalTotal) || finalTotal < 0) {
    throw new BadRequestError('totalAmount is required and must be non-negative');
  }

  const t = await sequelize.transaction();
  try {
    const quotation = await Quotation.create({
      rfqId: rfq.id,
      vendorId,
      totalAmount: finalTotal,
      currency,
      deliveryDays,
      validityDays,
      paymentTerms,
      technicalComplianceScore,
      attachments: Array.isArray(attachments) ? attachments : [],
      notes,
      receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
      recordedBy: req.user.id
    }, { transaction: t });

    if (computed.length > 0) {
      await QuotationLine.bulkCreate(
        computed.map(l => ({
          quotationId: quotation.id,
          itemDescription: l.itemDescription,
          qty: l.qty,
          unit: l.unit,
          unitPrice: l.unitPrice,
          lineTotal: l.lineTotal
        })),
        { transaction: t }
      );
    }

    // Mark the invitation as having received a response.
    await invited.update({ responseReceivedAt: new Date() }, { transaction: t });

    await t.commit();
    const reloaded = await Quotation.findByPk(quotation.id, { include: quotationInclude });
    res.status(201).json({ success: true, data: { quotation: reloaded } });
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
});

// ============================================
// UPDATE quotation (only while not locked)
// ============================================
export const updateQuotation = asyncHandler(async (req, res) => {
  const q = await Quotation.findByPk(req.params.id, { include: [{ model: QuotationLine, as: 'lines' }] });
  if (!q) throw new NotFoundError('Quotation not found');
  if (q.isLocked) throw new ForbiddenError('Quotation is locked because a bid analysis has been approved');

  const {
    totalAmount,
    currency,
    deliveryDays,
    validityDays,
    paymentTerms,
    technicalComplianceScore,
    attachments,
    notes,
    receivedAt,
    lines
  } = req.body;

  const t = await sequelize.transaction();
  try {
    if (Array.isArray(lines)) {
      await QuotationLine.destroy({ where: { quotationId: q.id }, transaction: t });
      const computed = computeLineTotals(lines);
      if (computed.length > 0) {
        await QuotationLine.bulkCreate(
          computed.map(l => ({
            quotationId: q.id,
            itemDescription: l.itemDescription,
            qty: l.qty,
            unit: l.unit,
            unitPrice: l.unitPrice,
            lineTotal: l.lineTotal
          })),
          { transaction: t }
        );
      }
    }

    const patch = {};
    if (totalAmount != null) patch.totalAmount = Number(totalAmount);
    if (currency !== undefined) patch.currency = currency;
    if (deliveryDays !== undefined) patch.deliveryDays = deliveryDays;
    if (validityDays !== undefined) patch.validityDays = validityDays;
    if (paymentTerms !== undefined) patch.paymentTerms = paymentTerms;
    if (technicalComplianceScore !== undefined) patch.technicalComplianceScore = technicalComplianceScore;
    if (attachments !== undefined) patch.attachments = attachments;
    if (notes !== undefined) patch.notes = notes;
    if (receivedAt !== undefined) patch.receivedAt = receivedAt ? new Date(receivedAt) : null;
    if (Object.keys(patch).length > 0) await q.update(patch, { transaction: t });

    await t.commit();
    const reloaded = await Quotation.findByPk(q.id, { include: quotationInclude });
    res.json({ success: true, data: { quotation: reloaded } });
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
});

// ============================================
// DELETE quotation (only while not locked)
// ============================================
export const deleteQuotation = asyncHandler(async (req, res) => {
  const q = await Quotation.findByPk(req.params.id);
  if (!q) throw new NotFoundError('Quotation not found');
  if (q.isLocked) throw new ForbiddenError('Quotation is locked');
  await q.destroy();
  res.json({ success: true, message: 'Quotation deleted' });
});
