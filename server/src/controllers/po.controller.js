import {
  PurchaseOrder,
  POLine,
  PurchaseRequisition,
  BidAnalysis,
  Vendor,
  Quotation,
  QuotationLine,
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
import { renderPurchaseOrderHTML } from '../utils/poDocument.js';

const poInclude = [
  { model: PurchaseRequisition, as: 'requisition' },
  { model: Vendor,              as: 'vendor' },
  { model: BidAnalysis,         as: 'bidAnalysis' },
  { model: Quotation,           as: 'quotation' },
  { model: User,                as: 'creator',  attributes: ['id', 'fullName', 'role'] },
  { model: User,                as: 'approver', attributes: ['id', 'fullName', 'role'] },
  { model: User,                as: 'issuer',   attributes: ['id', 'fullName', 'role'] },
  { model: POLine,              as: 'lines' }
];

const generatePoNumber = async () => {
  const year = new Date().getFullYear();
  const count = await PurchaseOrder.count({
    where: {
      createdAt: {
        [Op.gte]: new Date(`${year}-01-01T00:00:00Z`),
        [Op.lt]:  new Date(`${year + 1}-01-01T00:00:00Z`)
      }
    }
  });
  return `PO-${year}-${String(count + 1).padStart(4, '0')}`;
};

const recomputeTotals = (lines, taxRate = 0) => {
  const subtotal = lines.reduce(
    (acc, l) => acc + Number(l.qty || 0) * Number(l.unitPrice || 0),
    0
  );
  const tax = Number(taxRate) || 0;
  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    total: Number((subtotal + tax).toFixed(2))
  };
};

// ============================================
// LIST / GET
// ============================================
export const listPOs = asyncHandler(async (req, res) => {
  const { status, vendorId, requisitionId, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const where = {};
  if (status) where.status = status;
  if (vendorId) where.vendorId = parseInt(vendorId, 10);
  if (requisitionId) where.requisitionId = parseInt(requisitionId, 10);

  const { rows, count } = await PurchaseOrder.findAndCountAll({
    where,
    limit: parseInt(limit, 10),
    offset,
    order: [['createdAt', 'DESC']],
    include: poInclude
  });
  res.json({
    success: true,
    data: {
      pos: rows,
      pagination: { total: count, page: parseInt(page, 10), pages: Math.ceil(count / parseInt(limit, 10)) }
    }
  });
});

export const getPO = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findByPk(req.params.id, { include: poInclude });
  if (!po) throw new NotFoundError('Purchase order not found');
  res.json({ success: true, data: { po } });
});

