import express from 'express';
import {
  getAllOrphans,
  getOrphanById,
  createOrphan,
  updateOrphan,
  deleteOrphan,
  approveOrphan,
  getOrphanStats,
  getOrphansByCoordinator,
  bulkImportOrphans
} from '../controllers/orphan.controller.js';
import { requireAuth, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';
import { validateId, validatePagination, sanitizeBody } from '../middleware/validate.middleware.js';

const router = express.Router();

// ============================================
// STATISTICS ROUTES
// ============================================

// @route   GET /api/orphans/stats
// @desc    Get orphan statistics
// @access  Private (View permission)
router.get(
  '/stats',
  requireAuth,
  requirePermission(PERMISSIONS.ORPHANS_VIEW),
  getOrphanStats
);

// @route   GET /api/orphans/coordinator/:coordinatorId
// @desc    Get orphans by coordinator
// @access  Private (View permission)
router.get(
  '/coordinator/:coordinatorId',
  requireAuth,
  requirePermission(PERMISSIONS.ORPHANS_VIEW),
  validateId('coordinatorId'),
  getOrphansByCoordinator
);

// ============================================
// CRUD ROUTES
// ============================================

// @route   GET /api/orphans
// @desc    Get all orphans with pagination and filters
// @access  Private (View permission)
router.get(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.ORPHANS_VIEW),
  validatePagination,
  getAllOrphans
);

// @route   POST /api/orphans
// @desc    Create new orphan
// @access  Private (Create permission)
router.post(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.ORPHANS_CREATE),
  sanitizeBody,
  createOrphan
);

// @route   POST /api/orphans/bulk-import
// @desc    Bulk import orphans from Excel/CSV
// @access  Private (Create permission)
router.post(
  '/bulk-import',
  requireAuth,
  requirePermission(PERMISSIONS.ORPHANS_CREATE),
  sanitizeBody,
  bulkImportOrphans
);

// @route   GET /api/orphans/:id
// @desc    Get orphan by ID
// @access  Private (View permission)
router.get(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.ORPHANS_VIEW),
  validateId(),
  getOrphanById
);

// @route   PUT /api/orphans/:id
// @desc    Update orphan
// @access  Private (Edit permission)
router.put(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.ORPHANS_EDIT),
  validateId(),
  sanitizeBody,
  updateOrphan
);

// @route   DELETE /api/orphans/:id
// @desc    Delete orphan
// @access  Private (Delete permission)
router.delete(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.ORPHANS_DELETE),
  validateId(),
  deleteOrphan
);

// @route   PUT /api/orphans/:id/approve
// @desc    Approve or reject orphan
// @access  Private (Approve permission)
router.put(
  '/:id/approve',
  requireAuth,
  requirePermission(PERMISSIONS.ORPHANS_APPROVE),
  validateId(),
  sanitizeBody,
  approveOrphan
);

export default router;
