import express from 'express';
import {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffStats
} from '../controllers/hr.controller.js';
import { requireAuth, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';
import { validateId, validatePagination, sanitizeBody } from '../middleware/validate.middleware.js';

const router = express.Router();

// @route   GET /api/hr/stats
// @desc    Get staff statistics
// @access  Private (View permission)
router.get(
  '/stats',
  requireAuth,
  requirePermission(PERMISSIONS.HR_VIEW),
  getStaffStats
);

// @route   GET /api/hr
// @desc    Get all staff with pagination
// @access  Private (View permission)
router.get(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.HR_VIEW),
  validatePagination,
  getAllStaff
);

// @route   POST /api/hr
// @desc    Create new staff
// @access  Private (Create permission)
router.post(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.HR_CREATE),
  sanitizeBody,
  createStaff
);

// @route   GET /api/hr/:id
// @desc    Get staff by ID
// @access  Private (View permission)
router.get(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.HR_VIEW),
  validateId(),
  getStaffById
);

// @route   PUT /api/hr/:id
// @desc    Update staff
// @access  Private (Edit permission)
router.put(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.HR_EDIT),
  validateId(),
  sanitizeBody,
  updateStaff
);

// @route   DELETE /api/hr/:id
// @desc    Delete staff
// @access  Private (Delete permission)
router.delete(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.HR_DELETE),
  validateId(),
  deleteStaff
);

export default router;