// ============================================
// DRAFT — from an approved bid analysis
// Body: { bidAnalysisId, deliveryDate?, deliveryAddress?, paymentTerms?, tax? }
// ============================================
export const draftPOFromBidAnalysis = asyncHandler(async (req, res) => {
  const { bidAnalysisId, deliveryDate, deliveryAddress, paymentTerms, tax = 0, requiredDate } = req.body;
  if (!bidAnalysisId) throw new BadRequestError('bidAnalysisId is required');

  const ba = await BidAnalysis.findByPk(bidAnalysisId, {
    include: [
      { model: Vendor, as: 'recommendedVendor' },
      { model: PurchaseRequisition, as: 'requisition' }
    ]
  });
  if (!ba) throw new NotFoundError('Bid analysis not found');
  if (ba.status !== 'Approved') {
    throw new BadRequestError('Bid analysis must be Approved to draft a PO');
  }
  if (!ba.recommendedVendorId) {
    throw new BadRequestError('Bid analysis has no recommended vendor');
  }

  const winningQuotation = await Quotation.findOne({
    where: { rfqId: ba.rfqId, vendorId: ba.recommendedVendorId },
    include: [{ model: QuotationLine, as: 'lines' }]
  });
  if (!winningQuotation) {
    throw new BadRequestError('No quotation found for the recommended vendor on this RFQ');
  }

  const existing = await PurchaseOrder.findOne({
    where: {
      bidAnalysisId: ba.id,
      status: { [Op.notIn]: ['Cancelled', 'Closed'] }
    }
  });
  if (existing) throw new ConflictError(`PO ${existing.poNumber} already exists for this bid analysis`);

  const lineSnapshots = (winningQuotation.lines || []).map(l => ({
    itemDescription: l.itemDescription,
    qty: Number(l.qty),
    unit: l.unit,
    unitPrice: Number(l.unitPrice),
    lineTotal: Number(l.lineTotal ?? Number(l.qty) * Number(l.unitPrice))
  }));
  const totals = recomputeTotals(lineSnapshots, tax);
  const totalFromQuotation = Number(winningQuotation.totalAmount);
  // If the quotation didn't have line items, fall back to its totalAmount.
  const total = lineSnapshots.length > 0 ? totals.total : totalFromQuotation + Number(tax || 0);
  const subtotal = lineSnapshots.length > 0 ? totals.subtotal : totalFromQuotation;

  const t = await sequelize.transaction();
  try {
    const poNumber = await generatePoNumber();
    const po = await PurchaseOrder.create({
      poNumber,
      requestDate: new Date(),
      requiredDate: requiredDate || null,
      vendorName: ba.recommendedVendor?.vendorName || `Vendor #${ba.recommendedVendorId}`,
      vendorContact: ba.recommendedVendor?.contactPerson || null,
      vendorId: ba.recommendedVendorId,
      requisitionId: ba.requisitionId,
      bidAnalysisId: ba.id,
      quotationId: winningQuotation.id,
      department: ba.requisition?.department || null,
      requestorName: null,
      subtotal,
      tax: Number(tax) || 0,
      totalAmount: total,
      currency: winningQuotation.currency || 'LKR',
      paymentTerms: paymentTerms || winningQuotation.paymentTerms || null,
      deliveryAddress: deliveryAddress || null,
      deliveryDate: deliveryDate || null,
      status: 'Draft',
      approvalStatus: 'Pending',
      createdBy: req.user.id
    }, { transaction: t });

    if (lineSnapshots.length > 0) {
      await POLine.bulkCreate(
        lineSnapshots.map(l => ({ poId: po.id, ...l })),
        { transaction: t }
      );
    }

    await t.commit();
    const reloaded = await PurchaseOrder.findByPk(po.id, { include: poInclude });
    res.status(201).json({ success: true, data: { po: reloaded } });
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
});

// ============================================
// UPDATE (Draft only — terms / lines / dates)
// ============================================
export const updatePO = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findByPk(req.params.id, { include: [{ model: POLine, as: 'lines' }] });
  if (!po) throw new NotFoundError('Purchase order not found');
  if (!['Draft', 'Pending-Approval'].includes(po.status)) {
    throw new ForbiddenError(`Cannot edit a ${po.status} PO`);
  }

  const {
    deliveryDate,
    deliveryAddress,
    paymentTerms,
    tax,
    specialInstructions,
    requiredDate,
    lines
  } = req.body;

  const t = await sequelize.transaction();
  try {
    if (Array.isArray(lines)) {
      await POLine.destroy({ where: { poId: po.id }, transaction: t });
      const computed = lines.map(l => ({
        poId: po.id,
        itemDescription: l.itemDescription,
        qty: Number(l.qty || 1),
        unit: l.unit,
        unitPrice: Number(l.unitPrice || 0),
        lineTotal: Number(((Number(l.qty || 1)) * Number(l.unitPrice || 0)).toFixed(2)),
        glAccountId: l.glAccountId || null,
        projectId: l.projectId || null
      }));
      if (computed.length > 0) await POLine.bulkCreate(computed, { transaction: t });
      const totals = recomputeTotals(computed, tax ?? po.tax);
      await po.update(
        { subtotal: totals.subtotal, tax: totals.tax, totalAmount: totals.total },
        { transaction: t }
      );
    } else if (tax != null) {
      const existingLines = po.lines || [];
      const totals = recomputeTotals(existingLines, tax);
      await po.update(
        { subtotal: totals.subtotal, tax: totals.tax, totalAmount: totals.total },
        { transaction: t }
      );
    }

    const patch = {};
    if (deliveryDate !== undefined) patch.deliveryDate = deliveryDate;
    if (deliveryAddress !== undefined) patch.deliveryAddress = deliveryAddress;
    if (paymentTerms !== undefined) patch.paymentTerms = paymentTerms;
    if (specialInstructions !== undefined) patch.specialInstructions = specialInstructions;
    if (requiredDate !== undefined) patch.requiredDate = requiredDate;
    if (Object.keys(patch).length > 0) await po.update(patch, { transaction: t });

    await t.commit();
    const reloaded = await PurchaseOrder.findByPk(po.id, { include: poInclude });
    res.json({ success: true, data: { po: reloaded } });
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
});

// ============================================
// SUBMIT for approval (Draft → Pending-Approval)
// ============================================
export const submitPO = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findByPk(req.params.id);
  if (!po) throw new NotFoundError('Purchase order not found');
  if (po.status !== 'Draft') throw new ConflictError(`Cannot submit a ${po.status} PO`);
  await po.update({ status: 'Pending-Approval', approvalStatus: 'Pending' });
  const reloaded = await PurchaseOrder.findByPk(po.id, { include: poInclude });
  res.json({ success: true, data: { po: reloaded } });
});

