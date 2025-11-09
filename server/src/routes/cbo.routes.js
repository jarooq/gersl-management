import express from 'express';
import {
  getAllCBOPartners,
  getCBOPartnerById,
  createCBOPartner,
  updateCBOPartner,
  deleteCBOPartner,
  getCBOStats
} from '../controllers/cbo.controller.js';
import { requireAuth, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';
import { validateId, validatePagination, sanitizeBody } from '../middleware/validate.middleware.js';

const router = express.Router();

// @route   GET /api/cbo/stats
// @desc    Get CBO statistics
// @access  Private (View permission)
router.get(
  '/stats',
  requireAuth,
  requirePermission(PERMISSIONS.CBO_VIEW),
  getCBOStats
);

// @route   GET /api/cbo
// @desc    Get all CBO partners
// @access  Private (View permission)
router.get(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.CBO_VIEW),
  validatePagination,
  getAllCBOPartners
);

// @route   POST /api/cbo
// @desc    Create new CBO partner
// @access  Private (Create permission)
router.post(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.CBO_CREATE),
  sanitizeBody,
  createCBOPartner
);

// @route   GET /api/cbo/:id
// @desc    Get CBO partner by ID
// @access  Private (View permission)
router.get(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.CBO_VIEW),
  validateId(),
  getCBOPartnerById
);

// @route   PUT /api/cbo/:id
// @desc    Update CBO partner
// @access  Private (Edit permission)
router.put(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.CBO_EDIT),
  validateId(),
  sanitizeBody,
  updateCBOPartner
);

// @route   DELETE /api/cbo/:id
// @desc    Delete CBO partner
// @access  Private (Delete permission)
router.delete(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.CBO_DELETE),
  validateId(),
  deleteCBOPartner
);

export default router;
