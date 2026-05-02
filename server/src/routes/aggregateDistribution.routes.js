import express from 'express';
import { requireAuth, authorize } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';
import {
  createAggregateDistribution,
  getAggregateDistributionByTask,
  updateAggregateDistribution,
  verifyAggregateDistribution,
  getAllAggregateDistributions,
  deleteAggregateDistribution
} from '../controllers/aggregateDistribution.controller.js';

const router = express.Router();

router.use(requireAuth);
const requireMealEditor = authorize(
  'Admin', 'CEO', 'Director Programmes', 'Programme Manager',
  'MEAL Officer', 'Project Officer', 'Field Officer'
);
const requireMealVerifier = authorize('Admin', 'CEO', 'Programme Manager', 'MEAL Officer');

router.post  ('/tasks/:taskId/aggregate-distribution', validateId('taskId'), requireMealEditor, createAggregateDistribution);
router.get   ('/tasks/:taskId/aggregate-distribution', validateId('taskId'), getAggregateDistributionByTask);

router.get   ('/aggregate-distributions',              getAllAggregateDistributions);
router.put   ('/aggregate-distributions/:id',          validateId(), requireMealEditor,   updateAggregateDistribution);
router.put   ('/aggregate-distributions/:id/verify',   validateId(), requireMealVerifier, verifyAggregateDistribution);
router.delete('/aggregate-distributions/:id',          validateId(), authorize('Admin', 'Programme Manager'), deleteAggregateDistribution);

export default router;
