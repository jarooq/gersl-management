// =============================================================================
// WASH controller — donor-funded water/sanitation programmes.
//
// One donor batch → many installations → each one named beneficiary, GPS,
// contractor, stage timeline. Wires into:
//   Partner (donor), Project (umbrella), Proposal (upstream), Beneficiary,
//   Vendor (contractor), Invoice (downstream), Bill (payment-from-source).
//
// Endpoints under /api/wash/* (see routes/wash.routes.js).
// =============================================================================

import { Op } from 'sequelize';
import {
  WashOrder, WashItem, WashStageUpdate,
  Partner, Project, Proposal, Vendor, User, Beneficiary,
  sequelize,
} from '../models/index.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/error.middleware.js';
import { createNextStageTask } from '../utils/programmeTasks.js';

const STAGE_ORDER = ['Ordered', 'Surveyed', 'Materials', 'Construction', 'Testing', 'HandedOver', 'Reported', 'Cancelled'];
const STAGE_TIMESTAMP_FIELD = {
  Surveyed:     'surveyedAt',
  Materials:    'materialsAt',
  Construction: 'constructionAt',
  Testing:      'testingAt',
  HandedOver:   'handoverAt',
  Reported:     'reportedAt',
};

// ----------------------------------------------------------------------------
// Order code generation — same race-safe pattern as donation codes. Uses the
// row id (autoincrement, atomic) rather than count()+1.
// ----------------------------------------------------------------------------
const orderCode  = (id) => `WO-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`;
const itemCode   = (id) => `WI-${new Date().getFullYear()}-${String(id).padStart(5, '0')}`;
const tempOrder  = () => `WO-TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const tempItem   = () => `WI-TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
];

// ============================================================================
// ORDERS
// ============================================================================

