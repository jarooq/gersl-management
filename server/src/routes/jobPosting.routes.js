import express from 'express';
import * as jobController from '../controllers/jobPosting.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', jobController.getAllJobPostings);
router.get('/stats', jobController.getJobPostingStats);
router.get('/:id', jobController.getJobPostingById);
router.post('/:id/apply', jobController.submitApplication); // Public

router.use(protect);
router.post('/', authorize('Admin', 'Manager'), jobController.createJobPosting);
router.put('/:id', authorize('Admin', 'Manager'), jobController.updateJobPosting);
router.put('/:id/applications/:applicationId', authorize('Admin', 'Manager'), jobController.updateApplicationStatus);
router.delete('/:id', authorize('Admin'), jobController.deleteJobPosting);

export default router;
