import express from 'express';
import {
  getAllPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  deletePartner,
  getPartnerStats,
  getPartnerContributions,
  createPartnerContribution,
  updatePartnerContribution,
  deletePartnerContribution,
  getPartnerCommunications,
  createPartnerCommunication,
  updatePartnerCommunication,
  deletePartnerCommunication
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

// ============================================
// PARTNER CONTRIBUTION ROUTES
// ============================================

// @route   GET /api/partners/:partnerId/contributions
// @desc    Get all contributions for a partner
// @access  Private (View permission)
router.get(
  '/:partnerId/contributions',
  requireAuth,
  requirePermission(PERMISSIONS.PARTNERS_VIEW),
  validateId('partnerId'),
  getPartnerContributions
);

// @route   POST /api/partners/:partnerId/contributions
// @desc    Create new contribution
// @access  Private (Create permission)
router.post(
  '/:partnerId/contributions',
  requireAuth,
  requirePermission(PERMISSIONS.PARTNERS_CREATE),
  validateId('partnerId'),
  sanitizeBody,
  createPartnerContribution
);

// @route   PUT /api/partners/contributions/:id
// @desc    Update contribution
// @access  Private (Edit permission)
router.put(
  '/contributions/:id',
  requireAuth,
  requirePermission(PERMISSIONS.PARTNERS_EDIT),
  validateId(),
  sanitizeBody,
  updatePartnerContribution
);

// @route   DELETE /api/partners/contributions/:id
// @desc    Delete contribution
// @access  Private (Delete permission)
router.delete(
  '/contributions/:id',
  requireAuth,
  requirePermission(PERMISSIONS.PARTNERS_DELETE),
  validateId(),
  deletePartnerContribution
);

// ============================================
// PARTNER COMMUNICATION ROUTES
// ============================================

// @route   GET /api/partners/:partnerId/communications
// @desc    Get all communications for a partner
// @access  Private (View permission)
router.get(
  '/:partnerId/communications',
  requireAuth,
  requirePermission(PERMISSIONS.PARTNERS_VIEW),
  validateId('partnerId'),
  getPartnerCommunications
);

// @route   POST /api/partners/:partnerId/communications
// @desc    Create new communication
// @access  Private (Create permission)
router.post(
  '/:partnerId/communications',
  requireAuth,
  requirePermission(PERMISSIONS.PARTNERS_CREATE),
  validateId('partnerId'),
  sanitizeBody,
  createPartnerCommunication
);

// @route   PUT /api/partners/communications/:id
// @desc    Update communication
// @access  Private (Edit permission)
router.put(
  '/communications/:id',
  requireAuth,
  requirePermission(PERMISSIONS.PARTNERS_EDIT),
  validateId(),
  sanitizeBody,
  updatePartnerCommunication
);

// @route   DELETE /api/partners/communications/:id
// @desc    Delete communication
// @access  Private (Delete permission)
router.delete(
  '/communications/:id',
  requireAuth,
  requirePermission(PERMISSIONS.PARTNERS_DELETE),
  validateId(),
  deletePartnerCommunication
);

export default router;
