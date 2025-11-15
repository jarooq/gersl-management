import express from 'express';
import * as complianceController from '../controllers/compliance.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/', complianceController.getAllComplianceDocuments);
router.get('/stats', complianceController.getComplianceStats);
router.get('/expiring', complianceController.getExpiringDocuments);
router.get('/review-due', complianceController.getReviewDueDocuments);
router.get('/:id', complianceController.getComplianceDocumentById);
router.post('/', authorize('Admin', 'Manager'), complianceController.createComplianceDocument);
router.put('/:id', authorize('Admin', 'Manager'), complianceController.updateComplianceDocument);
router.delete('/:id', authorize('Admin'), complianceController.deleteComplianceDocument);

export default router;
