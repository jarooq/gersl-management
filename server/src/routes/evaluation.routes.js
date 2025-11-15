import express from 'express';
import {
  getAllEvaluations,
  getEvaluationById,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
  getEvaluationStats
} from '../controllers/evaluation.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Statistics route (before /:id to avoid conflict)
router.get('/stats', getEvaluationStats);

// CRUD routes
router.get('/', getAllEvaluations);
router.post('/', createEvaluation);
router.get('/:id', getEvaluationById);
router.put('/:id', updateEvaluation);
router.delete('/:id', deleteEvaluation);

export default router;