export const listOrders = asyncHandler(async (req, res) => {
  const { status, donorId, projectId, search, paymentStatus } = req.query;
  const where = {};
  if (status)        where.status = status;
  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (donorId)       where.donorId = parseInt(donorId, 10);
  if (projectId)     where.projectId = parseInt(projectId, 10);
  if (search) {
    where[Op.or] = [
      { orderCode: { [Op.iLike]: `%${search}%` } },
      { title:     { [Op.iLike]: `%${search}%` } },
      { donorRef:  { [Op.iLike]: `%${search}%` } },
    ];
  }
  const rows = await WashOrder.findAll({
    where,
    include: orderIncludes,
    order: [['deadline', 'ASC'], ['createdAt', 'DESC']],
    limit: 200,
  });
  res.json({ success: true, data: rows });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await WashOrder.findByPk(req.params.id, { include: orderIncludes });
  if (!order) throw new NotFoundError('Wash order not found');
  // Item summary roll-up — fast aggregates without pulling every row.
  const items = await WashItem.findAll({
    where: { orderId: order.id },
    attributes: ['id', 'stage', 'actualCost', 'plannedCost'],
    raw: true,
  });
  const summary = {
    totalItems:     items.length,
    byStage:        items.reduce((acc, it) => ({ ...acc, [it.stage]: (acc[it.stage] || 0) + 1 }), {}),
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

  // Inherit defaults from donor (Partner) record if present.
  if (body.donorId && !body.invoiceTiming) {
    const donor = await Partner.findByPk(body.donorId);
    if (donor) {
      body.invoiceTiming  = donor.paymentTerm === 'AdvanceProforma' ? 'BeforeWork' : 'AfterWork';
      body.donorReporting = donor.reportingFormat || 'PerItem';
    }
  }

  body.orderCode = tempOrder();
  body.createdBy = req.user?.id;
  const order = await WashOrder.create(body);
  await order.update({ orderCode: orderCode(order.id) });

  res.status(201).json({ success: true, data: order });
});

export const updateOrder = asyncHandler(async (req, res) => {
  const order = await WashOrder.findByPk(req.params.id);
  if (!order) throw new NotFoundError('Wash order not found');
  // Never let the client overwrite the code or creator.
  delete req.body.orderCode;
  delete req.body.createdBy;
  await order.update(req.body);
  res.json({ success: true, data: order });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await WashOrder.findByPk(req.params.id);
  if (!order) throw new NotFoundError('Wash order not found');
  await order.update({ status: 'Cancelled' });
  // Cancel any non-completed items beneath the order.
  await WashItem.update(
    { stage: 'Cancelled' },
    { where: { orderId: order.id, stage: { [Op.notIn]: ['HandedOver', 'Reported', 'Cancelled'] } } }
  );
  res.json({ success: true, data: order });
});

// ============================================================================
// ITEMS
// ============================================================================

// Bulk add items to an order — used by the beneficiary-import modal.
// Body: { items: [{ beneficiaryName, beneficiaryNic, district, ... }, ...] }
export const bulkCreateItems = asyncHandler(async (req, res) => {
  const order = await WashOrder.findByPk(req.params.id);
  if (!order) throw new NotFoundError('Wash order not found');
  const rows = Array.isArray(req.body.items) ? req.body.items : [];
  if (rows.length === 0)  throw new BadRequestError('items array required');
  if (rows.length > 500) throw new BadRequestError('max 500 items per request');

  const created = [];
  await sequelize.transaction(async (t) => {
    for (const r of rows) {
      const item = await WashItem.create({
        orderId:           order.id,
        itemCode:          tempItem(),
        unitType:          r.unitType || order.unitType || 'HandPump',
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
        installationLat:   r.installationLat,
        installationLng:   r.installationLng,
        plannedCost:       r.plannedCost ?? order.unitCost ?? null,
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
  const { orderId, stage, district, contractorId, supervisorId, search } = req.query;
  const where = {};
  if (orderId)      where.orderId = parseInt(orderId, 10);
  if (stage)        where.stage = stage;
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
  const rows = await WashItem.findAll({
    where,
    include: [...itemIncludes, { model: WashOrder, as: 'order', attributes: ['id', 'orderCode', 'title', 'deadline', 'donorId'] }],
    order: [['createdAt', 'DESC']],
    limit: 500,
  });
  res.json({ success: true, data: rows });
});

export const getItem = asyncHandler(async (req, res) => {
  const item = await WashItem.findByPk(req.params.id, {
    include: [
      ...itemIncludes,
      { model: WashOrder, as: 'order', include: [{ model: Partner, as: 'donor' }, { model: Project, as: 'project' }] },
      { model: WashStageUpdate, as: 'stageUpdates', include: [{ model: User, as: 'updater', attributes: ['id', 'fullName'] }], separate: true, order: [['createdAt', 'DESC']] },
    ],
  });
  if (!item) throw new NotFoundError('Wash item not found');
  res.json({ success: true, data: item });
});

export const updateItem = asyncHandler(async (req, res) => {
  const item = await WashItem.findByPk(req.params.id);
  if (!item) throw new NotFoundError('Wash item not found');
  // Stage changes go through transitionStage to keep the audit timeline coherent.
  delete req.body.stage;
  delete req.body.itemCode;
  await item.update(req.body);
  res.json({ success: true, data: item });
});

// ----------------------------------------------------------------------------
// Stage transitions — also record an entry in wash_stage_updates so the item
// detail page can show a clean timeline. The order's surveyed_at/materials_at
// etc. timestamps are populated from the latest transition.
// ----------------------------------------------------------------------------
export const transitionStage = asyncHandler(async (req, res) => {
  const { newStage, notes, photoUrls, latitude, longitude, percentComplete, source } = req.body;
  if (!STAGE_ORDER.includes(newStage)) throw new BadRequestError(`unknown stage: ${newStage}`);

  const item = await WashItem.findByPk(req.params.id, {
    include: [{ model: WashOrder, as: 'order' }],
  });
  if (!item) throw new NotFoundError('Wash item not found');

  // Soft-warn (but don't block) when funds gate is active and donor hasn't paid.
  if (item.order?.workStartCondition === 'OnFundsReceived'
      && item.order?.paymentStatus !== 'Paid'
      && newStage !== 'Cancelled') {
    // Surfaced to the client so the UI can show an override confirmation,
    // but we proceed — see audit log for the override trail.
    res.set('X-Funds-Gate-Warning', 'true');
  }

  const update = { stage: newStage };
  const stampField = STAGE_TIMESTAMP_FIELD[newStage];
  if (stampField) update[stampField] = new Date();
  await item.update(update);

  await WashStageUpdate.create({
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
    kind: 'wash',
    item,            // already has .order loaded above
    newStage,
    triggeredBy: req.user?.id,
  });

  res.json({ success: true, data: item });
});

// Append a progress update without flipping the stage (used for mid-stage
// photo uploads, e.g. "construction 50%").
export const addStageUpdate = asyncHandler(async (req, res) => {
  const item = await WashItem.findByPk(req.params.id);
  if (!item) throw new NotFoundError('Wash item not found');
  const { notes, photoUrls, latitude, longitude, percentComplete, source } = req.body;
  const row = await WashStageUpdate.create({
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
  const rows = await WashStageUpdate.findAll({
    where: { itemId: req.params.id },
    include: [{ model: User, as: 'updater', attributes: ['id', 'fullName'] }],
    order: [['createdAt', 'DESC']],
    limit: 500,
  });
  res.json({ success: true, data: rows });
});

// ----------------------------------------------------------------------------
// Mobile/field: "what's assigned to me" — combines items assigned as
// contractor or supervisor where stage is still in flight.
// ----------------------------------------------------------------------------
export const listMyItems = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: 'auth required' });
  const rows = await WashItem.findAll({
    where: {
      assignedSupervisorId: userId,
      stage: { [Op.notIn]: ['HandedOver', 'Reported', 'Cancelled'] },
    },
    include: [...itemIncludes, { model: WashOrder, as: 'order', attributes: ['id', 'orderCode', 'title', 'deadline'] }],
    order: [['plannedCompletion', 'ASC']],
    limit: 200,
  });
  res.json({ success: true, data: rows });
});

// ----------------------------------------------------------------------------
// Org-wide WASH summary — for the dashboard tile and the WASH landing page.
// ----------------------------------------------------------------------------
export const getSummary = asyncHandler(async (req, res) => {
  const orders = await WashOrder.findAll({
    attributes: ['id', 'status', 'paymentStatus', 'totalBudget', 'amountReceived', 'quantity', 'deadline'],
    raw: true,
  });
  const items = await WashItem.findAll({
    attributes: ['id', 'stage', 'unitType', 'actualCost'],
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
        total:    items.length,
        byStage:  items.reduce((a, i) => ({ ...a, [i.stage]: (a[i.stage] || 0) + 1 }), {}),
        byType:   items.reduce((a, i) => ({ ...a, [i.unitType]: (a[i.unitType] || 0) + 1 }), {}),
        spendSum: items.reduce((s, i) => s + Number(i.actualCost || 0), 0),
      },
      money: {
        budgetSum:       orders.reduce((s, o) => s + Number(o.totalBudget    || 0), 0),
        receivedSum:     orders.reduce((s, o) => s + Number(o.amountReceived || 0), 0),
        outstandingSum:  orders
          .filter(o => ['Pending', 'PartiallyPaid', 'Overdue'].includes(o.paymentStatus))
          .reduce((s, o) => s + (Number(o.totalBudget || 0) - Number(o.amountReceived || 0)), 0),
      },
    },
  });
});
