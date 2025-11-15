import express from 'express';
import {
  getAllTrainings,
  getTrainingById,
  createTraining,
  updateTraining,
  deleteTraining,
  addAttendee,
  markAttendance,
  getTrainingStats
} from '../controllers/compliance-training.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Statistics route (before /:id to avoid conflict)
router.get('/stats', getTrainingStats);

// CRUD routes
router.get('/', getAllTrainings);
router.post('/', createTraining);
router.get('/:id', getTrainingById);
router.put('/:id', updateTraining);
router.delete('/:id', deleteTraining);

// Attendee management routes
router.post('/:id/attendees', addAttendee);
router.put('/:id/attendance', markAttendance);

export default router;
