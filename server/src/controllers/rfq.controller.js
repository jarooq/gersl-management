import {
  RFQ,
  RFQVendor,
  Vendor,
  PurchaseRequisition,
  User
} from '../models/index.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';
import {
  asyncHandler,
  BadRequestError,
  NotFoundError,
  ConflictError
} from '../middleware/error.middleware.js';

const rfqInclude = [
  { model: PurchaseRequisition, as: 'requisition' },
  { model: User, as: 'creator', attributes: ['id', 'fullName', 'email', 'role'] },
  { model: User, as: 'sender',  attributes: ['id', 'fullName', 'email', 'role'] },
  {
    model: RFQVendor,
    as: 'invitations',
    include: [{ model: Vendor, as: 'vendor' }]
  }
];

const generateRfqNumber = async () => {
  const year = new Date().getFullYear();
  // Simple sequential per-year suffix; collisions retried via unique constraint.
  const count = await RFQ.count({
    where: {
      createdAt: {
        [Op.gte]: new Date(`${year}-01-01T00:00:00Z`),
        [Op.lt]:  new Date(`${year + 1}-01-01T00:00:00Z`)
      }
    }
  });
  return `RFQ-${year}-${String(count + 1).padStart(4, '0')}`;
};

// ============================================
// LIST (filterable by requisition, status)
// ============================================
export const listRFQs = asyncHandler(async (req, res) => {
  const { requisitionId, status, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const where = {};
  if (requisitionId) where.requisitionId = parseInt(requisitionId, 10);
  if (status) where.status = status;

  const { rows, count } = await RFQ.findAndCountAll({
    where,
    limit: parseInt(limit, 10),
    offset,
    order: [['createdAt', 'DESC']],
    include: rfqInclude
  });

  res.json({
    success: true,
    data: {
      rfqs: rows,
      pagination: { total: count, page: parseInt(page, 10), pages: Math.ceil(count / parseInt(limit, 10)) }
    }
  });
});

export const getRFQ = asyncHandler(async (req, res) => {
  const rfq = await RFQ.findByPk(req.params.id, { include: rfqInclude });
  if (!rfq) throw new NotFoundError('RFQ not found');
  res.json({ success: true, data: { rfq } });
});

// ============================================
// CREATE — from a requisition
// ============================================
export const createRFQ = asyncHandler(async (req, res) => {
  const {
    requisitionId,
    scopeOfWork,
    closingDate,
    termsOfDelivery,
    paymentTerms,
    attachments,
    vendorIds = []
  } = req.body;

  if (!requisitionId) throw new BadRequestError('requisitionId is required');

  const requisition = await PurchaseRequisition.findByPk(requisitionId);
  if (!requisition) throw new NotFoundError('Purchase requisition not found');

  if (closingDate && new Date(closingDate) <= new Date()) {
    throw new BadRequestError('closingDate must be in the future');
  }

  const t = await sequelize.transaction();
  try {
    const rfqNumber = await generateRfqNumber();

    const rfq = await RFQ.create({
      rfqNumber,
      requisitionId: requisition.id,
      scopeOfWork,
      closingDate,
      termsOfDelivery,
      paymentTerms,
      attachments: Array.isArray(attachments) ? attachments : [],
      status: 'Draft',
      createdBy: req.user.id
    }, { transaction: t });

    if (vendorIds.length > 0) {
      const vendors = await Vendor.findAll({
        where: { id: vendorIds, status: 'Active' },
        transaction: t
      });
      if (vendors.length !== vendorIds.length) {
        throw new BadRequestError('One or more vendor IDs are invalid or inactive');
      }
      await RFQVendor.bulkCreate(
        vendors.map(v => ({
          rfqId: rfq.id,
          vendorId: v.id,
          invitedAt: new Date()
        })),
        { transaction: t }
      );
    }

    // Move the requisition into In-Sourcing if it isn't already further along.
    if (['Pending', 'Submitted', 'Assigned', 'Approved'].includes(requisition.status)) {
      await requisition.update({ status: 'In-Sourcing' }, { transaction: t });
    }

    await t.commit();

    const reloaded = await RFQ.findByPk(rfq.id, { include: rfqInclude });
    res.status(201).json({ success: true, data: { rfq: reloaded } });
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
});

// ============================================
// INVITE additional vendors after draft
// ============================================
export const inviteVendors = asyncHandler(async (req, res) => {
  const { vendorIds } = req.body;
  if (!Array.isArray(vendorIds) || vendorIds.length === 0) {
    throw new BadRequestError('vendorIds must be a non-empty array');
  }

  const rfq = await RFQ.findByPk(req.params.id);
  if (!rfq) throw new NotFoundError('RFQ not found');
  if (rfq.status === 'Closed' || rfq.status === 'Cancelled') {
    throw new BadRequestError(`Cannot invite vendors to a ${rfq.status.toLowerCase()} RFQ`);
  }

  const vendors = await Vendor.findAll({
    where: { id: vendorIds, status: 'Active' }
  });
  if (vendors.length !== vendorIds.length) {
    throw new BadRequestError('One or more vendor IDs are invalid or inactive');
  }

  // Filter out vendors that are already invited (idempotent invite).
  const existing = await RFQVendor.findAll({
    where: { rfqId: rfq.id, vendorId: vendorIds },
    attributes: ['vendorId']
  });
  const existingIds = new Set(existing.map(e => e.vendorId));
  const toCreate = vendors
    .filter(v => !existingIds.has(v.id))
    .map(v => ({ rfqId: rfq.id, vendorId: v.id, invitedAt: new Date() }));

  if (toCreate.length > 0) {
    await RFQVendor.bulkCreate(toCreate);
  }

  const reloaded = await RFQ.findByPk(rfq.id, { include: rfqInclude });
  res.json({
    success: true,
    data: {
      rfq: reloaded,
      addedCount: toCreate.length,
      alreadyInvitedCount: vendors.length - toCreate.length
    }
  });
});

// ============================================
// SEND — mark sent + stamp invitations + (best-effort) email
// ============================================
export const sendRFQ = asyncHandler(async (req, res) => {
  const rfq = await RFQ.findByPk(req.params.id, {
    include: [{ model: RFQVendor, as: 'invitations', include: [{ model: Vendor, as: 'vendor' }] }]
  });
  if (!rfq) throw new NotFoundError('RFQ not found');
  if (rfq.status === 'Sent') throw new ConflictError('RFQ already sent');
  if (rfq.status === 'Closed' || rfq.status === 'Cancelled') {
    throw new BadRequestError(`Cannot send a ${rfq.status.toLowerCase()} RFQ`);
  }
  if (!rfq.invitations || rfq.invitations.length === 0) {
    throw new BadRequestError('Invite at least one vendor before sending');
  }
  if (!rfq.closingDate) throw new BadRequestError('Set a closingDate before sending');
  if (new Date(rfq.closingDate) <= new Date()) {
    throw new BadRequestError('closingDate must be in the future');
  }

  const now = new Date();
  const t = await sequelize.transaction();
  try {
    await rfq.update({ status: 'Sent', sentAt: now, sentBy: req.user.id }, { transaction: t });
    await RFQVendor.update(
      { sentAt: now },
      { where: { rfqId: rfq.id, sentAt: null }, transaction: t }
    );
    await t.commit();
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }

  // Best-effort email to each invited vendor. Failures are logged, not thrown.
  try {
    const { sendEmail } = await import('../utils/emailService.js');
    const subject = `RFQ ${rfq.rfqNumber} — Request for Quotation`;
    const closingStr = new Date(rfq.closingDate).toLocaleString();
    for (const inv of rfq.invitations) {
      const vendor = inv.vendor;
      if (!vendor?.email) continue;
      const text = [
        `Dear ${vendor.contactPerson || vendor.vendorName},`,
        '',
        `You are invited to submit a quotation for ${rfq.rfqNumber}.`,
        rfq.scopeOfWork ? `\nScope of work:\n${rfq.scopeOfWork}` : '',
        rfq.termsOfDelivery ? `\nTerms of delivery: ${rfq.termsOfDelivery}` : '',
        rfq.paymentTerms ? `Payment terms: ${rfq.paymentTerms}` : '',
        `Closing date: ${closingStr}`,
        '',
        'Please reply to this email with your quotation before the closing date.',
        '',
        '— GERSL Procurement'
      ].filter(Boolean).join('\n');
      await sendEmail(vendor.email, { subject, text, html: `<pre>${text}</pre>` })
        .catch(e => console.error(`RFQ email to ${vendor.email} failed:`, e.message));
    }
  } catch (e) {
    console.error('RFQ email dispatch failed:', e.message);
  }

  const reloaded = await RFQ.findByPk(rfq.id, { include: rfqInclude });
  res.json({ success: true, data: { rfq: reloaded } });
});

// ============================================
// CLOSE — manual close (e.g. closing date passed and all quotes received)
// ============================================
export const closeRFQ = asyncHandler(async (req, res) => {
  const rfq = await RFQ.findByPk(req.params.id);
  if (!rfq) throw new NotFoundError('RFQ not found');
  if (rfq.status !== 'Sent') {
    throw new BadRequestError(`Only Sent RFQs can be closed (current: ${rfq.status})`);
  }
  await rfq.update({ status: 'Closed', closedAt: new Date() });
  const reloaded = await RFQ.findByPk(rfq.id, { include: rfqInclude });
  res.json({ success: true, data: { rfq: reloaded } });
});

// ============================================
// CANCEL
// ============================================
export const cancelRFQ = asyncHandler(async (req, res) => {
  const rfq = await RFQ.findByPk(req.params.id);
  if (!rfq) throw new NotFoundError('RFQ not found');
  if (rfq.status === 'Cancelled' || rfq.status === 'Closed') {
    throw new BadRequestError(`RFQ is already ${rfq.status.toLowerCase()}`);
  }
  await rfq.update({
    status: 'Cancelled',
    cancelReason: req.body?.reason || null,
    closedAt: new Date()
  });
  const reloaded = await RFQ.findByPk(rfq.id, { include: rfqInclude });
  res.json({ success: true, data: { rfq: reloaded } });
});
