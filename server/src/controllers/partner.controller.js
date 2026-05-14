import { Op, fn, col } from 'sequelize';
import {
  Partner,
  PartnerContribution,
  PartnerCommunication,
  User,
  Project,
  Expense,
  Bill,
  Invoice,
  WashOrder,
  WashItem,
  IgpOrder,
  IgpItem
} from '../models/index.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error.middleware.js';

// ============================================
// GET ALL PARTNERS
// ============================================
export const getAllPartners = asyncHandler(async (req, res) => {
  const { page, limit, search, country, status, type } = req.query;

  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { contactPerson: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (country) where.country = country;
  if (status) where.status = status;
  if (type) where.type = type;

  // If no pagination params provided, return all active partners (for dropdowns)
  if (!page && !limit) {
    const partners = await Partner.findAll({
      where: { ...where, status: status || 'Active' },
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'type', 'country', 'status', 'email', 'phone', 'contactPerson']
    });

    return res.json({
      success: true,
      data: { partners }
    });
  }

  // Otherwise, return paginated results
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const offset = (pageNum - 1) * limitNum;

  const { count, rows: partners } = await Partner.findAndCountAll({
    where,
    limit: limitNum,
    offset,
    order: [['createdAt', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      partners,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(count / limitNum),
        totalRecords: count,
        limit: limitNum
      }
    }
  });
});

// ============================================
// GET SINGLE PARTNER
// ============================================
export const getPartnerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const partner = await Partner.findByPk(id);

  if (!partner) {
    throw new NotFoundError('Partner not found');
  }

  res.json({
    success: true,
    data: { partner }
  });
});

// ============================================
// CREATE PARTNER
// ============================================
export const createPartner = asyncHandler(async (req, res) => {
  const partnerData = req.body;

  // Map partnershipStartDate to partnershipStart if provided
  if (partnerData.partnershipStartDate) {
    partnerData.partnershipStart = partnerData.partnershipStartDate;
    delete partnerData.partnershipStartDate;
  }

  const partner = await Partner.create(partnerData);

  res.status(201).json({
    success: true,
    message: 'Partner created successfully',
    data: { partner }
  });
});

// ============================================
// UPDATE PARTNER
// ============================================
export const updatePartner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Map partnershipStartDate to partnershipStart if provided
  if (updateData.partnershipStartDate) {
    updateData.partnershipStart = updateData.partnershipStartDate;
    delete updateData.partnershipStartDate;
  }

  const partner = await Partner.findByPk(id);

  if (!partner) {
    throw new NotFoundError('Partner not found');
  }

  await partner.update(updateData);

  res.json({
    success: true,
    message: 'Partner updated successfully',
    data: { partner }
  });
});

// ============================================
// DELETE PARTNER
// ============================================
export const deletePartner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const partner = await Partner.findByPk(id);

  if (!partner) {
    throw new NotFoundError('Partner not found');
  }

  await partner.destroy();

  res.json({
    success: true,
    message: 'Partner deleted successfully'
  });
});

// ============================================
// GET PARTNER STATISTICS
// ============================================
export const getPartnerStats = asyncHandler(async (req, res) => {
  const { country, type } = req.query;

  const where = {};
  if (country) where.country = country;
  if (type) where.type = type;

  const total = await Partner.count({ where });

  const byStatus = await Partner.findAll({
    where,
    attributes: [
      'status',
      [Partner.sequelize.fn('COUNT', Partner.sequelize.col('id')), 'count']
    ],
    group: ['status']
  });

  const byCountry = await Partner.findAll({
    where,
    attributes: [
      'country',
      [Partner.sequelize.fn('COUNT', Partner.sequelize.col('id')), 'count']
    ],
    group: ['country'],
    order: [[Partner.sequelize.fn('COUNT', Partner.sequelize.col('id')), 'DESC']]
  });

  const byType = await Partner.findAll({
    where,
    attributes: [
      'type',
      [Partner.sequelize.fn('COUNT', Partner.sequelize.col('id')), 'count']
    ],
    group: ['type']
  });

  const totalContributions = await Partner.sum('totalContributions', { where });

  res.json({
    success: true,
    data: {
      total,
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: parseInt(s.get('count'))
      })),
      byCountry: byCountry.map(c => ({
        country: c.country,
        count: parseInt(c.get('count'))
      })),
      byType: byType.map(t => ({
        type: t.type,
        count: parseInt(t.get('count'))
      })),
      totalContributions: parseFloat(totalContributions || 0)
    }
  });
});

