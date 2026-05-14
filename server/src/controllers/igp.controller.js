// =============================================================================
// IGP controller — donor-funded income-generating asset distribution.
//
// Same operational shape as WASH (donor → order → individual asset for one
// named beneficiary), differences:
//   - assets are mixed (Sewing Machine + Canoe + Bicycle in one order)
//   - optional training component (sewing requires a course, bicycle doesn't)
//   - follow-up monitoring tracks income change vs baseline
//
// Endpoints under /api/igp/* (see routes/igp.routes.js).
// =============================================================================

import { Op } from 'sequelize';
import {
  IgpOrder, IgpItem, IgpStageUpdate,
  Partner, Project, Proposal, Vendor, User, Beneficiary,
  sequelize,
} from '../models/index.js';
import { asyncHandler, NotFoundError, BadRequestError, ForbiddenError } from '../middleware/error.middleware.js';
import { createNextStageTask } from '../utils/programmeTasks.js';
import { isFullView } from '../utils/programmeAccess.js';
import { assertStageForward, assertEvidenceForStage, assertItemAssignment, geofenceWarning } from '../utils/stageGuard.js';
import { assertOrderWithinBudget, recalcProjectSpent } from '../utils/budgetGuard.js';

const STAGE_ORDER = ['Ordered', 'Surveyed', 'Procured', 'Training', 'Delivered', 'FollowUp', 'Reported', 'Cancelled'];
// IGP "evidence-critical" — photos + GPS required from procurement onwards.
const IGP_EVIDENCE_STAGES = ['Procured', 'Training', 'Delivered', 'FollowUp', 'Reported'];
const STAGE_TIMESTAMP_FIELD = {
  Surveyed:  'surveyedAt',
  Procured:  'procuredAt',
  Delivered: 'deliveredAt',
  Reported:  'reportedAt',
};

const orderCode = (id) => `IO-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`;
const itemCode  = (id) => `II-${new Date().getFullYear()}-${String(id).padStart(5, '0')}`;
const tempOrder = () => `IO-TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const tempItem  = () => `II-TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const orderIncludes = [
  { model: Partner,  as: 'donor',    attributes: ['id', 'name', 'partnerCode'] },
  { model: Project,  as: 'project',  attributes: ['id', 'name', 'projectCode'] },
  { model: Proposal, as: 'proposal', attributes: ['id', 'proposalCode', 'title'] },
  { model: User,     as: 'creator',  attributes: ['id', 'fullName'] },
];

const itemIncludes = [
  { model: Beneficiary, as: 'beneficiary', attributes: ['id', 'beneficiaryId', 'fullName', 'nic', 'district', 'household_lat', 'household_lng'] },
  { model: Vendor,      as: 'contractor',  attributes: ['id', 'name', 'contactPerson'] },
  { model: User,        as: 'supervisor',  attributes: ['id', 'fullName'] },
  { model: User,        as: 'trainer',     attributes: ['id', 'fullName'] },
];

// ============================================================================
// ORDERS
// ============================================================================

