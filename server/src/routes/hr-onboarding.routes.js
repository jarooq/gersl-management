import express from 'express';
import {
  getAllOnboardingRecords,
  getOnboardingRecordById,
  getOnboardingRecordsByStaff,
  createOnboardingRecord,
  updateOnboardingRecord,
  updateOnboardingProgress,
  deleteOnboardingRecord,
  getOnboardingStats
} from '../controllers/hr-onboarding.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Statistics route (before /:id to avoid conflict)
router.get('/stats', getOnboardingStats);

// Staff-specific onboarding records
router.get('/staff/:staffId', getOnboardingRecordsByStaff);

// CRUD routes
router.get('/', getAllOnboardingRecords);
router.post('/', createOnboardingRecord);
router.get('/:id', getOnboardingRecordById);
router.put('/:id', updateOnboardingRecord);
router.delete('/:id', deleteOnboardingRecord);

// Progress update route
router.put('/:id/progress', updateOnboardingProgress);

export default router;