// ============================================
// PARTNER CONTRIBUTION OPERATIONS
// ============================================

// Get all contributions for a partner
export const getPartnerContributions = asyncHandler(async (req, res) => {
  const { partnerId } = req.params;
  const { status, contributionType } = req.query;

  const where = { partnerId };
  if (status) where.status = status;
  if (contributionType) where.contributionType = contributionType;

  const contributions = await PartnerContribution.findAll({
    where,
    include: [
      { model: Partner, as: 'partner', attributes: ['id', 'name'] },
      { model: Project, as: 'project', attributes: ['id', 'name'] },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ],
    order: [['contributionDate', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      contributions,
      count: contributions.length
    }
  });
});

// Create partner contribution
export const createPartnerContribution = asyncHandler(async (req, res) => {
  const {
    partnerId,
    contributionType,
    amount,
    currency,
    description,
    contributionDate,
    projectId,
    receiptNumber,
    status,
    notes
  } = req.body;

  // Validate required fields
  if (!partnerId || !contributionType || !description || !contributionDate) {
    throw new ValidationError('Missing required fields');
  }

  // Verify partner exists
  const partner = await Partner.findByPk(partnerId);
  if (!partner) {
    throw new NotFoundError('Partner not found');
  }

  const contribution = await PartnerContribution.create({
    partnerId,
    contributionType,
    amount: amount || 0,
    currency: currency || 'LKR',
    description,
    contributionDate,
    projectId,
    receiptNumber,
    status: status || 'Pending',
    notes,
    createdBy: req.user?.id
  });

  // Update partner's total contributions if status is 'Received'
  if (contribution.status === 'Received' && amount) {
    await partner.increment('totalContributions', { by: parseFloat(amount) });
  }

  res.status(201).json({
    success: true,
    message: 'Contribution created successfully',
    data: { contribution }
  });
});

// Update partner contribution
export const updatePartnerContribution = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const contribution = await PartnerContribution.findByPk(id);
  if (!contribution) {
    throw new NotFoundError('Contribution not found');
  }

  const oldStatus = contribution.status;
  const oldAmount = contribution.amount;

  await contribution.update(updates);

  // Update partner's total contributions if status changed to/from 'Received'
  const partner = await Partner.findByPk(contribution.partnerId);
  if (oldStatus !== 'Received' && contribution.status === 'Received') {
    await partner.increment('totalContributions', { by: parseFloat(contribution.amount) });
  } else if (oldStatus === 'Received' && contribution.status !== 'Received') {
    await partner.decrement('totalContributions', { by: parseFloat(oldAmount) });
  } else if (oldStatus === 'Received' && contribution.status === 'Received' && oldAmount !== contribution.amount) {
    const difference = parseFloat(contribution.amount) - parseFloat(oldAmount);
    if (difference > 0) {
      await partner.increment('totalContributions', { by: difference });
    } else {
      await partner.decrement('totalContributions', { by: Math.abs(difference) });
    }
  }

  res.json({
    success: true,
    message: 'Contribution updated successfully',
    data: { contribution }
  });
});

// Delete partner contribution
export const deletePartnerContribution = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const contribution = await PartnerContribution.findByPk(id);
  if (!contribution) {
    throw new NotFoundError('Contribution not found');
  }

  // Update partner's total contributions if this was a received contribution
  if (contribution.status === 'Received') {
    const partner = await Partner.findByPk(contribution.partnerId);
    await partner.decrement('totalContributions', { by: parseFloat(contribution.amount) });
  }

  await contribution.destroy();

  res.json({
    success: true,
    message: 'Contribution deleted successfully'
  });
});

// ============================================
// PARTNER COMMUNICATION OPERATIONS
// ============================================

