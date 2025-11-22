import express from 'express';
import {
  getAllPayables,
  getPayableById,
  createPayable,
  updatePayable,
  deletePayable,
  markAsPaid,
  getPayableStats
} from '../controllers/payable.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// @route   GET /api/payables/stats
// @desc    Get payable statistics
// @access  Private
router.get('/stats', getPayableStats);

// @route   GET /api/payables
// @desc    Get all payables
// @access  Private
router.get('/', getAllPayables);

// @route   POST /api/payables
// @desc    Create new payable
// @access  Private
router.post('/', createPayable);

// @route   GET /api/payables/:id
// @desc    Get payable by ID
// @access  Private
router.get('/:id', validateId(), getPayableById);

// @route   PUT /api/payables/:id
// @desc    Update payable
// @access  Private
router.put('/:id', validateId(), updatePayable);

// @route   PUT /api/payables/:id/pay
// @desc    Mark payable as paid
// @access  Private
router.put('/:id/pay', validateId(), markAsPaid);

// @route   DELETE /api/payables/:id
// @desc    Delete payable
// @access  Private
router.delete('/:id', validateId(), deletePayable);

export default router;
