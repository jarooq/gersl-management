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
import { uploadFields, setUploadPath } from '../middleware/upload.middleware.js';

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
  setUploadPath('orphans'),
  uploadFields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'birthCertificate', maxCount: 1 },
    { name: 'deathCertificate', maxCount: 1 },
    { name: 'guardianNICDoc', maxCount: 1 },
    { name: 'schoolLetter', maxCount: 1 },
    { name: 'drawingLetter', maxCount: 1 },
    { name: 'otherDoc1', maxCount: 1 },
    { name: 'otherDoc2', maxCount: 1 }
  ]),
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
  setUploadPath('orphans'),
  uploadFields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'birthCertificate', maxCount: 1 },
    { name: 'deathCertificate', maxCount: 1 },
    { name: 'guardianNICDoc', maxCount: 1 },
    { name: 'schoolLetter', maxCount: 1 },
    { name: 'drawingLetter', maxCount: 1 },
    { name: 'otherDoc1', maxCount: 1 },
    { name: 'otherDoc2', maxCount: 1 }
  ]),
  updateOrphan
);

// @route   POST /api/orphans/:id/documents
// @desc    Upload additional documents for orphan
// @access  Private (Edit permission)
router.post(
  '/:id/documents',
  requireAuth,
  requirePermission(PERMISSIONS.ORPHANS_EDIT),
  validateId(),
  setUploadPath('orphans'),
  uploadFields([
    { name: 'birthCertificate', maxCount: 1 },
    { name: 'deathCertificate', maxCount: 1 },
    { name: 'guardianNICDoc', maxCount: 1 },
    { name: 'schoolLetter', maxCount: 1 },
    { name: 'drawingLetter', maxCount: 1 },
    { name: 'otherDoc1', maxCount: 1 },
    { name: 'otherDoc2', maxCount: 1 }
  ]),
  async (req, res, next) => {
    try {
      const { uploadDocuments } = await import('../controllers/orphan.controller.js');
      await uploadDocuments(req, res, next);
    } catch (error) {
      next(error);
    }
  }
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
