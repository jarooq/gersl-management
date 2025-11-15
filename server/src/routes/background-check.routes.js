import express from 'express';
import {
  getAllBackgroundChecks,
  getBackgroundCheckById,
  createBackgroundCheck,
  updateBackgroundCheck,
  deleteBackgroundCheck,
  getExpiringChecks,
  getBackgroundCheckStats
} from '../controllers/background-check.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Statistics and special routes (before /:id to avoid conflict)
router.get('/stats', getBackgroundCheckStats);
router.get('/expiring', getExpiringChecks);

// CRUD routes
router.get('/', getAllBackgroundChecks);
router.post('/', createBackgroundCheck);
router.get('/:id', getBackgroundCheckById);
router.put('/:id', updateBackgroundCheck);
router.delete('/:id', deleteBackgroundCheck);

export default router;
