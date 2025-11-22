import express from 'express';
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  voidPayment,
  getPaymentStats
} from '../controllers/payment.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// @route   GET /api/payments/stats
// @desc    Get payment statistics
// @access  Private
router.get('/stats', getPaymentStats);

// @route   GET /api/payments
// @desc    Get all payments
// @access  Private
router.get('/', getAllPayments);

// @route   POST /api/payments
// @desc    Create new payment
// @access  Private
router.post('/', createPayment);

// @route   GET /api/payments/:id
// @desc    Get payment by ID
// @access  Private
router.get('/:id', validateId(), getPaymentById);

// @route   PUT /api/payments/:id
// @desc    Update payment
// @access  Private
router.put('/:id', validateId(), updatePayment);

// @route   PUT /api/payments/:id/void
// @desc    Void payment
// @access  Private
router.put('/:id/void', validateId(), voidPayment);

// @route   DELETE /api/payments/:id
// @desc    Delete payment
// @access  Private
router.delete('/:id', validateId(), deletePayment);

export default router;
