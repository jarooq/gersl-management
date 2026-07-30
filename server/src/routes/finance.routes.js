import express from 'express';
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  approveExpense,
  markAsPaid,
  getExpenseStats,
  getPendingApprovals
} from '../controllers/finance.controller.js';
import { forexSummary } from '../controllers/forexSummary.controller.js';
import { grantUtilization } from '../controllers/grantUtilization.controller.js';
import { requireAuth, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';
import { validateId, validatePagination, sanitizeBody } from '../middleware/validate.middleware.js';

const router = express.Router();

// ============================================
// STATISTICS & SPECIAL ROUTES
// ============================================

// @route   GET /api/finance/stats
// @desc    Get expense statistics
// @access  Private (View permission)
router.get(
  '/stats',
  requireAuth,
  requirePermission(PERMISSIONS.FINANCE_VIEW),
  getExpenseStats
);

// @route   GET /api/finance/forex-summary?year=<yyyy>
// @desc    Realized YTD forex gain/loss + per-currency open exposure.
// @access  Private (View permission)
router.get(
  '/forex-summary',
  requireAuth,
  requirePermission(PERMISSIONS.FINANCE_VIEW),
  forexSummary
);

// @route   GET /api/finance/grants/utilization[?status=<status>]
// @desc    Per-grant utilisation rollup: received, utilised, %,
//          monthly burn, days remaining.
// @access  Private (View permission)
router.get(
  '/grants/utilization',
  requireAuth,
  requirePermission(PERMISSIONS.FINANCE_VIEW),
  grantUtilization
);

// @route   GET /api/finance/pending
// @desc    Get pending approval expenses
// @access  Private (Approve permission)
router.get(
  '/pending',
  requireAuth,
  requirePermission(PERMISSIONS.FINANCE_APPROVE, PERMISSIONS.FINANCE_CEO_APPROVE),
  getPendingApprovals
);

// @route   PUT /api/finance/:id/approve
// @desc    Approve or reject expense
// @access  Private (Approve permission)
router.put(
  '/:id/approve',
  requireAuth,
  requirePermission(PERMISSIONS.FINANCE_APPROVE, PERMISSIONS.FINANCE_CEO_APPROVE),
  validateId(),
  sanitizeBody,
  approveExpense
);

// @route   PUT /api/finance/:id/paid
// @desc    Mark expense as paid
// @access  Private (Approve permission)
router.put(
  '/:id/paid',
  requireAuth,
  requirePermission(PERMISSIONS.FINANCE_APPROVE),
  validateId(),
  sanitizeBody,
  markAsPaid
);

// ============================================
// CRUD ROUTES
// ============================================

// @route   GET /api/finance
// @desc    Get all expenses with pagination and filters
// @access  Private (View permission)
router.get(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.FINANCE_VIEW),
  validatePagination,
  getAllExpenses
);

// @route   POST /api/finance
// @desc    Create new expense
// @access  Private (Create permission)
router.post(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.FINANCE_CREATE),
  sanitizeBody,
  createExpense
);

// @route   GET /api/finance/:id
// @desc    Get expense by ID
// @access  Private (View permission)
router.get(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.FINANCE_VIEW),
  validateId(),
  getExpenseById
);

// @route   PUT /api/finance/:id
// @desc    Update expense
// @access  Private (Edit permission)
router.put(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.FINANCE_EDIT),
  validateId(),
  sanitizeBody,
  updateExpense
);

// @route   DELETE /api/finance/:id
// @desc    Delete expense
// @access  Private (Delete permission)
router.delete(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.FINANCE_DELETE),
  validateId(),
  deleteExpense
);

export default router;
