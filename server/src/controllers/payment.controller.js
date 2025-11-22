import { Payment } from '../models/index.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/error.middleware.js';
import { Op } from 'sequelize';

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
export const getAllPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, status, payment_method } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (payment_method) where.payment_method = payment_method;

  const { rows: payments, count: total } = await Payment.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [['payment_date', 'DESC'], ['created_at', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      payments,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
export const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findByPk(req.params.id);

  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  res.json({
    success: true,
    data: { payment }
  });
});

// @desc    Create new payment
// @route   POST /api/payments
// @access  Private
export const createPayment = asyncHandler(async (req, res) => {
  const {
    payable_id,
    payment_date,
    amount,
    payment_method,
    reference_number,
    bank_account_id,
    notes
  } = req.body;

  if (!amount || !payment_date || !payment_method) {
    throw new ValidationError('Amount, payment date, and payment method are required');
  }

  const payment = await Payment.create({
    payable_id,
    payment_date,
    amount,
    payment_method,
    reference_number,
    bank_account_id,
    notes,
    status: 'Completed',
    created_by: req.user.id
  });

  res.status(201).json({
    success: true,
    data: { payment }
  });
});

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private
export const updatePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findByPk(req.params.id);

  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  const {
    payable_id,
    payment_date,
    amount,
    payment_method,
    reference_number,
    bank_account_id,
    notes,
    status
  } = req.body;

  await payment.update({
    payable_id,
    payment_date,
    amount,
    payment_method,
    reference_number,
    bank_account_id,
    notes,
    status
  });

  res.json({
    success: true,
    data: { payment }
  });
});

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private
export const deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findByPk(req.params.id);

  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  await payment.destroy();

  res.json({
    success: true,
    message: 'Payment deleted successfully'
  });
});

// @desc    Void payment
// @route   PUT /api/payments/:id/void
// @access  Private
export const voidPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findByPk(req.params.id);

  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  await payment.update({
    status: 'Voided',
    voided_at: new Date(),
    voided_by: req.user.id,
    void_reason: req.body.void_reason
  });

  res.json({
    success: true,
    data: { payment }
  });
});

// @desc    Get payment statistics
// @route   GET /api/payments/stats
// @access  Private
export const getPaymentStats = asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;

  const where = {};
  if (start_date && end_date) {
    where.payment_date = {
      [Op.between]: [start_date, end_date]
    };
  }

  const totalPayments = await Payment.count({ where });
  const completedPayments = await Payment.count({
    where: { ...where, status: 'Completed' }
  });

  const totalAmount = await Payment.sum('amount', { where }) || 0;

  const paymentsByMethod = await Payment.findAll({
    where,
    attributes: [
      'payment_method',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('amount')), 'total']
    ],
    group: ['payment_method']
  });

  res.json({
    success: true,
    data: {
      total_payments: totalPayments,
      completed_payments: completedPayments,
      total_amount: parseFloat(totalAmount),
      payments_by_method: paymentsByMethod
    }
  });
});
