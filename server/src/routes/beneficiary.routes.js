import express from 'express';
import {
  getAllBeneficiaries,
  getBeneficiaryById,
  checkDuplicateByNIC,
  createBeneficiary,
  updateBeneficiary,
  deleteBeneficiary,
  getBeneficiaryStats,
  getDistricts,
  getDivisionsByDistrict,
  getGNDivisionsByDSDivision,
  bulkImportBeneficiaries
} from '../controllers/beneficiary.controller.js';
import { requireAuth, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';
import { validateId, validatePagination, sanitizeBody } from '../middleware/validate.middleware.js';

const router = express.Router();

// @route   GET /api/beneficiaries/stats
// @desc    Get beneficiary statistics
// @access  Private (View permission)
router.get(
  '/stats',
  requireAuth,
  requirePermission(PERMISSIONS.BENEFICIARIES_VIEW),
  getBeneficiaryStats
);

// @route   GET /api/beneficiaries/districts
// @desc    Get list of districts
// @access  Private (View permission)
router.get(
  '/districts',
  requireAuth,
  requirePermission(PERMISSIONS.BENEFICIARIES_VIEW),
  getDistricts
);

// @route   GET /api/beneficiaries/divisions
// @desc    Get DS divisions by district
// @access  Private (View permission)
router.get(
  '/divisions',
  requireAuth,
  requirePermission(PERMISSIONS.BENEFICIARIES_VIEW),
  getDivisionsByDistrict
);

// @route   GET /api/beneficiaries/gn-divisions
// @desc    Get GN divisions by DS division
// @access  Private (View permission)
router.get(
  '/gn-divisions',
  requireAuth,
  requirePermission(PERMISSIONS.BENEFICIARIES_VIEW),
  getGNDivisionsByDSDivision
);

// @route   GET /api/beneficiaries/check-duplicate
// @desc    Check if beneficiary exists by NIC
// @access  Private (View permission)
router.get(
  '/check-duplicate',
  requireAuth,
  requirePermission(PERMISSIONS.BENEFICIARIES_VIEW),
  checkDuplicateByNIC
);

// @route   GET /api/beneficiaries
// @desc    Get all beneficiaries
// @access  Private (View permission)
router.get(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.BENEFICIARIES_VIEW),
  validatePagination,
  getAllBeneficiaries
);

// @route   POST /api/beneficiaries/bulk-import
// @desc    Bulk import beneficiaries from Excel/CSV
// @access  Private (Create permission)
router.post(
  '/bulk-import',
  requireAuth,
  requirePermission(PERMISSIONS.BENEFICIARIES_CREATE),
  sanitizeBody,
  bulkImportBeneficiaries
);

// @route   POST /api/beneficiaries
// @desc    Create new beneficiary
// @access  Private (Create permission)
router.post(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.BENEFICIARIES_CREATE),
  sanitizeBody,
  createBeneficiary
);

// @route   GET /api/beneficiaries/:id
// @desc    Get beneficiary by ID
// @access  Private (View permission)
router.get(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.BENEFICIARIES_VIEW),
  validateId(),
  getBeneficiaryById
);

// @route   PUT /api/beneficiaries/:id
// @desc    Update beneficiary
// @access  Private (Edit permission)
router.put(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.BENEFICIARIES_EDIT),
  validateId(),
  sanitizeBody,
  updateBeneficiary
);

// @route   DELETE /api/beneficiaries/:id
// @desc    Delete beneficiary
// @access  Private (Delete permission)
router.delete(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.BENEFICIARIES_DELETE),
  validateId(),
  deleteBeneficiary
);

export default router;
