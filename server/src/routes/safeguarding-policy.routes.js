import express from 'express';
import {
  getAllPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  acknowledgePolicy,
  getPolicyStats
} from '../controllers/safeguarding-policy.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Statistics route (before /:id to avoid conflict)
router.get('/stats', getPolicyStats);

// CRUD routes
router.get('/', getAllPolicies);
router.post('/', createPolicy);
router.get('/:id', getPolicyById);
router.put('/:id', updatePolicy);
router.delete('/:id', deletePolicy);

// Acknowledge policy
router.post('/:id/acknowledge', acknowledgePolicy);

export default router;
