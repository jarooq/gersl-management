import {
  GoodsReceiptNote,
  GRNLine,
  PurchaseOrder,
  POLine,
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

const grnInclude = [
  { model: PurchaseOrder, as: 'po', include: [{ model: Vendor, as: 'vendor' }] },
  { model: User, as: 'receiver', attributes: ['id', 'fullName', 'role'] },
  { model: User, as: 'verifier', attributes: ['id', 'fullName', 'role'] },
  {
    model: GRNLine,
    as: 'lines',
    include: [{ model: POLine, as: 'poLine' }]
  }
];

const generateGrnNumber = async () => {
  const year = new Date().getFullYear();
  const count = await GoodsReceiptNote.count({
    where: {
      createdAt: {
        [Op.gte]: new Date(`${year}-01-01T00:00:00Z`),
        [Op.lt]:  new Date(`${year + 1}-01-01T00:00:00Z`)
      }
    }
  });
  return `GRN-${year}-${String(count + 1).padStart(4, '0')}`;
};

// ============================================
// LIST per PO
// ============================================
export const listGRNsForPO = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findByPk(req.params.id);
  if (!po) throw new NotFoundError('Purchase order not found');
  const grns = await GoodsReceiptNote.findAll({
    where: { poId: po.id },
    include: grnInclude,
    order: [['receivedAt', 'DESC']]
  });
  res.json({ success: true, data: { grns } });
});

export const getGRN = asyncHandler(async (req, res) => {
  const grn = await GoodsReceiptNote.findByPk(req.params.id, { include: grnInclude });
  if (!grn) throw new NotFoundError('GRN not found');
  res.json({ success: true, data: { grn } });
});

// ============================================
// CREATE — record what physically arrived against a PO
// Body: { deliveryNoteNo?, deliveryNoteUrl?, photos[]?, receivedAt?, location?, conditionNotes?,
//         lines: [{ poLineId, qtyReceived, qtyAccepted?, qtyRejected?, rejectionReason? }] }
// ============================================
export const createGRN = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findByPk(req.params.id, { include: [{ model: POLine, as: 'lines' }] });
  if (!po) throw new NotFoundError('Purchase order not found');
  if (!['Issued', 'Acknowledged', 'Partial-Received'].includes(po.status)) {
    throw new BadRequestError(`Cannot record receipt against a ${po.status} PO`);
  }

  const {
    deliveryNoteNo,
    deliveryNoteUrl,
    photos = [],
    receivedAt,
    location,
    conditionNotes,
    lines = []
  } = req.body;

  if (!Array.isArray(lines) || lines.length === 0) {
    throw new BadRequestError('At least one line is required');
  }

  // Validate poLineId references on this PO.
  const poLineIds = new Set((po.lines || []).map(l => l.id));
  for (const l of lines) {
    if (l.poLineId && !poLineIds.has(Number(l.poLineId))) {
      throw new BadRequestError(`poLineId ${l.poLineId} does not belong to this PO`);
    }
    if (Number(l.qtyReceived) < 0) throw new BadRequestError('qtyReceived must be >= 0');
    const accepted = Number(l.qtyAccepted ?? l.qtyReceived);
    const rejected = Number(l.qtyRejected ?? 0);
    if (Math.abs((accepted + rejected) - Number(l.qtyReceived)) > 0.001) {
      throw new BadRequestError('qtyAccepted + qtyRejected must equal qtyReceived');
    }
  }

  const t = await sequelize.transaction();
  try {
    const grnNumber = await generateGrnNumber();
    const grn = await GoodsReceiptNote.create({
      grnNumber,
      poId: po.id,
      deliveryNoteNo,
      deliveryNoteUrl,
      photos: Array.isArray(photos) ? photos : [],
      receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
      receivedBy: req.user.id,
      location,
      conditionNotes,
      status: 'Draft'
    }, { transaction: t });

    await GRNLine.bulkCreate(
      lines.map(l => ({
        grnId: grn.id,
        poLineId: l.poLineId || null,
        itemDescription: l.itemDescription,
        qtyReceived: Number(l.qtyReceived),
        qtyAccepted: Number(l.qtyAccepted ?? l.qtyReceived),
        qtyRejected: Number(l.qtyRejected ?? 0),
        rejectionReason: l.rejectionReason || null
      })),
      { transaction: t }
    );

    await t.commit();
    const reloaded = await GoodsReceiptNote.findByPk(grn.id, { include: grnInclude });
    res.status(201).json({ success: true, data: { grn: reloaded } });
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
});

