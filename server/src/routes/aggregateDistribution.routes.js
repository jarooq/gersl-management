import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  createAggregateDistribution,
  getAggregateDistributionByTask,
  updateAggregateDistribution,
  verifyAggregateDistribution,
  getAllAggregateDistributions,
  deleteAggregateDistribution
} from '../controllers/aggregateDistribution.controller.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Task-specific aggregate distribution routes
router.post('/tasks/:taskId/aggregate-distribution', createAggregateDistribution);
router.get('/tasks/:taskId/aggregate-distribution', getAggregateDistributionByTask);

// Aggregate distribution management routes
router.get('/aggregate-distributions', getAllAggregateDistributions);
router.put('/aggregate-distributions/:id', updateAggregateDistribution);
router.put('/aggregate-distributions/:id/verify', verifyAggregateDistribution);
router.delete('/aggregate-distributions/:id', deleteAggregateDistribution);

export default router;
