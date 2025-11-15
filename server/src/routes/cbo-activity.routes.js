import express from 'express';
import {
  getAllActivities,
  getActivityById,
  getActivitiesByCBO,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivityStats
} from '../controllers/cbo-activity.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Statistics route (before /:id to avoid conflict)
router.get('/stats', getActivityStats);

// CBO-specific activities
router.get('/cbo/:cboPartnerId', getActivitiesByCBO);

// CRUD routes
router.get('/', getAllActivities);
router.post('/', createActivity);
router.get('/:id', getActivityById);
router.put('/:id', updateActivity);
router.delete('/:id', deleteActivity);

export default router;