// Get all communications for a partner
export const getPartnerCommunications = asyncHandler(async (req, res) => {
  const { partnerId } = req.params;
  const { status, communicationType } = req.query;

  const where = { partnerId };
  if (status) where.status = status;
  if (communicationType) where.communicationType = communicationType;

  const communications = await PartnerCommunication.findAll({
    where,
    include: [
      { model: Partner, as: 'partner', attributes: ['id', 'name'] },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ],
    order: [['communicationDate', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      communications,
      count: communications.length
    }
  });
});

// Create partner communication
export const createPartnerCommunication = asyncHandler(async (req, res) => {
  const {
    partnerId,
    communicationType,
    subject,
    details,
    communicationDate,
    followUpRequired,
    followUpDate,
    status,
    attachments
  } = req.body;

  // Validate required fields
  if (!partnerId || !communicationType || !subject || !details || !communicationDate) {
    throw new ValidationError('Missing required fields');
  }

  // Verify partner exists
  const partner = await Partner.findByPk(partnerId);
  if (!partner) {
    throw new NotFoundError('Partner not found');
  }

  const communication = await PartnerCommunication.create({
    partnerId,
    communicationType,
    subject,
    details,
    communicationDate,
    followUpRequired: followUpRequired || false,
    followUpDate,
    status: status || 'Completed',
    attachments: attachments || [],
    createdBy: req.user?.id
  });

  res.status(201).json({
    success: true,
    message: 'Communication logged successfully',
    data: { communication }
  });
});

// Update partner communication
export const updatePartnerCommunication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const communication = await PartnerCommunication.findByPk(id);
  if (!communication) {
    throw new NotFoundError('Communication not found');
  }

  await communication.update(updates);

  res.json({
    success: true,
    message: 'Communication updated successfully',
    data: { communication }
  });
});

// Delete partner communication
export const deletePartnerCommunication = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const communication = await PartnerCommunication.findByPk(id);
  if (!communication) {
    throw new NotFoundError('Communication not found');
  }

  await communication.destroy();

  res.json({
    success: true,
    message: 'Communication deleted successfully'
  });
});

