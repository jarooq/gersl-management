import express from 'express';
import {
  uploadSingleFile,
  uploadMultipleFiles,
  deleteUploadedFile
} from '../controllers/upload.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { setUploadPath, uploadSingle, uploadMultiple } from '../middleware/upload.middleware.js';

const router = express.Router();

// All upload routes require authentication
router.use(requireAuth);

// ============================================
// ORPHAN DOCUMENT UPLOADS
// ============================================

// @route   POST /api/upload/orphan
// @desc    Upload single orphan document
// @access  Private
router.post(
  '/orphan',
  setUploadPath('orphans'),
  uploadSingle('file'),
  uploadSingleFile
);

// @route   POST /api/upload/orphan/multiple
// @desc    Upload multiple orphan documents
// @access  Private
router.post(
  '/orphan/multiple',
  setUploadPath('orphans'),
  uploadMultiple('files', 5),
  uploadMultipleFiles
);

// ============================================
// PROJECT DOCUMENT UPLOADS
// ============================================

// @route   POST /api/upload/project
// @desc    Upload single project document
// @access  Private
router.post(
  '/project',
  setUploadPath('projects'),
  uploadSingle('file'),
  uploadSingleFile
);

// @route   POST /api/upload/project/multiple
// @desc    Upload multiple project documents
// @access  Private
router.post(
  '/project/multiple',
  setUploadPath('projects'),
  uploadMultiple('files', 10),
  uploadMultipleFiles
);

// ============================================
// FINANCE DOCUMENT UPLOADS
// ============================================

// @route   POST /api/upload/finance
// @desc    Upload single finance document (receipt, invoice, etc.)
// @access  Private
router.post(
  '/finance',
  setUploadPath('finance'),
  uploadSingle('file'),
  uploadSingleFile
);

// @route   POST /api/upload/finance/multiple
// @desc    Upload multiple finance documents
// @access  Private
router.post(
  '/finance/multiple',
  setUploadPath('finance'),
  uploadMultiple('files', 10),
  uploadMultipleFiles
);

// ============================================
// HR DOCUMENT UPLOADS
// ============================================

// @route   POST /api/upload/hr
// @desc    Upload single HR document
// @access  Private
router.post(
  '/hr',
  setUploadPath('hr'),
  uploadSingle('file'),
  uploadSingleFile
);

// ============================================
// CBO DOCUMENT UPLOADS
// ============================================

// @route   POST /api/upload/cbo
// @desc    Upload single CBO document
// @access  Private
router.post(
  '/cbo',
  setUploadPath('cbo'),
  uploadSingle('file'),
  uploadSingleFile
);

// ============================================
// PROFILE IMAGE UPLOADS
// ============================================

// @route   POST /api/upload/profile
// @desc    Upload profile image
// @access  Private
router.post(
  '/profile',
  setUploadPath('profiles'),
  uploadSingle('image'),
  uploadSingleFile
);

// ============================================
// DELETE FILE
// ============================================

// @route   DELETE /api/upload
// @desc    Delete uploaded file
// @access  Private
router.delete('/', deleteUploadedFile);

export default router;
