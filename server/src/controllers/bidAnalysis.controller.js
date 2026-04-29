import {
  BidAnalysis,
  BidAnalysisScore,
  Quotation,
  QuotationLine,
  PurchaseRequisition,
  RFQ,
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

const baInclude = [
  { model: PurchaseRequisition, as: 'requisition' },
  { model: RFQ,    as: 'rfq' },
  { model: Vendor, as: 'recommendedVendor' },
  { model: User,   as: 'preparer', attributes: ['id', 'fullName', 'role'] },
  { model: User,   as: 'reviewer', attributes: ['id', 'fullName', 'role'] },
  { model: User,   as: 'approver', attributes: ['id', 'fullName', 'role'] },
  {
    model: BidAnalysisScore,
    as: 'scores',
    include: [{ model: Vendor, as: 'vendor' }]
  }
];

const validateCriteria = (criteria) => {
  if (!criteria || typeof criteria !== 'object') {
    throw new BadRequestError('scoringCriteria object is required');
  }
  const entries = Object.entries(criteria);
  if (entries.length === 0) throw new BadRequestError('scoringCriteria must define at least one criterion');
  for (const [k, v] of entries) {
    const w = Number(v);
    if (!Number.isFinite(w) || w < 0 || w > 100) {
      throw new BadRequestError(`Weight for "${k}" must be a number between 0 and 100`);
    }
  }
  const total = entries.reduce((acc, [, v]) => acc + Number(v), 0);
  if (Math.abs(total - 100) > 0.01) {
    throw new BadRequestError(`scoringCriteria weights must total 100 (got ${total})`);
  }
};

// ============================================
// LIST bid analyses (filter by requisition or rfq)
// ============================================
export const listBidAnalyses = asyncHandler(async (req, res) => {
  const { requisitionId, rfqId, status } = req.query;
  const where = {};
  if (requisitionId) where.requisitionId = parseInt(requisitionId, 10);
  if (rfqId) where.rfqId = parseInt(rfqId, 10);
  if (status) where.status = status;

  const rows = await BidAnalysis.findAll({
    where,
    order: [['createdAt', 'DESC']],
    include: baInclude
  });
  res.json({ success: true, data: { bidAnalyses: rows } });
});

export const getBidAnalysis = asyncHandler(async (req, res) => {
  const ba = await BidAnalysis.findByPk(req.params.id, { include: baInclude });
  if (!ba) throw new NotFoundError('Bid analysis not found');
  res.json({ success: true, data: { bidAnalysis: ba } });
});

// ============================================
// CREATE bid analysis
// Body: { requisitionId, rfqId?, scoringCriteria{}, scores: [{ vendorId, criterionKey, rawScore, quotationId? }],
//         recommendedVendorId?, rationale? }
// ============================================
export const createBidAnalysis = asyncHandler(async (req, res) => {
  const {
    requisitionId,
    rfqId,
    scoringCriteria,
    scores = [],
    recommendedVendorId,
    rationale
  } = req.body;

  if (!requisitionId) throw new BadRequestError('requisitionId is required');
  validateCriteria(scoringCriteria);

  const requisition = await PurchaseRequisition.findByPk(requisitionId);
  if (!requisition) throw new NotFoundError('Purchase requisition not found');

  if (rfqId) {
    const rfq = await RFQ.findByPk(rfqId);
    if (!rfq) throw new BadRequestError('rfqId is invalid');
    if (rfq.requisitionId !== requisition.id) throw new BadRequestError('RFQ does not belong to this requisition');
  }

  // Validate scores reference known criteria + vendors with quotations on the RFQ.
  const criteriaKeys = new Set(Object.keys(scoringCriteria));
  for (const s of scores) {
    if (!criteriaKeys.has(s.criterionKey)) {
      throw new BadRequestError(`Unknown criterionKey "${s.criterionKey}"`);
    }
    const raw = Number(s.rawScore);
    if (!Number.isFinite(raw) || raw < 0 || raw > 100) {
      throw new BadRequestError(`rawScore for ${s.criterionKey} must be 0-100`);
    }
  }

  const t = await sequelize.transaction();
  try {
    const ba = await BidAnalysis.create({
      requisitionId: requisition.id,
      rfqId: rfqId || null,
      scoringCriteria,
      recommendedVendorId: recommendedVendorId || null,
      rationale: rationale || null,
      status: 'Draft',
      preparedBy: req.user.id
    }, { transaction: t });

    if (scores.length > 0) {
      const rows = scores.map(s => ({
        bidAnalysisId: ba.id,
        vendorId: s.vendorId,
        quotationId: s.quotationId || null,
        criterionKey: s.criterionKey,
        rawScore: Number(s.rawScore),
        weightedScore: Number((Number(s.rawScore) * Number(scoringCriteria[s.criterionKey]) / 100).toFixed(3))
      }));
      await BidAnalysisScore.bulkCreate(rows, { transaction: t });
    }

    await t.commit();
    const reloaded = await BidAnalysis.findByPk(ba.id, { include: baInclude });
    res.status(201).json({ success: true, data: { bidAnalysis: reloaded } });
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
});

// ============================================
// UPDATE (only Draft)
// ============================================
export const updateBidAnalysis = asyncHandler(async (req, res) => {
  const ba = await BidAnalysis.findByPk(req.params.id);
  if (!ba) throw new NotFoundError('Bid analysis not found');
  if (ba.status !== 'Draft') throw new ForbiddenError('Only Draft bid analyses can be edited');

  const { scoringCriteria, scores, recommendedVendorId, rationale } = req.body;
  const t = await sequelize.transaction();
  try {
    const patch = {};
    if (scoringCriteria) {
      validateCriteria(scoringCriteria);
      patch.scoringCriteria = scoringCriteria;
    }
    if (recommendedVendorId !== undefined) patch.recommendedVendorId = recommendedVendorId;
    if (rationale !== undefined) patch.rationale = rationale;
    if (Object.keys(patch).length > 0) await ba.update(patch, { transaction: t });

    if (Array.isArray(scores)) {
      const criteria = patch.scoringCriteria || ba.scoringCriteria;
      const criteriaKeys = new Set(Object.keys(criteria || {}));
      for (const s of scores) {
        if (!criteriaKeys.has(s.criterionKey)) {
          throw new BadRequestError(`Unknown criterionKey "${s.criterionKey}"`);
        }
      }
      await BidAnalysisScore.destroy({ where: { bidAnalysisId: ba.id }, transaction: t });
      const rows = scores.map(s => ({
        bidAnalysisId: ba.id,
        vendorId: s.vendorId,
        quotationId: s.quotationId || null,
        criterionKey: s.criterionKey,
        rawScore: Number(s.rawScore),
        weightedScore: Number((Number(s.rawScore) * Number(criteria[s.criterionKey]) / 100).toFixed(3))
      }));
      if (rows.length > 0) await BidAnalysisScore.bulkCreate(rows, { transaction: t });
    }

    await t.commit();
    const reloaded = await BidAnalysis.findByPk(ba.id, { include: baInclude });
    res.json({ success: true, data: { bidAnalysis: reloaded } });
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
});

// ============================================
// SUBMIT (Draft -> Submitted)
// ============================================
export const submitBidAnalysis = asyncHandler(async (req, res) => {
  const ba = await BidAnalysis.findByPk(req.params.id);
  if (!ba) throw new NotFoundError('Bid analysis not found');
  if (ba.status !== 'Draft') throw new ConflictError(`Cannot submit a ${ba.status} bid analysis`);
  if (!ba.recommendedVendorId) throw new BadRequestError('recommendedVendorId is required before submission');

  await ba.update({ status: 'Submitted', submittedAt: new Date() });
  const reloaded = await BidAnalysis.findByPk(ba.id, { include: baInclude });
  res.json({ success: true, data: { bidAnalysis: reloaded } });
});

// ============================================
// APPROVE (Submitted -> Approved) — locks linked quotations
// ============================================
export const approveBidAnalysis = asyncHandler(async (req, res) => {
  const ba = await BidAnalysis.findByPk(req.params.id);
  if (!ba) throw new NotFoundError('Bid analysis not found');
  if (ba.status !== 'Submitted') throw new ConflictError(`Cannot approve a ${ba.status} bid analysis`);

  const t = await sequelize.transaction();
  try {
    await ba.update({
      status: 'Approved',
      approvedBy: req.user.id,
      approvedAt: new Date(),
      reviewedBy: req.user.id
    }, { transaction: t });

    // Lock all quotations on the linked RFQ so they can't be edited after the decision.
    if (ba.rfqId) {
      await Quotation.update(
        { isLocked: true },
        { where: { rfqId: ba.rfqId }, transaction: t }
      );
    }
    await t.commit();
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }

  const reloaded = await BidAnalysis.findByPk(ba.id, { include: baInclude });
  res.json({ success: true, data: { bidAnalysis: reloaded } });
});

// ============================================
// REJECT (Submitted -> Rejected) with reason
// ============================================
export const rejectBidAnalysis = asyncHandler(async (req, res) => {
  const { reason } = req.body || {};
  const ba = await BidAnalysis.findByPk(req.params.id);
  if (!ba) throw new NotFoundError('Bid analysis not found');
  if (ba.status !== 'Submitted') throw new ConflictError(`Cannot reject a ${ba.status} bid analysis`);
  if (!reason) throw new BadRequestError('reason is required');

  await ba.update({
    status: 'Rejected',
    reviewedBy: req.user.id,
    rejectionReason: reason
  });
  const reloaded = await BidAnalysis.findByPk(ba.id, { include: baInclude });
  res.json({ success: true, data: { bidAnalysis: reloaded } });
});
