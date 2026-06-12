import express from 'express';
import {
  uploadSingleFile,
  uploadMultipleFiles,
  deleteUploadedFile
} from '../controllers/upload.controller.js';
import { requireAuth, authorize } from '../middleware/auth.middleware.js';
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
// CAMPAIGN IMAGE UPLOADS
// ============================================

// @route   POST /api/upload/campaign
// @desc    Upload campaign image
// @access  Private
router.post(
  '/campaign',
  setUploadPath('campaigns'),
  uploadSingle('image'),
  uploadSingleFile
);

// ============================================
// PUNCH SELFIE UPLOADS
// ============================================
router.post(
  '/punch',
  setUploadPath('punches'),
  uploadSingle('image'),
  uploadSingleFile
);

// ============================================
// VISIT PHOTO UPLOADS
// ============================================
router.post(
  '/visit',
  setUploadPath('visits'),
  uploadSingle('image'),
  uploadSingleFile
);

// ============================================
// DELETE FILE
// ============================================

// @route   DELETE /api/upload
// @desc    Delete uploaded file
// @access  Private (Admin / Manager only — prevents arbitrary file deletion)
router.delete('/', authorize('Admin', 'Manager'), deleteUploadedFile);

// ============================================
// UPLOAD ERROR HANDLER
// ============================================
// Router-scoped error middleware. The global handler hides 500 messages in
// production ("Internal server error"), which made prod upload failures
// impossible to diagnose from the client. Uploads fail for a small set of
// well-understood reasons — surface each one clearly. Authenticated route,
// HTTPS only, so echoing the real reason here is acceptable.
router.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error('[upload] failed:', {
    name: err?.name, code: err?.code, message: err?.message,
  });

  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large. Maximum size is 5MB.' });
  }
  if (err?.name === 'MulterError') {
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  if (err?.statusCode) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }
  // Read-only / inaccessible filesystem: disk fallback is being used but the
  // platform won't allow writes (Vercel serverless is read-only outside
  // /tmp). The real fix is to configure S3/R2 object storage.
  if (err?.code === 'EROFS' || err?.code === 'EACCES') {
    return res.status(500).json({
      success: false,
      message: 'Server file storage is not configured. Object storage (S3 / Cloudflare R2) must be set up — the serverless filesystem is read-only.',
    });
  }
  return res.status(500).json({
    success: false,
    message: `Upload failed: ${err?.message || 'unknown error'}`,
  });
});

export default router;
