import express from 'express';
import {
  getAllIndicators,
  getIndicatorById,
  createIndicator,
  updateIndicator,
  deleteIndicator,
  updateIndicatorProgress,
  getIndicatorStats
} from '../controllers/meal.controller.js';
import { requireAuth, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';
import { validateId, validatePagination, sanitizeBody } from '../middleware/validate.middleware.js';

const router = express.Router();

// @route   GET /api/meal/stats
// @desc    Get indicator statistics
// @access  Private (View permission)
router.get(
  '/stats',
  requireAuth,
  requirePermission(PERMISSIONS.MEAL_VIEW),
  getIndicatorStats
);

// @route   PUT /api/meal/:id/progress
// @desc    Update indicator progress
// @access  Private (Edit permission)
router.put(
  '/:id/progress',
  requireAuth,
  requirePermission(PERMISSIONS.MEAL_EDIT),
  validateId(),
  sanitizeBody,
  updateIndicatorProgress
);

// @route   GET /api/meal
// @desc    Get all indicators
// @access  Private (View permission)
router.get(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.MEAL_VIEW),
  validatePagination,
  getAllIndicators
);

// @route   POST /api/meal
// @desc    Create new indicator
// @access  Private (Create permission)
router.post(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.MEAL_CREATE),
  sanitizeBody,
  createIndicator
);

// @route   GET /api/meal/:id
// @desc    Get indicator by ID
// @access  Private (View permission)
router.get(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.MEAL_VIEW),
  validateId(),
  getIndicatorById
);

// @route   PUT /api/meal/:id
// @desc    Update indicator
// @access  Private (Edit permission)
router.put(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.MEAL_EDIT),
  validateId(),
  sanitizeBody,
  updateIndicator
);

// @route   DELETE /api/meal/:id
// @desc    Delete indicator
// @access  Private (Delete permission)
router.delete(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.MEAL_DELETE),
  validateId(),
  deleteIndicator
);

export default router;
