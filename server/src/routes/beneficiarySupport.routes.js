import express from 'express';
import {
  getAllSupport,
  getSupportById,
  createSupport,
  updateSupport,
  deleteSupport,
  getSupportStats,
  getBeneficiarySupportHistory,
  generateSupportReport
} from '../controllers/beneficiarySupport.controller.js';
import { requireAuth, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';
import { validateId, validatePagination, sanitizeBody } from '../middleware/validate.middleware.js';

const router = express.Router();

// @route   GET /api/beneficiary-support/stats
// @desc    Get support statistics
// @access  Private (View permission)
router.get(
  '/stats',
  requireAuth,
  requirePermission(PERMISSIONS.BENEFICIARIES_VIEW),
  getSupportStats
);

// @route   GET /api/beneficiary-support/report
// @desc    Generate support report
// @access  Private (View permission)
router.get(
  '/report',
  requireAuth,
  requirePermission(PERMISSIONS.BENEFICIARIES_VIEW),
  generateSupportReport
);

// @route   GET /api/beneficiary-support/beneficiary/:beneficiaryId
// @desc    Get support history for a beneficiary
// @access  Private (View permission)
router.get(
  '/beneficiary/:beneficiaryId',
  requireAuth,
  requirePermission(PERMISSIONS.BENEFICIARIES_VIEW),
  validateId('beneficiaryId'),
  getBeneficiarySupportHistory
);

// @route   GET /api/beneficiary-support
// @desc    Get all support records
// @access  Private (View permission)
router.get(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.BENEFICIARIES_VIEW),
  validatePagination,
  getAllSupport
);

// @route   POST /api/beneficiary-support
// @desc    Create new support record
// @access  Private (Create permission)
router.post(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.BENEFICIARIES_CREATE),
  sanitizeBody,
  createSupport
);

// @route   GET /api/beneficiary-support/:id
// @desc    Get support record by ID
// @access  Private (View permission)
router.get(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.BENEFICIARIES_VIEW),
  validateId(),
  getSupportById
);

// @route   PUT /api/beneficiary-support/:id
// @desc    Update support record
// @access  Private (Edit permission)
router.put(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.BENEFICIARIES_EDIT),
  validateId(),
  sanitizeBody,
  updateSupport
);

// @route   DELETE /api/beneficiary-support/:id
// @desc    Delete support record
// @access  Private (Delete permission)
router.delete(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.BENEFICIARIES_DELETE),
  validateId(),
  deleteSupport
);

export default router;
