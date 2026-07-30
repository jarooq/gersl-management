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
  getGNDivisions,
  findSimilar
} from '../controllers/beneficiaries.controller.js';
import { requireAuth, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';
const reqView   = requirePermission(PERMISSIONS.BENEFICIARIES_VIEW);
const reqCreate = requirePermission(PERMISSIONS.BENEFICIARIES_CREATE);
const reqEdit   = requirePermission(PERMISSIONS.BENEFICIARIES_EDIT);
const reqDelete = requirePermission(PERMISSIONS.BENEFICIARIES_DELETE);
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
router.get('/stats', reqView, getBeneficiaryStats);
router.get('/districts', reqView, getDistricts);
router.get('/divisions', reqView, getDivisions);
router.get('/gn-divisions', reqView, getGNDivisions);
router.get('/similar', reqView, findSimilar);

router.get('/', reqView, validatePagination, getAllBeneficiaries);
router.post('/', reqCreate, sanitizeBody, createBeneficiary);
router.get('/:id', reqView, validateId(), getBeneficiaryById);
router.put('/:id', reqEdit, validateId(), sanitizeBody, updateBeneficiary);
router.delete('/:id', reqDelete, validateId(), deleteBeneficiary);

// ============================================
// BENEFICIARY SUPPORT ROUTES
// ============================================

router.get   ('/:beneficiaryId/support',  reqView,   validateId('beneficiaryId'), getBeneficiarySupport);
router.post  ('/:beneficiaryId/support',  reqCreate, validateId('beneficiaryId'), sanitizeBody, createBeneficiarySupport);
router.put   ('/support/:id',             reqEdit,   validateId(), sanitizeBody, updateBeneficiarySupport);
router.put   ('/support/:id/verify',      reqEdit,   validateId(), sanitizeBody, verifySupport);
router.delete('/support/:id',             reqDelete, validateId(), deleteBeneficiarySupport);

export default router;