// ============================================
// VERIFY (Draft -> Verified or Partial)
// Auto-rolls PO status to Partial-Received / Received based on totals.
// ============================================
export const verifyGRN = asyncHandler(async (req, res) => {
  const grn = await GoodsReceiptNote.findByPk(req.params.id, {
    include: [
      { model: GRNLine, as: 'lines' },
      { model: PurchaseOrder, as: 'po', include: [{ model: POLine, as: 'lines' }] }
    ]
  });
  if (!grn) throw new NotFoundError('GRN not found');
  if (grn.status !== 'Draft') throw new ConflictError(`GRN is already ${grn.status}`);

  // Block self-verification (segregation of duties)
  if (grn.receivedBy && grn.receivedBy === req.user.id && req.user.role !== 'Admin') {
    throw new ForbiddenError('Receiver cannot verify their own GRN');
  }

  // Determine if partial or full receipt against the PO.
  const t = await sequelize.transaction();
  try {
    const acceptedByPoLine = new Map();
    for (const line of grn.lines) {
      if (!line.poLineId) continue;
      const prev = acceptedByPoLine.get(line.poLineId) || 0;
      acceptedByPoLine.set(line.poLineId, prev + Number(line.qtyAccepted));
    }

    // Sum prior verified GRNs to see cumulative receipt vs PO.
    const allGrns = await GoodsReceiptNote.findAll({
      where: { poId: grn.poId, status: { [Op.in]: ['Verified', 'Partial'] } },
      include: [{ model: GRNLine, as: 'lines' }],
      transaction: t
    });
    const cumulative = new Map();
    for (const g of allGrns) {
      for (const l of g.lines) {
        if (!l.poLineId) continue;
        cumulative.set(l.poLineId, (cumulative.get(l.poLineId) || 0) + Number(l.qtyAccepted));
      }
    }
    // Add this GRN's accepted qty as well.
    for (const [k, v] of acceptedByPoLine) {
      cumulative.set(k, (cumulative.get(k) || 0) + v);
    }

    const poLines = grn.po?.lines || [];
    let allComplete = poLines.length > 0;
    for (const pl of poLines) {
      const recvd = cumulative.get(pl.id) || 0;
      if (recvd + 0.001 < Number(pl.qty)) { allComplete = false; break; }
    }
    const grnStatus = allComplete ? 'Verified' : 'Partial';
    const poStatus = allComplete ? 'Received' : 'Partial-Received';

    await grn.update(
      { status: grnStatus, verifiedBy: req.user.id, verifiedAt: new Date() },
      { transaction: t }
    );
    if (grn.po && grn.po.status !== 'Received') {
      await grn.po.update({ status: poStatus }, { transaction: t });
    }

    await t.commit();
    const reloaded = await GoodsReceiptNote.findByPk(grn.id, { include: grnInclude });
    res.json({ success: true, data: { grn: reloaded } });
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
});

// ============================================
// REJECT a GRN with reason (Draft -> Rejected)
// ============================================
export const rejectGRN = asyncHandler(async (req, res) => {
  const { reason } = req.body || {};
  const grn = await GoodsReceiptNote.findByPk(req.params.id);
  if (!grn) throw new NotFoundError('GRN not found');
  if (grn.status !== 'Draft') throw new ConflictError(`GRN is already ${grn.status}`);
  if (!reason) throw new BadRequestError('reason is required');
  await grn.update({
    status: 'Rejected',
    verifiedBy: req.user.id,
    verifiedAt: new Date(),
    rejectionReason: reason
  });
  const reloaded = await GoodsReceiptNote.findByPk(grn.id, { include: grnInclude });
  res.json({ success: true, data: { grn: reloaded } });
});
