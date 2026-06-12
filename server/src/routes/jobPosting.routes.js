import express from 'express';
import * as jobController from '../controllers/jobPosting.controller.js';
import { protect, authorize, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', jobController.getAllJobPostings);
router.get('/stats', jobController.getJobPostingStats);
router.get('/:id', jobController.getJobPostingById);
router.post('/:id/apply', jobController.submitApplication); // Public

router.use(protect);
router.post('/', requirePermission(PERMISSIONS.HR_CREATE), jobController.createJobPosting);
router.put('/:id', requirePermission(PERMISSIONS.HR_EDIT), jobController.updateJobPosting);
router.put('/:id/applications/:applicationId', requirePermission(PERMISSIONS.HR_EDIT), jobController.updateApplicationStatus);
router.delete('/:id', authorize('Admin'), jobController.deleteJobPosting);

export default router;
