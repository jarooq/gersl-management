import express from 'express';
import {
  getAllBeneficiaries,
  getBeneficiaryById,
  createBeneficiary,
  updateBeneficiary,
  deleteBeneficiary,
  getBeneficiarySupport,
  createBeneficiarySupport,
  updateBeneficiarySupport,
  deleteBeneficiarySupport,
  verifySupport,
  getBeneficiaryStats,
  getDistricts,
  getDivisions,
  getGNDivisions
} from '../controllers/beneficiaries.controller.js';
import { requireAuth, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';
import { validateId, validatePagination, sanitizeBody } from '../middleware/validate.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// ============================================
// BENEFICIARY ROUTES
// ============================================

// @route   GET /api/beneficiaries/stats
// @desc    Get beneficiary statistics
// @access  Private (View permission)
router.get('/stats', getBeneficiaryStats);

// @route   GET /api/beneficiaries/districts
// @desc    Get all districts
// @access  Private (View permission)
router.get('/districts', getDistricts);

// @route   GET /api/beneficiaries/divisions
// @desc    Get divisions by district
// @access  Private (View permission)
router.get('/divisions', getDivisions);

// @route   GET /api/beneficiaries/gn-divisions
// @desc    Get GN divisions by DS division
// @access  Private (View permission)
router.get('/gn-divisions', getGNDivisions);

// @route   GET /api/beneficiaries
// @desc    Get all beneficiaries
// @access  Private (View permission)
router.get(
  '/',
  validatePagination,
  getAllBeneficiaries
);

// @route   POST /api/beneficiaries
// @desc    Create new beneficiary
// @access  Private (Create permission)
router.post(
  '/',
  sanitizeBody,
  createBeneficiary
);

// @route   GET /api/beneficiaries/:id
// @desc    Get beneficiary by ID
// @access  Private (View permission)
router.get(
  '/:id',
  validateId(),
  getBeneficiaryById
);

// @route   PUT /api/beneficiaries/:id
// @desc    Update beneficiary
// @access  Private (Edit permission)
router.put(
  '/:id',
  validateId(),
  sanitizeBody,
  updateBeneficiary
);

// @route   DELETE /api/beneficiaries/:id
// @desc    Delete beneficiary
// @access  Private (Delete permission)
router.delete(
  '/:id',
  validateId(),
  deleteBeneficiary
);

// ============================================
// BENEFICIARY SUPPORT ROUTES
// ============================================

// @route   GET /api/beneficiaries/:beneficiaryId/support
// @desc    Get all support for a beneficiary
// @access  Private (View permission)
router.get(
  '/:beneficiaryId/support',
  validateId('beneficiaryId'),
  getBeneficiarySupport
);

// @route   POST /api/beneficiaries/:beneficiaryId/support
// @desc    Create new support record
// @access  Private (Create permission)
router.post(
  '/:beneficiaryId/support',
  validateId('beneficiaryId'),
  sanitizeBody,
  createBeneficiarySupport
);

// @route   PUT /api/beneficiaries/support/:id
// @desc    Update support record
// @access  Private (Edit permission)
router.put(
  '/support/:id',
  validateId(),
  sanitizeBody,
  updateBeneficiarySupport
);

// @route   PUT /api/beneficiaries/support/:id/verify
// @desc    Verify support delivery
// @access  Private (Edit permission)
router.put(
  '/support/:id/verify',
  validateId(),
  sanitizeBody,
  verifySupport
);

// @route   DELETE /api/beneficiaries/support/:id
// @desc    Delete support record
// @access  Private (Delete permission)
router.delete(
  '/support/:id',
  validateId(),
  deleteBeneficiarySupport
);

export default router;
