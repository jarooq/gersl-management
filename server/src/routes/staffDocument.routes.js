import express from 'express';
import {
  getStaffDocuments,
  getDocumentById,
  uploadStaffDocument,
  updateStaffDocument,
  verifyDocument,
  rejectDocument,
  deleteStaffDocument,
  getDocumentTypes
} from '../controllers/staffDocument.controller.js';
import { protect, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';
import { uploadStaffDocument as uploadMiddleware } from '../middleware/staffDocumentUpload.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Document types (anyone authenticated can see)
router.get('/types', getDocumentTypes);

// Staff documents by user
router.get('/user/:userId', getStaffDocuments);
router.post(
  '/user/:userId',
  requirePermission(PERMISSIONS.HR_UPLOAD_DOCUMENTS, PERMISSIONS.HR_CREATE),
  uploadMiddleware,
  uploadStaffDocument
);

// Individual document operations
router.get('/:id', getDocumentById);
router.put('/:id', requirePermission(PERMISSIONS.HR_EDIT), updateStaffDocument);
router.delete('/:id', requirePermission(PERMISSIONS.HR_DELETE), deleteStaffDocument);

// Document verification (only HR Manager and Admin can verify/reject)
router.post('/:id/verify', requirePermission(PERMISSIONS.HR_VERIFY_DOCUMENTS), verifyDocument);
router.post('/:id/reject', requirePermission(PERMISSIONS.HR_VERIFY_DOCUMENTS), rejectDocument);

export default router;