export const listOrders = asyncHandler(async (req, res) => {
  const { status, donorId, projectId, search, paymentStatus } = req.query;
  const where = {};
  if (status)        where.status = status;
  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (donorId)       where.donorId   = parseInt(donorId, 10);
  if (projectId)     where.projectId = parseInt(projectId, 10);
  if (search) {
    where[Op.or] = [
      { orderCode: { [Op.iLike]: `%${search}%` } },
      { title:     { [Op.iLike]: `%${search}%` } },
      { donorRef:  { [Op.iLike]: `%${search}%` } },
    ];
  }
  // Field-level users only see orders where they supervise at least one item.
  const orderInclude = [...orderIncludes];
  if (!isFullView(req.user) && req.user?.id) {
    orderInclude.push({
      model: IgpItem, as: 'items',
      attributes: ['id'],
      where: { assignedSupervisorId: req.user.id },
      required: true,
    });
  }
  const rows = await IgpOrder.findAll({
    where,
    include: orderInclude,
    order: [['deadline', 'ASC'], ['createdAt', 'DESC']],
    limit: 200,
  });
  res.json({ success: true, data: rows });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await IgpOrder.findByPk(req.params.id, { include: orderIncludes });
  if (!order) throw new NotFoundError('IGP order not found');
  const items = await IgpItem.findAll({
    where: { orderId: order.id },
    attributes: ['id', 'stage', 'assetType', 'actualCost', 'plannedCost'],
    raw: true,
  });
  const summary = {
    totalItems:     items.length,
    byStage:        items.reduce((a, it) => ({ ...a, [it.stage]: (a[it.stage] || 0) + 1 }), {}),
    byAssetType:    items.reduce((a, it) => ({ ...a, [it.assetType]: (a[it.assetType] || 0) + 1 }), {}),
    plannedCostSum: items.reduce((s, it) => s + Number(it.plannedCost || 0), 0),
    actualCostSum:  items.reduce((s, it) => s + Number(it.actualCost  || 0), 0),
  };
  res.json({ success: true, data: { order, summary } });
});

export const createOrder = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (!body.title)     throw new BadRequestError('title required');
  if (!body.quantity)  throw new BadRequestError('quantity required');
  if (!body.deadline)  throw new BadRequestError('deadline required');
  if (!body.orderDate) body.orderDate = new Date().toISOString().slice(0, 10);

  if (body.donorId && !body.invoiceTiming) {
    const donor = await Partner.findByPk(body.donorId);
    if (donor) {
      body.invoiceTiming  = donor.paymentTerm === 'AdvanceProforma' ? 'BeforeWork' : 'AfterWork';
      body.donorReporting = donor.reportingFormat || 'PerItem';
    }
  }

  // Budget guard — block creating an order that would push the linked
  // project past its approved budget.
  await assertOrderWithinBudget({ projectId: body.projectId, orderBudget: body.totalBudget });

  body.orderCode = tempOrder();
  body.createdBy = req.user?.id;
  const order = await IgpOrder.create(body);
  await order.update({ orderCode: orderCode(order.id) });

  res.status(201).json({ success: true, data: order });
});

export const updateOrder = asyncHandler(async (req, res) => {
  const order = await IgpOrder.findByPk(req.params.id);
  if (!order) throw new NotFoundError('IGP order not found');
  delete req.body.orderCode;
  delete req.body.createdBy;
  if (req.body.totalBudget != null || req.body.projectId != null) {
    await assertOrderWithinBudget({
      projectId: req.body.projectId ?? order.projectId,
      orderBudget: req.body.totalBudget ?? order.totalBudget,
      excludeIgpId: order.id,
    });
  }
  await order.update(req.body);
  res.json({ success: true, data: order });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await IgpOrder.findByPk(req.params.id);
  if (!order) throw new NotFoundError('IGP order not found');
  await order.update({ status: 'Cancelled' });
  await IgpItem.update(
    { stage: 'Cancelled' },
    { where: { orderId: order.id, stage: { [Op.notIn]: ['Delivered', 'Reported', 'Cancelled'] } } }
  );
  // Refund cancelled budget — Project.spent is sourced from delivered items.
  if (order.projectId) recalcProjectSpent(order.projectId);
  res.json({ success: true, data: order });
});

// ============================================================================
// ITEMS
// ============================================================================

