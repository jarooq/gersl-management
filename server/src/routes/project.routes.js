import express from 'express';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  updateProjectProgress,
  getProjectExpenses,
  getProjectIndicators
} from '../controllers/project.controller.js';
import { requireAuth, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';
import { validateId, validatePagination, sanitizeBody } from '../middleware/validate.middleware.js';

const router = express.Router();

// ============================================
// STATISTICS & SPECIAL ROUTES
// ============================================

// @route   GET /api/projects/stats
// @desc    Get project statistics
// @access  Private (View permission)
router.get(
  '/stats',
  requireAuth,
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  getProjectStats
);

// @route   GET /api/projects/:id/expenses
// @desc    Get project expenses
// @access  Private (View permission)
router.get(
  '/:id/expenses',
  requireAuth,
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  validateId(),
  getProjectExpenses
);

// @route   GET /api/projects/:id/indicators
// @desc    Get project indicators
// @access  Private (View permission)
router.get(
  '/:id/indicators',
  requireAuth,
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  validateId(),
  getProjectIndicators
);

// @route   PUT /api/projects/:id/progress
// @desc    Update project progress
// @access  Private (Edit permission)
router.put(
  '/:id/progress',
  requireAuth,
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  validateId(),
  sanitizeBody,
  updateProjectProgress
);

// ============================================
// CRUD ROUTES
// ============================================

// @route   GET /api/projects
// @desc    Get all projects with pagination and filters
// @access  Private (View permission)
router.get(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  validatePagination,
  getAllProjects
);

// @route   POST /api/projects
// @desc    Create new project
// @access  Private (Create permission)
router.post(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.PROJECTS_CREATE),
  sanitizeBody,
  createProject
);

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private (View permission)
router.get(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  validateId(),
  getProjectById
);

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private (Edit permission)
router.put(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  validateId(),
  sanitizeBody,
  updateProject
);

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private (Delete permission)
router.delete(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.PROJECTS_DELETE),
  validateId(),
  deleteProject
);

export default router;