// ============================================================================
// GET PARTNER FINANCIALS — committed/received/spent/net rollup
// ============================================================================
// Returns a comprehensive financial snapshot for one partner: budgets
// committed (via WASH+IGP orders), funds received (paid invoices +
// recorded contributions), money spent (expenses + bills + item actual
// costs), and the net position. Used by the Partner detail page's
// Financials tab and any donor-reporting workflow.
//
// All sums respect the partner FK we added in
// add_partner_id_to_finance_tables.sql. Tables without a direct FK
// (cash_transactions, etc.) are reached through the order/invoice
// references and rolled up here.
// ============================================================================
export const getPartnerFinancials = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const partner = await Partner.findByPk(id);
  if (!partner) throw new NotFoundError('Partner not found');

  const sumDecimal = (rows, key = 'total') =>
    rows.reduce((s, r) => s + Number(r.get?.(key) ?? r[key] ?? 0), 0);

  // -------- WASH side --------------------------------------------------------
  const washOrders = await WashOrder.findAll({
    where: { donorId: id },
    attributes: [
      'id', 'orderCode', 'title', 'status', 'paymentStatus',
      'totalBudget', 'amountReceived', 'deadline', 'invoiceId',
    ],
    order: [['createdAt', 'DESC']],
    raw: true,
  });
  const washItemCostRow = washOrders.length === 0
    ? [{ total: 0 }]
    : await WashItem.findAll({
        where: { orderId: washOrders.map(o => o.id) },
        attributes: [[fn('COALESCE', fn('SUM', col('actual_cost')), 0), 'total']],
        raw: true,
      });
  const washItemSpend = Number(washItemCostRow[0]?.total || 0);

  // -------- IGP side ---------------------------------------------------------
  const igpOrders = await IgpOrder.findAll({
    where: { donorId: id },
    attributes: [
      'id', 'orderCode', 'title', 'status', 'paymentStatus',
      'totalBudget', 'amountReceived', 'deadline', 'invoiceId',
    ],
    order: [['createdAt', 'DESC']],
    raw: true,
  });
  const igpItemCostRow = igpOrders.length === 0
    ? [{ total: 0 }]
    : await IgpItem.findAll({
        where: { orderId: igpOrders.map(o => o.id) },
        attributes: [[fn('COALESCE', fn('SUM', col('actual_cost')), 0), 'total']],
        raw: true,
      });
  const igpItemSpend = Number(igpItemCostRow[0]?.total || 0);

  // -------- Invoices (funds expected + received) ----------------------------
  const invoices = await Invoice.findAll({
    where: { partnerId: id },
    attributes: ['id', 'invoiceNumber', 'invoiceDate', 'totalAmount', 'paidAmount', 'status', 'projectId'],
    order: [['invoiceDate', 'DESC']],
    raw: true,
  });
  const invoiceTotal = invoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0);
  const invoicePaid  = invoices.reduce((s, i) => s + Number(i.paidAmount  || 0), 0);

  // -------- Direct contributions (non-invoiced donations) -------------------
  const contributions = await PartnerContribution.findAll({
    where: { partnerId: id },
    attributes: ['id', 'contributionType', 'description', 'amount', 'contributionDate'],
    order: [['contributionDate', 'DESC']],
    raw: true,
  });
  const contributionsTotal = contributions.reduce((s, c) => s + Number(c.amount || 0), 0);

  // -------- Expenses charged to this partner ---------------------------------
  const expenseRows = await Expense.findAll({
    where: { partnerId: id },
    attributes: ['id', 'date', 'category', 'description', 'amount', 'status', 'projectId'],
    order: [['date', 'DESC']],
    raw: true,
  });
  const expensesTotal = expenseRows.reduce((s, e) => s + Number(e.amount || 0), 0);

  // -------- Bills charged to this partner -----------------------------------
  const billRows = await Bill.findAll({
    where: { partnerId: id },
    attributes: ['id', 'billNumber', 'billDate', 'vendorName', 'totalAmount', 'paidAmount', 'status', 'projectId'],
    order: [['billDate', 'DESC']],
    raw: true,
  });
  const billsTotal = billRows.reduce((s, b) => s + Number(b.totalAmount || 0), 0);
  const billsPaid  = billRows.reduce((s, b) => s + Number(b.paidAmount  || 0), 0);

  // -------- Projects this partner funds -------------------------------------
  const projects = await Project.findAll({
    where: { partnerId: id },
    attributes: ['id', 'name', 'projectCode', 'status', 'budget', 'spent'],
    order: [['createdAt', 'DESC']],
    raw: true,
  });

  // -------- Headline figures --------------------------------------------------
  const committed = washOrders.reduce((s, o) => s + Number(o.totalBudget || 0), 0)
                  + igpOrders.reduce((s, o) => s + Number(o.totalBudget || 0), 0);

  // "Received" = paid invoices + raw donor contributions (the two ways
  // money actually enters the org under this partner). amountReceived on
  // the order is already a mirror of invoice.paidAmount via the
  // reconciliation hook, so we don't add it again.
  const received = invoicePaid + contributionsTotal;

  // "Spent" = actual cost of delivered items (the ground truth for
  // programme delivery) + any direct expenses/bills tagged to this
  // partner that aren't already captured in item actual cost. Bills
  // raised against contractors for WASH/IGP items WILL double-count
  // if the contractor invoice was also captured as an item actual_cost;
  // that's a data-discipline concern, not a model concern — flag it on
  // the UI so finance can tell.
  const spentByItems   = washItemSpend + igpItemSpend;
  const spentByExpense = expensesTotal;
  const spentByBills   = billsPaid;
  const spentTotal     = spentByItems + spentByExpense + spentByBills;

  res.json({
    success: true,
    data: {
      partner: {
        id: partner.id, name: partner.name, partnerCode: partner.partnerCode,
        contactPerson: partner.contactPerson, country: partner.country,
        status: partner.status,
      },
      headline: {
        committed,
        received,
        spent: spentTotal,
        net: received - spentTotal,
        outstandingInvoiceBalance: invoiceTotal - invoicePaid,
      },
      breakdown: {
        spentByItems,
        spentByExpense,
        spentByBills,
        contributionsTotal,
        invoiceTotal,
        invoicePaid,
        billsTotal,
        billsPaid,
        expensesTotal,
      },
      lists: {
        washOrders,
        igpOrders,
        invoices,
        contributions,
        expenses: expenseRows,
        bills:    billRows,
        projects,
      },
    },
  });
});