// Bulk add — IGP supports a `mix` of asset types in one order, so callers
// can pass items with differing assetType.
export const bulkCreateItems = asyncHandler(async (req, res) => {
  const order = await IgpOrder.findByPk(req.params.id);
  if (!order) throw new NotFoundError('IGP order not found');
  const rows = Array.isArray(req.body.items) ? req.body.items : [];
  if (rows.length === 0)  throw new BadRequestError('items array required');
  if (rows.length > 500) throw new BadRequestError('max 500 items per request');

  const created = [];
  await sequelize.transaction(async (t) => {
    for (const r of rows) {
      if (!r.assetType) throw new BadRequestError('each item requires assetType');
      const item = await IgpItem.create({
        orderId:           order.id,
        itemCode:          tempItem(),
        assetType:         r.assetType,
        assetSpecification:r.assetSpecification,
        beneficiaryId:     r.beneficiaryId || null,
        beneficiaryName:   r.beneficiaryName,
        beneficiaryNic:    r.beneficiaryNic,
        beneficiaryPhone:  r.beneficiaryPhone,
        householdSize:     r.householdSize,
        province:          r.province,
        district:          r.district,
        dsDivision:        r.dsDivision,
        gnDivision:        r.gnDivision,
        address:           r.address,
        deliveryLat:       r.deliveryLat,
        deliveryLng:       r.deliveryLng,
        plannedCost:       r.plannedCost ?? null,
        trainingRequired:  Boolean(r.trainingRequired),
        trainingHours:     r.trainingHours,
        incomeBaseline:    r.incomeBaseline,
        donorRef:          r.donorRef,
        plannedCompletion: r.plannedCompletion || order.deadline,
        createdBy:         req.user?.id,
      }, { transaction: t });
      await item.update({ itemCode: itemCode(item.id) }, { transaction: t });
      created.push(item);
    }
  });

  res.status(201).json({ success: true, data: { created: created.length, items: created } });
});

export const listItems = asyncHandler(async (req, res) => {
  const { orderId, stage, assetType, district, contractorId, supervisorId, search } = req.query;
  const where = {};
  if (orderId)      where.orderId = parseInt(orderId, 10);
  if (stage)        where.stage = stage;
  if (assetType)    where.assetType = assetType;
  if (district)     where.district = district;
  if (contractorId) where.assignedContractorId = parseInt(contractorId, 10);
  if (supervisorId) where.assignedSupervisorId = parseInt(supervisorId, 10);
  if (search) {
    where[Op.or] = [
      { itemCode:        { [Op.iLike]: `%${search}%` } },
      { beneficiaryName: { [Op.iLike]: `%${search}%` } },
      { beneficiaryNic:  { [Op.iLike]: `%${search}%` } },
      { donorRef:        { [Op.iLike]: `%${search}%` } },
    ];
  }
  // Field-level users only see items they supervise.
  if (!isFullView(req.user) && req.user?.id) {
    where.assignedSupervisorId = req.user.id;
  }
  const rows = await IgpItem.findAll({
    where,
    include: [...itemIncludes, { model: IgpOrder, as: 'order', attributes: ['id', 'orderCode', 'title', 'deadline', 'donorId'] }],
    order: [['createdAt', 'DESC']],
    limit: 500,
  });
  res.json({ success: true, data: rows });
});

export const getItem = asyncHandler(async (req, res) => {
  const item = await IgpItem.findByPk(req.params.id, {
    include: [
      ...itemIncludes,
      { model: IgpOrder, as: 'order', include: [{ model: Partner, as: 'donor' }, { model: Project, as: 'project' }] },
      { model: IgpStageUpdate, as: 'stageUpdates', include: [{ model: User, as: 'updater', attributes: ['id', 'fullName'] }], separate: true, order: [['createdAt', 'DESC']] },
    ],
  });
  if (!item) throw new NotFoundError('IGP item not found');
  res.json({ success: true, data: item });
});

export const updateItem = asyncHandler(async (req, res) => {
  const item = await IgpItem.findByPk(req.params.id);
  if (!item) throw new NotFoundError('IGP item not found');
  delete req.body.stage;
  delete req.body.itemCode;
  await item.update(req.body);
  res.json({ success: true, data: item });
});

