import express from 'express';
import {
  getAllReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
  updateReportSection,
  getReportsByProject,
  getReportsByProposal,
  getReportsByType,
  shareReport,
  exportReport
} from '../controllers/report.controller.js';
import { requireAuth, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';
import { validateId, validatePagination, sanitizeBody } from '../middleware/validate.middleware.js';

const router = express.Router();

// ============================================
// STATISTICS & SPECIAL ROUTES
// ============================================

// @route   GET /api/reports/project/:projectId
// @desc    Get all reports for a specific project
// @access  Private (Reports view permission)
router.get(
  '/project/:projectId',
  requireAuth,
  requirePermission(PERMISSIONS.REPORTS_VIEW),
  validateId('projectId'),
  getReportsByProject
);

// @route   GET /api/reports/proposal/:proposalId
// @desc    Get all reports for a specific proposal
// @access  Private (Reports view permission)
router.get(
  '/proposal/:proposalId',
  requireAuth,
  requirePermission(PERMISSIONS.REPORTS_VIEW),
  validateId('proposalId'),
  getReportsByProposal
);

// @route   GET /api/reports/type/:reportType
// @desc    Get all reports of a specific type
// @access  Private (Reports view permission)
router.get(
  '/type/:reportType',
  requireAuth,
  requirePermission(PERMISSIONS.REPORTS_VIEW),
  getReportsByType
);

// @route   PUT /api/reports/:id/section
// @desc    Update a specific section in a report
// @access  Private (Reports edit permission)
router.put(
  '/:id/section',
  requireAuth,
  requirePermission(PERMISSIONS.REPORTS_EDIT),
  validateId(),
  sanitizeBody,
  updateReportSection
);

// @route   POST /api/reports/:id/share
// @desc    Share report with specific users
// @access  Private (Reports edit permission)
router.post(
  '/:id/share',
  requireAuth,
  requirePermission(PERMISSIONS.REPORTS_EDIT),
  validateId(),
  sanitizeBody,
  shareReport
);

// @route   GET /api/reports/:id/export
// @desc    Export report in specific format
// @access  Private (Reports view permission)
router.get(
  '/:id/export',
  requireAuth,
  requirePermission(PERMISSIONS.REPORTS_VIEW),
  validateId(),
  exportReport
);

// ============================================
// CRUD ROUTES
// ============================================

// @route   GET /api/reports
// @desc    Get all reports with pagination and filters
// @access  Private (Reports view permission)
router.get(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.REPORTS_VIEW),
  validatePagination,
  getAllReports
);

// @route   POST /api/reports
// @desc    Create new AI-generated report
// @access  Private (Reports create permission)
router.post(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.REPORTS_CREATE),
  sanitizeBody,
  createReport
);

// @route   GET /api/reports/:id
// @desc    Get report by ID
// @access  Private (Reports view permission)
router.get(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.REPORTS_VIEW),
  validateId(),
  getReportById
);

// @route   PUT /api/reports/:id
// @desc    Update report
// @access  Private (Reports edit permission)
router.put(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.REPORTS_EDIT),
  validateId(),
  sanitizeBody,
  updateReport
);

// @route   DELETE /api/reports/:id
// @desc    Delete report
// @access  Private (Reports delete permission)
router.delete(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.REPORTS_DELETE),
  validateId(),
  deleteReport
);

export default router;
