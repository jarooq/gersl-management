import { Op } from 'sequelize';
import { Invoice, Project, Proposal, Partner, User } from '../models/index.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error.middleware.js';

// ============================================
// GET ALL INVOICES
// ============================================
export const getAllInvoices = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, projectId, partnerId } = req.query;
  const offset = (page - 1) * limit;

  const where = {};

  if (search) {
    where[Op.or] = [
      { invoiceNumber: { [Op.iLike]: `%${search}%` } },
      { customerName: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (status) where.status = status;
  if (projectId) where.projectId = projectId;
  if (partnerId) where.partnerId = partnerId;

  const { count, rows: invoices } = await Invoice.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['invoiceDate', 'DESC']],
    include: [
      { model: Project, as: 'project', attributes: ['id', 'name', 'projectCode'] },
      { model: Proposal, as: 'proposal', attributes: ['id', 'title', 'proposalCode'] },
      { model: Partner, as: 'partner', attributes: ['id', 'name'] },
      { model: User, as: 'creator', attributes: ['id', 'fullName', 'email'] }
    ]
  });

  res.json({
    success: true,
    data: {
      invoices,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    }
  });
});

// ============================================
// GET SINGLE INVOICE
// ============================================
export const getInvoiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const invoice = await Invoice.findByPk(id, {
    include: [
      { model: Project, as: 'project' },
      { model: Proposal, as: 'proposal' },
      { model: Partner, as: 'partner' },
      { model: User, as: 'creator', attributes: ['id', 'fullName', 'email'] }
    ]
  });

  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }

  res.json({
    success: true,
    data: { invoice }
  });
});

// ============================================
// CREATE INVOICE
// ============================================
export const createInvoice = asyncHandler(async (req, res) => {
  const invoiceData = req.body;

  // Generate invoice number if not provided
  if (!invoiceData.invoiceNumber) {
    const year = new Date().getFullYear();
    const count = await Invoice.count();
    invoiceData.invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  // Calculate balance due
  invoiceData.balanceDue = parseFloat(invoiceData.totalAmount) - parseFloat(invoiceData.paidAmount || 0);

  // Set creator
  if (req.user) {
    invoiceData.createdBy = req.user.id;
  }

  const invoice = await Invoice.create(invoiceData);

  res.status(201).json({
    success: true,
    message: 'Invoice created successfully',
    data: { invoice }
  });
});

// ============================================
// UPDATE INVOICE
// ============================================
export const updateInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const invoice = await Invoice.findByPk(id);

  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }

  // Recalculate balance due if amounts changed
  if (updateData.totalAmount !== undefined || updateData.paidAmount !== undefined) {
    const totalAmount = updateData.totalAmount !== undefined ? updateData.totalAmount : invoice.totalAmount;
    const paidAmount = updateData.paidAmount !== undefined ? updateData.paidAmount : invoice.paidAmount;
    updateData.balanceDue = parseFloat(totalAmount) - parseFloat(paidAmount);

    // Update status based on payment
    if (updateData.balanceDue === 0) {
      updateData.status = 'Paid';
    } else if (paidAmount > 0) {
      updateData.status = 'Partially Paid';
    }
  }

  await invoice.update(updateData);

  res.json({
    success: true,
    message: 'Invoice updated successfully',
    data: { invoice }
  });
});

// ============================================
// DELETE INVOICE
// ============================================
export const deleteInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const invoice = await Invoice.findByPk(id);

  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }

  await invoice.destroy();

  res.json({
    success: true,
    message: 'Invoice deleted successfully'
  });
});

// ============================================
// GET INVOICE STATISTICS
// ============================================
export const getInvoiceStats = asyncHandler(async (req, res) => {
  const total = await Invoice.count();
  const draft = await Invoice.count({ where: { status: 'Draft' } });
  const sent = await Invoice.count({ where: { status: 'Sent' } });
  const paid = await Invoice.count({ where: { status: 'Paid' } });
  const overdue = await Invoice.count({
    where: {
      status: { [Op.notIn]: ['Paid', 'Cancelled', 'Draft'] },
      dueDate: { [Op.lt]: new Date() }
    }
  });

  const totalBilled = await Invoice.sum('totalAmount') || 0;
  const totalPaid = await Invoice.sum('paidAmount') || 0;
  const totalOutstanding = await Invoice.sum('balanceDue', {
    where: { status: { [Op.notIn]: ['Paid', 'Cancelled'] } }
  }) || 0;

  const byMonth = await Invoice.findAll({
    attributes: [
      [Invoice.sequelize.fn('DATE_TRUNC', 'month', Invoice.sequelize.col('invoice_date')), 'month'],
      [Invoice.sequelize.fn('COUNT', Invoice.sequelize.col('id')), 'count'],
      [Invoice.sequelize.fn('SUM', Invoice.sequelize.col('total_amount')), 'total'],
      [Invoice.sequelize.fn('SUM', Invoice.sequelize.col('paid_amount')), 'paid']
    ],
    where: {
      invoiceDate: {
        [Op.gte]: new Date(new Date().getFullYear(), 0, 1) // This year
      }
    },
    group: [Invoice.sequelize.fn('DATE_TRUNC', 'month', Invoice.sequelize.col('invoice_date'))],
    order: [[Invoice.sequelize.fn('DATE_TRUNC', 'month', Invoice.sequelize.col('invoice_date')), 'ASC']]
  });

  res.json({
    success: true,
    data: {
      total,
      draft,
      sent,
      paid,
      overdue,
      totalBilled: parseFloat(totalBilled),
      totalPaid: parseFloat(totalPaid),
      totalOutstanding: parseFloat(totalOutstanding),
      byMonth: byMonth.map(i => ({
        month: i.get('month'),
        count: parseInt(i.get('count')),
        total: parseFloat(i.get('total') || 0),
        paid: parseFloat(i.get('paid') || 0)
      }))
    }
  });
});

// ============================================
// RECORD PAYMENT
// ============================================
export const recordPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, paymentDate, paymentMethod, notes } = req.body;

  const invoice = await Invoice.findByPk(id);

  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }

  const newPaidAmount = parseFloat(invoice.paidAmount) + parseFloat(amount);
  const balanceDue = parseFloat(invoice.totalAmount) - newPaidAmount;

  let status = invoice.status;
  if (balanceDue === 0) {
    status = 'Paid';
  } else if (newPaidAmount > 0) {
    status = 'Partially Paid';
  }

  await invoice.update({
    paidAmount: newPaidAmount,
    balanceDue: balanceDue,
    status: status
  });

  res.json({
    success: true,
    message: 'Payment recorded successfully',
    data: { invoice }
  });
});