export const transitionStage = asyncHandler(async (req, res) => {
  const { newStage, notes, photoUrls, latitude, longitude, percentComplete, source } = req.body;
  if (!STAGE_ORDER.includes(newStage)) throw new BadRequestError(`unknown stage: ${newStage}`);

  const item = await IgpItem.findByPk(req.params.id, {
    include: [
      { model: IgpOrder, as: 'order' },
      { model: Beneficiary, as: 'beneficiary', attributes: ['id', 'household_lat', 'household_lng'] },
    ],
  });
  if (!item) throw new NotFoundError('IGP item not found');

  // Assignment, sequence, and evidence gates — mirror WASH.
  assertItemAssignment({ item, user: req.user });
  assertStageForward({ STAGE_ORDER, currentStage: item.stage, newStage });
  assertEvidenceForStage({
    newStage,
    evidenceStages: IGP_EVIDENCE_STAGES,
    photoUrls,
    latitude,
    longitude,
  });

  const geo = geofenceWarning({ latitude, longitude, beneficiary: item.beneficiary });
  if (geo) res.set('X-Geofence-Warning', String(geo.distance));

  if (item.order?.workStartCondition === 'OnFundsReceived'
      && item.order?.paymentStatus !== 'Paid'
      && newStage !== 'Cancelled') {
    res.set('X-Funds-Gate-Warning', 'true');
  }

  const update = { stage: newStage };
  const stampField = STAGE_TIMESTAMP_FIELD[newStage];
  if (stampField) update[stampField] = new Date();
  if (newStage === 'Training' && !item.trainingCompletedAt) {
    // Allow training stage even if trainingRequired wasn't pre-flagged.
  }
  await item.update(update);

  await IgpStageUpdate.create({
    itemId:          item.id,
    stage:           newStage,
    percentComplete: percentComplete ?? null,
    notes:           notes ?? null,
    photoUrls:       Array.isArray(photoUrls) ? photoUrls : [],
    latitude:        latitude ?? null,
    longitude:       longitude ?? null,
    updatedBy:       req.user?.id,
    source:          source || (req.headers['x-client'] === 'mobile' ? 'mobile' : 'web'),
  });

  // Auto-create a Task for the next operational step. Best-effort —
  // never throws and never blocks the transition response.
  await createNextStageTask({
    kind: 'igp',
    item,
    newStage,
    triggeredBy: req.user?.id,
  });

  // Auto-complete the order when every item is Reported or Cancelled.
  if (newStage === 'Reported' || newStage === 'Cancelled') {
    const openItems = await IgpItem.count({
      where: { orderId: item.orderId, stage: { [Op.notIn]: ['Reported', 'Cancelled'] } },
    });
    if (openItems === 0 && item.order?.status === 'Active') {
      await IgpOrder.update(
        { status: 'Completed', completedAt: new Date() },
        { where: { id: item.orderId } }
      );
    }
  }

  if (item.order?.projectId) recalcProjectSpent(item.order.projectId);

  res.json({ success: true, data: item });
});

export const addStageUpdate = asyncHandler(async (req, res) => {
  const item = await IgpItem.findByPk(req.params.id);
  if (!item) throw new NotFoundError('IGP item not found');
  // Assignment gate — same as WASH.
  assertItemAssignment({ item, user: req.user });
  const { notes, photoUrls, latitude, longitude, percentComplete, source } = req.body;
  const row = await IgpStageUpdate.create({
    itemId:          item.id,
    stage:           item.stage,
    percentComplete: percentComplete ?? null,
    notes:           notes ?? null,
    photoUrls:       Array.isArray(photoUrls) ? photoUrls : [],
    latitude:        latitude ?? null,
    longitude:       longitude ?? null,
    updatedBy:       req.user?.id,
    source:          source || (req.headers['x-client'] === 'mobile' ? 'mobile' : 'web'),
  });
  res.status(201).json({ success: true, data: row });
});

