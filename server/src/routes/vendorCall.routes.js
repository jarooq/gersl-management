import express from 'express';
import * as vendorController from '../controllers/vendorCall.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', vendorController.getAllVendorCalls);
router.get('/stats', vendorController.getVendorCallStats);
router.get('/:id', vendorController.getVendorCallById);
router.post('/:id/submit', vendorController.submitVendorProposal); // Public

router.use(protect);
router.post('/', authorize('Admin', 'CEO', 'Programme Manager'), vendorController.createVendorCall);
router.put('/:id', authorize('Admin', 'CEO', 'Programme Manager'), vendorController.updateVendorCall);
router.put('/:id/submissions/:submissionId', authorize('Admin', 'CEO', 'Programme Manager'), vendorController.updateSubmissionStatus);
router.delete('/:id', authorize('Admin'), vendorController.deleteVendorCall);

export default router;
