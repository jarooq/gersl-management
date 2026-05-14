// =============================================================================
// Proposal → Order conversion + Invoice auto-generation
//
// Endpoints:
//   POST /api/proposals/:id/convert-to-order   body: { kind, deadline, ... }
//   POST /api/wash/orders/:id/generate-invoice
//   POST /api/igp/orders/:id/generate-invoice
//
// One handler covers both WASH and IGP — the only difference is which order
// model + endpoint mounts it. The kind is passed in for proposal conversion.
//
// Invoice number generation uses the row id (atomic) prefixed with year +
// kind, e.g. INV-2026-WASH-00042.
// =============================================================================

import {
  Proposal, WashOrder, IgpOrder, WashItem, IgpItem,
  Invoice, Partner, sequelize,
} from '../models/index.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/error.middleware.js';

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
const invoiceNumber = (id, kind) =>
  `INV-${new Date().getFullYear()}-${kind.toUpperCase()}-${String(id).padStart(5, '0')}`;
const tempInvoice = () =>
  `INV-TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const tempOrder = (prefix) =>
  `${prefix}-TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const realOrderCode = (id, prefix) =>
  `${prefix}-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`;

const itemCodeForKind = (id, kind) =>
  kind === 'wash'
    ? `WI-${new Date().getFullYear()}-${String(id).padStart(5, '0')}`
    : `II-${new Date().getFullYear()}-${String(id).padStart(5, '0')}`;
