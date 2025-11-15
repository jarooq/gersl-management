import express from 'express';
import {
  getAllLearningEvents,
  getLearningEventById,
  createLearningEvent,
  updateLearningEvent,
  deleteLearningEvent,
  addParticipant,
  getLearningEventStats
} from '../controllers/learning-event.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Statistics route (before /:id to avoid conflict)
router.get('/stats', getLearningEventStats);

// CRUD routes
router.get('/', getAllLearningEvents);
router.post('/', createLearningEvent);
router.get('/:id', getLearningEventById);
router.put('/:id', updateLearningEvent);
router.delete('/:id', deleteLearningEvent);

// Participant management
router.post('/:id/participants', addParticipant);

export default router;