export const listStageUpdates = asyncHandler(async (req, res) => {
  const rows = await IgpStageUpdate.findAll({
    where: { itemId: req.params.id },
    include: [{ model: User, as: 'updater', attributes: ['id', 'fullName'] }],
    order: [['createdAt', 'DESC']],
    limit: 500,
  });
  res.json({ success: true, data: rows });
});

// Record follow-up income capture (for outcome tracking).
export const recordFollowUp = asyncHandler(async (req, res) => {
  const item = await IgpItem.findByPk(req.params.id);
  if (!item) throw new NotFoundError('IGP item not found');
  const { incomeFollowup, notes, photoUrls, latitude, longitude } = req.body;
  await item.update({ incomeFollowup, followUpAt: new Date().toISOString().slice(0, 10), stage: 'FollowUp' });
  await IgpStageUpdate.create({
    itemId:          item.id,
    stage:           'FollowUp',
    percentComplete: 100,
    notes:           notes || `Income follow-up: ${incomeFollowup}`,
    photoUrls:       Array.isArray(photoUrls) ? photoUrls : [],
    latitude:        latitude ?? null,
    longitude:       longitude ?? null,
    updatedBy:       req.user?.id,
    source:          req.headers['x-client'] === 'mobile' ? 'mobile' : 'web',
  });
  res.json({ success: true, data: item });
});

export const listMyItems = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: 'auth required' });
  const rows = await IgpItem.findAll({
    where: {
      assignedSupervisorId: userId,
      stage: { [Op.notIn]: ['Delivered', 'Reported', 'Cancelled'] },
    },
    include: [...itemIncludes, { model: IgpOrder, as: 'order', attributes: ['id', 'orderCode', 'title', 'deadline'] }],
    order: [['plannedCompletion', 'ASC']],
    limit: 200,
  });
  res.json({ success: true, data: rows });
});

export const getSummary = asyncHandler(async (req, res) => {
  const orders = await IgpOrder.findAll({
    attributes: ['id', 'status', 'paymentStatus', 'totalBudget', 'amountReceived', 'quantity', 'deadline'],
    raw: true,
  });
  const items = await IgpItem.findAll({
    attributes: ['id', 'stage', 'assetType', 'actualCost', 'incomeBaseline', 'incomeFollowup'],
    raw: true,
  });
  const today = new Date().toISOString().slice(0, 10);
  res.json({
    success: true,
    data: {
      orders: {
        total:       orders.length,
        active:      orders.filter(o => o.status === 'Active').length,
        completed:   orders.filter(o => o.status === 'Completed').length,
        overdueOpen: orders.filter(o => o.status === 'Active' && o.deadline && o.deadline < today).length,
      },
      items: {
        total:       items.length,
        byStage:     items.reduce((a, i) => ({ ...a, [i.stage]: (a[i.stage] || 0) + 1 }), {}),
        byAssetType: items.reduce((a, i) => ({ ...a, [i.assetType]: (a[i.assetType] || 0) + 1 }), {}),
        spendSum:    items.reduce((s, i) => s + Number(i.actualCost || 0), 0),
        avgIncomeUplift: (() => {
          const withBoth = items.filter(i => i.incomeBaseline != null && i.incomeFollowup != null);
          if (withBoth.length === 0) return null;
          const sumDiff = withBoth.reduce((s, i) => s + (Number(i.incomeFollowup) - Number(i.incomeBaseline)), 0);
          return sumDiff / withBoth.length;
        })(),
      },
      money: {
        budgetSum:      orders.reduce((s, o) => s + Number(o.totalBudget    || 0), 0),
        receivedSum:    orders.reduce((s, o) => s + Number(o.amountReceived || 0), 0),
        outstandingSum: orders
          .filter(o => ['Pending', 'PartiallyPaid', 'Overdue'].includes(o.paymentStatus))
          .reduce((s, o) => s + (Number(o.totalBudget || 0) - Number(o.amountReceived || 0)), 0),
      },
    },
  });
});