const tempItemCode = (kind) =>
  `${kind === 'wash' ? 'WI' : 'II'}-TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// ============================================================================
// Proposal → Order conversion
// ============================================================================

export const convertProposalToOrder = asyncHandler(async (req, res) => {
  const proposalId = parseInt(req.params.id, 10);
  const { kind, deadline, projectId, invoiceTiming, workStartCondition, donorReporting } = req.body || {};
  if (!['wash', 'igp'].includes(kind)) {
    throw new BadRequestError("body.kind must be 'wash' or 'igp'");
  }
  if (!deadline) throw new BadRequestError('deadline required');

  const proposal = await Proposal.findByPk(proposalId);
  if (!proposal) throw new NotFoundError('Proposal not found');
  if (proposal.convertedOrderId) {
    throw new BadRequestError(`Already converted to ${proposal.convertedOrderType} order ${proposal.convertedOrderId}`);
  }

  // Try to find a Partner matching the proposal donor name. If we can't, the
  // order still saves with donorId null — accountant can attach later.
  let donorId = null;
  if (proposal.donor) {
    const donor = await Partner.findOne({ where: { name: proposal.donor } });
    if (donor) donorId = donor.id;
  }

  // Inherit invoice/payment defaults from the donor record when caller didn't pass them.
  let donorPaymentTerm = null;
  if (donorId) {
    const partner = await Partner.findByPk(donorId);
    donorPaymentTerm = partner?.paymentTerm;
  }
  const resolvedInvoiceTiming =
    invoiceTiming || (donorPaymentTerm === 'AdvanceProforma' ? 'BeforeWork' : 'AfterWork');

  // Line items live on proposal.proposalLineItems as JSON. Sum the quantities
  // for the order.quantity field; if the JSON is empty, fall back to the
  // proposal's targetBeneficiaries count.
  const lineItems = Array.isArray(proposal.proposalLineItems) ? proposal.proposalLineItems : [];
  const totalQty = lineItems.length > 0
    ? lineItems.reduce((s, li) => s + Number(li.qty || li.quantity || 0), 0)
    : Number(proposal.targetBeneficiaries || 0);
  if (!totalQty) throw new BadRequestError('Proposal has no quantity to convert');

  // Total budget — prefer line-item × unit math; fall back to proposal totals.
  const totalBudget = lineItems.length > 0
    ? lineItems.reduce((s, li) => s + (Number(li.qty || li.quantity || 0) * Number(li.unit || li.unitCost || 0)), 0)
    : Number(proposal.totalBudget || proposal.budgetRequested || 0);

  // For WASH, infer the unit type from the (homogeneous) line items if all
  // entries share a type. Otherwise leave 'Mixed'.
  let washUnitType = 'Mixed';
  if (kind === 'wash' && lineItems.length > 0) {
    const types = [...new Set(lineItems.map(li => li.type).filter(Boolean))];
    if (types.length === 1) washUnitType = types[0];
  }

  const orderModel    = kind === 'wash' ? WashOrder : IgpOrder;
  const itemModel     = kind === 'wash' ? WashItem  : IgpItem;
  const codePrefix    = kind === 'wash' ? 'WO'      : 'IO';

  let createdOrder;
  await sequelize.transaction(async (t) => {
    const baseBody = {
      orderCode:           tempOrder(codePrefix),
      donorId,
      projectId:           projectId || proposal.linkedProjectId || null,
      proposalId:          proposal.id,
      title:               proposal.title,
      description:         proposal.summary || null,
      quantity:            totalQty,
      totalBudget:         totalBudget || null,
      orderDate:           new Date().toISOString().slice(0, 10),
      deadline,
      invoiceTiming:       resolvedInvoiceTiming,
      workStartCondition:  workStartCondition || 'OnAcceptance',
      donorReporting:      donorReporting    || 'PerItem',
      donorRef:            proposal.proposalCode,
      createdBy:           req.user?.id,
    };
    if (kind === 'wash') {
      baseBody.unitType = washUnitType;
      baseBody.unitCost = lineItems.length === 1 ? Number(lineItems[0].unit || lineItems[0].unitCost || 0) || null : null;
    } else {
      // IGP carries the asset mix verbatim on the order so the breakdown is
      // visible without recomputing from items.
      baseBody.assetMix = lineItems.map(li => ({
        type: li.type || li.assetType || 'Other',
        qty:  Number(li.qty || li.quantity || 0),
        unit: li.unit != null ? Number(li.unit) : (li.unitCost != null ? Number(li.unitCost) : null),
      }));
    }
    createdOrder = await orderModel.create(baseBody, { transaction: t });
    await createdOrder.update({ orderCode: realOrderCode(createdOrder.id, codePrefix) }, { transaction: t });

    // Pre-stub items only if proposal flagged namedBeneficiaries — otherwise
    // the bulk-import modal will populate them later.
    if (proposal.namedBeneficiaries && lineItems.length > 0) {
      for (const li of lineItems) {
        const qty = Number(li.qty || li.quantity || 0);
        if (!qty) continue;
        for (let i = 0; i < qty; i++) {
          const itemBody = {
            orderId:   createdOrder.id,
            itemCode:  tempItemCode(kind),
            createdBy: req.user?.id,
          };
          if (kind === 'wash') {
            itemBody.unitType    = li.type || li.assetType || washUnitType || 'HandPump';
            itemBody.plannedCost = li.unit != null ? Number(li.unit) : null;
          } else {
            itemBody.assetType   = li.type || li.assetType || 'Other';
            itemBody.plannedCost = li.unit != null ? Number(li.unit) : null;
          }
          const stub = await itemModel.create(itemBody, { transaction: t });
          await stub.update({ itemCode: itemCodeForKind(stub.id, kind) }, { transaction: t });
        }
      }
    }

    // Mark the proposal as converted.
    await proposal.update({
      convertedOrderType: kind,
      convertedOrderId:   createdOrder.id,
      // If it isn't already in an approved-by-donor state, surface that it's been actioned.
      status: ['Donor Approved'].includes(proposal.status) ? proposal.status : 'Donor Approved',
      convertedToProjectDate: new Date().toISOString().slice(0, 10),
    }, { transaction: t });
  });

  res.status(201).json({
    success: true,
    message: `Converted to ${kind.toUpperCase()} order ${createdOrder.orderCode}`,
    data: {
      kind,
      orderId:   createdOrder.id,
      orderCode: createdOrder.orderCode,
    },
  });
});

// ============================================================================
// Invoice generation for an order
// ============================================================================

const generateInvoiceForOrder = async (orderModel, kind, orderId, userId) => {
  const order = await orderModel.findByPk(orderId, {
    include: [{ model: Partner, as: 'donor' }],
  });
  if (!order) throw new NotFoundError(`${kind} order not found`);
  if (order.invoiceId) throw new BadRequestError('Invoice already exists for this order');
  if (!order.totalBudget) throw new BadRequestError('Order has no totalBudget — set unitCost × quantity first');

  // Compose line items from the order. For WASH this is one line (qty × unit).
  // For IGP we expand the asset mix into its component lines.
  let lineItems;
  if (kind === 'wash') {
    lineItems = [{
      description: order.title,
      quantity:    order.quantity,
      unitPrice:   Number(order.unitCost || (order.totalBudget / order.quantity)),
      total:       Number(order.totalBudget),
    }];
  } else {
    const mix = Array.isArray(order.assetMix) ? order.assetMix : [];
    lineItems = mix.length > 0
      ? mix.map(m => ({
          description: `${m.type} (${m.qty})`,
          quantity:    Number(m.qty),
          unitPrice:   Number(m.unit || 0),
          total:       Number(m.qty) * Number(m.unit || 0),
        }))
      : [{
          description: order.title,
          quantity:    order.quantity,
          unitPrice:   Number(order.totalBudget / order.quantity),
          total:       Number(order.totalBudget),
        }];
  }

  const dueDate = order.invoiceTiming === 'BeforeWork'
    // Proforma: due 7 days from issue (we expect funds before work starts).
    ? new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
    // Post-delivery: due 14 days from issue.
    : new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

  let invoice;
  await sequelize.transaction(async (t) => {
    invoice = await Invoice.create({
      invoiceNumber:    tempInvoice(),
      invoiceDate:      new Date().toISOString().slice(0, 10),
      dueDate,
      customerName:     order.donor?.name || 'Donor',
      customerEmail:    order.donor?.email || null,
      customerAddress:  order.donor?.address || null,
      projectId:        order.projectId || null,
      proposalId:       order.proposalId || null,
      partnerId:        order.donorId || null,
      subtotal:         Number(order.totalBudget),
      totalAmount:      Number(order.totalBudget),
      balanceDue:       Number(order.totalBudget),
      currency:         order.currency || 'LKR',
      status:           order.invoiceTiming === 'BeforeWork' ? 'Proforma' : 'Issued',
      paymentTerms:     order.invoiceTiming === 'BeforeWork' ? 'Advance / Proforma' : 'Net 14',
      lineItems,
      notes:            `Auto-generated from ${kind.toUpperCase()} order ${order.orderCode}.`,
      createdBy:        userId,
    }, { transaction: t });
    await invoice.update({ invoiceNumber: invoiceNumber(invoice.id, kind) }, { transaction: t });
    await order.update({ invoiceId: invoice.id }, { transaction: t });
  });

  return invoice;
};

export const generateInvoiceForWashOrder = asyncHandler(async (req, res) => {
  const inv = await generateInvoiceForOrder(WashOrder, 'wash', req.params.id, req.user?.id);
  res.status(201).json({ success: true, data: inv });
});

export const generateInvoiceForIgpOrder = asyncHandler(async (req, res) => {
  const inv = await generateInvoiceForOrder(IgpOrder, 'igp', req.params.id, req.user?.id);
  res.status(201).json({ success: true, data: inv });
});

// ============================================================================
// Reconciliation hook — call this after recording a bank receipt against an
// invoice so the linked WashOrder / IgpOrder learns about it.
//
// Invoked from the bank receipt controller (small change there) or can be
// triggered manually via PATCH /api/wash|igp/orders/:id/reconcile.
// ============================================================================

const reconcileForOrder = async (orderModel, orderId) => {
  const order = await orderModel.findByPk(orderId);
  if (!order || !order.invoiceId) return null;
  const invoice = await Invoice.findByPk(order.invoiceId);
  if (!invoice) return null;

  const paid    = Number(invoice.paidAmount || 0);
  const total   = Number(invoice.totalAmount || 0);
  // deadline comes back from Sequelize as a Date object for DATEONLY columns;
  // comparing a Date to a string via < silently coerces and gives wrong
  // results. Normalise to YYYY-MM-DD strings on both sides.
  const todayStr = new Date().toISOString().slice(0, 10);
  const deadlineStr = order.deadline ? new Date(order.deadline).toISOString().slice(0, 10) : null;
  const newStatus = paid >= total
    ? 'Paid'
    : paid > 0 ? 'PartiallyPaid' : (deadlineStr && deadlineStr < todayStr ? 'Overdue' : 'Pending');

  await order.update({ paymentStatus: newStatus, amountReceived: paid });
  return order;
};

export const reconcileWashOrder = asyncHandler(async (req, res) => {
  const result = await reconcileForOrder(WashOrder, req.params.id);
  if (!result) throw new NotFoundError('Order or invoice not found');
  res.json({ success: true, data: result });
});

export const reconcileIgpOrder = asyncHandler(async (req, res) => {
  const result = await reconcileForOrder(IgpOrder, req.params.id);
  if (!result) throw new NotFoundError('Order or invoice not found');
  res.json({ success: true, data: result });
});
