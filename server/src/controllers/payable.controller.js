import { Payable } from '../models/index.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/error.middleware.js';
import { Op } from 'sequelize';

// @desc    Get all payables
// @route   GET /api/payables
// @access  Private
export const getAllPayables = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, status, vendor_id } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (vendor_id) where.vendor_id = vendor_id;

  const { rows: payables, count: total } = await Payable.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [['due_date', 'ASC'], ['created_at', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      payables,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get payable by ID
// @route   GET /api/payables/:id
// @access  Private
export const getPayableById = asyncHandler(async (req, res) => {
  const payable = await Payable.findByPk(req.params.id);

  if (!payable) {
    throw new NotFoundError('Payable not found');
  }

  res.json({
    success: true,
    data: { payable }
  });
});

// @desc    Create new payable
// @route   POST /api/payables
// @access  Private
export const createPayable = asyncHandler(async (req, res) => {
  const {
    vendor_id,
    invoice_number,
    invoice_date,
    due_date,
    amount,
    description,
    payment_terms,
    category
  } = req.body;

  if (!vendor_id || !invoice_number || !amount || !due_date) {
    throw new ValidationError('Vendor, invoice number, amount, and due date are required');
  }

  const payable = await Payable.create({
    vendor_id,
    invoice_number,
    invoice_date,
    due_date,
    amount,
    amount_paid: 0,
    amount_remaining: amount,
    description,
    payment_terms,
    category,
    status: 'Pending',
    created_by: req.user.id
  });

  res.status(201).json({
    success: true,
    data: { payable }
  });
});

// @desc    Update payable
// @route   PUT /api/payables/:id
// @access  Private
export const updatePayable = asyncHandler(async (req, res) => {
  const payable = await Payable.findByPk(req.params.id);

  if (!payable) {
    throw new NotFoundError('Payable not found');
  }

  const {
    vendor_id,
    invoice_number,
    invoice_date,
    due_date,
    amount,
    description,
    payment_terms,
    category
  } = req.body;

  await payable.update({
    vendor_id,
    invoice_number,
    invoice_date,
    due_date,
    amount,
    amount_remaining: amount - (payable.amount_paid || 0),
    description,
    payment_terms,
    category
  });

  res.json({
    success: true,
    data: { payable }
  });
});

// @desc    Delete payable
// @route   DELETE /api/payables/:id
// @access  Private
export const deletePayable = asyncHandler(async (req, res) => {
  const payable = await Payable.findByPk(req.params.id);

  if (!payable) {
    throw new NotFoundError('Payable not found');
  }

  await payable.destroy();

  res.json({
    success: true,
    message: 'Payable deleted successfully'
  });
});

// @desc    Mark payable as paid
// @route   PUT /api/payables/:id/pay
// @access  Private
export const markAsPaid = asyncHandler(async (req, res) => {
  const payable = await Payable.findByPk(req.params.id);

  if (!payable) {
    throw new NotFoundError('Payable not found');
  }

  const { amount_paid, payment_date, payment_method, payment_reference } = req.body;

  const totalPaid = (payable.amount_paid || 0) + parseFloat(amount_paid);
  const remaining = payable.amount - totalPaid;

  await payable.update({
    amount_paid: totalPaid,
    amount_remaining: remaining,
    status: remaining <= 0 ? 'Paid' : 'Partially Paid',
    payment_date: remaining <= 0 ? payment_date : payable.payment_date,
    payment_method,
    payment_reference
  });

  res.json({
    success: true,
    data: { payable }
  });
});

// @desc    Get payable statistics
// @route   GET /api/payables/stats
// @access  Private
export const getPayableStats = asyncHandler(async (req, res) => {
  const totalPayables = await Payable.count();
  const pendingPayables = await Payable.count({ where: { status: 'Pending' } });
  const paidPayables = await Payable.count({ where: { status: 'Paid' } });

  const totalAmount = await Payable.sum('amount') || 0;
  const totalPaid = await Payable.sum('amount_paid') || 0;
  const totalRemaining = await Payable.sum('amount_remaining') || 0;

  // Overdue payables
  const overduePayables = await Payable.count({
    where: {
      status: { [Op.in]: ['Pending', 'Partially Paid'] },
      due_date: { [Op.lt]: new Date() }
    }
  });

  res.json({
    success: true,
    data: {
      total_payables: totalPayables,
      pending_payables: pendingPayables,
      paid_payables: paidPayables,
      overdue_payables: overduePayables,
      total_amount: parseFloat(totalAmount),
      total_paid: parseFloat(totalPaid),
      total_remaining: parseFloat(totalRemaining)
    }
  });
});