// ============================================
// APPROVE (Pending-Approval → Approved)
// ============================================
export const approvePO = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findByPk(req.params.id);
  if (!po) throw new NotFoundError('Purchase order not found');
  if (po.status !== 'Pending-Approval') {
    throw new ConflictError(`Cannot approve a ${po.status} PO`);
  }
  await po.update({
    status: 'Approved',
    approvalStatus: 'Approved',
    approvedBy: req.user.id,
    approvalDate: new Date(),
    approvalNotes: req.body?.notes || null
  });
  const reloaded = await PurchaseOrder.findByPk(po.id, { include: poInclude });
  res.json({ success: true, data: { po: reloaded } });
});

// ============================================
// REJECT — sends PO back to Draft with reason
// ============================================
export const rejectPO = asyncHandler(async (req, res) => {
  const { reason } = req.body || {};
  const po = await PurchaseOrder.findByPk(req.params.id);
  if (!po) throw new NotFoundError('Purchase order not found');
  if (po.status !== 'Pending-Approval') {
    throw new ConflictError(`Cannot reject a ${po.status} PO`);
  }
  if (!reason) throw new BadRequestError('reason is required');
  await po.update({
    status: 'Draft',
    approvalStatus: 'Rejected',
    approvalNotes: reason
  });
  const reloaded = await PurchaseOrder.findByPk(po.id, { include: poInclude });
  res.json({ success: true, data: { po: reloaded } });
});

// ============================================
// ISSUE — emails vendor with PO HTML, marks Issued
// ============================================
export const issuePO = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findByPk(req.params.id, { include: poInclude });
  if (!po) throw new NotFoundError('Purchase order not found');
  if (po.status !== 'Approved') {
    throw new ConflictError(`Cannot issue a ${po.status} PO (must be Approved)`);
  }

  const vendor = po.vendor;
  if (!vendor?.email) {
    throw new BadRequestError('Vendor has no email on file — cannot issue');
  }

  const issuedAt = new Date();
  await po.update({ status: 'Issued', issuedAt, issuedBy: req.user.id });

  const reloaded = await PurchaseOrder.findByPk(po.id, { include: poInclude });
  const html = renderPurchaseOrderHTML(reloaded.toJSON());

  // Best-effort send. Issuance is recorded regardless of SMTP.
  try {
    const { sendEmail } = await import('../utils/emailService.js');
    await sendEmail(vendor.email, {
      subject: `Purchase Order ${reloaded.poNumber} — GERSL`,
      html,
      text: `Purchase Order ${reloaded.poNumber} issued. Total ${reloaded.currency} ${reloaded.totalAmount}. Reply to acknowledge.`
    });
  } catch (e) {
    console.error(`PO email to ${vendor.email} failed:`, e.message);
  }

  res.json({ success: true, data: { po: reloaded } });
});

// ============================================
// ACKNOWLEDGE (vendor confirms — for now Manager records on behalf of vendor)
// ============================================
export const acknowledgePO = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findByPk(req.params.id);
  if (!po) throw new NotFoundError('Purchase order not found');
  if (po.status !== 'Issued') throw new ConflictError(`Only Issued POs can be acknowledged`);
  await po.update({ status: 'Acknowledged', acknowledgedAt: new Date() });
  const reloaded = await PurchaseOrder.findByPk(po.id, { include: poInclude });
  res.json({ success: true, data: { po: reloaded } });
});

// ============================================
// CANCEL
// ============================================
export const cancelPO = asyncHandler(async (req, res) => {
  const { reason } = req.body || {};
  const po = await PurchaseOrder.findByPk(req.params.id);
  if (!po) throw new NotFoundError('Purchase order not found');
  if (['Cancelled', 'Closed', 'Received'].includes(po.status)) {
    throw new ConflictError(`Cannot cancel a ${po.status} PO`);
  }
  await po.update({ status: 'Cancelled', cancelReason: reason || null });
  const reloaded = await PurchaseOrder.findByPk(po.id, { include: poInclude });
  res.json({ success: true, data: { po: reloaded } });
});

// ============================================
// HTML preview for in-app print/download
// ============================================
export const previewPOHtml = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findByPk(req.params.id, { include: poInclude });
  if (!po) throw new NotFoundError('Purchase order not found');
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(renderPurchaseOrderHTML(po.toJSON()));
});
