import express from 'express';
import {
  getAllPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  deletePartner,
  getPartnerStats
} from '../controllers/partner.controller.js';
import { requireAuth, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';
import { validateId, validatePagination, sanitizeBody } from '../middleware/validate.middleware.js';

const router = express.Router();

// @route   GET /api/partners/stats
// @desc    Get partner statistics
// @access  Private (View permission)
router.get(
  '/stats',
  requireAuth,
  requirePermission(PERMISSIONS.PARTNERS_VIEW),
  getPartnerStats
);

// @route   GET /api/partners
// @desc    Get all partners
// @access  Private (View permission)
router.get(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.PARTNERS_VIEW),
  validatePagination,
  getAllPartners
);

// @route   POST /api/partners
// @desc    Create new partner
// @access  Private (Create permission)
router.post(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.PARTNERS_CREATE),
  sanitizeBody,
  createPartner
);

// @route   GET /api/partners/:id
// @desc    Get partner by ID
// @access  Private (View permission)
router.get(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.PARTNERS_VIEW),
  validateId(),
  getPartnerById
);

// @route   PUT /api/partners/:id
// @desc    Update partner
// @access  Private (Edit permission)
router.put(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.PARTNERS_EDIT),
  validateId(),
  sanitizeBody,
  updatePartner
);

// @route   DELETE /api/partners/:id
// @desc    Delete partner
// @access  Private (Delete permission)
router.delete(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.PARTNERS_DELETE),
  validateId(),
  deletePartner
);

export default router;
