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
import { requireAuth, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';
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
// @access  Private (Finance)
router.post('/', requirePermission(PERMISSIONS.FINANCE_CREATE), createPayable);

// @route   GET /api/payables/:id
// @desc    Get payable by ID
// @access  Private
router.get('/:id', validateId(), getPayableById);

// @route   PUT /api/payables/:id
// @desc    Update payable
// @access  Private (Finance)
router.put('/:id', validateId(), requirePermission(PERMISSIONS.FINANCE_EDIT), updatePayable);

// @route   PUT /api/payables/:id/pay
// @desc    Mark payable as paid
// @access  Private (Finance)
router.put('/:id/pay', validateId(), requirePermission(PERMISSIONS.FINANCE_EDIT), markAsPaid);

// @route   DELETE /api/payables/:id
// @desc    Delete payable
// @access  Private (Finance)
router.delete('/:id', validateId(), requirePermission(PERMISSIONS.FINANCE_DELETE), deletePayable);

export default router;
