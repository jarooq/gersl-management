import express from 'express';
import {
  getAllComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  deleteComplaint,
  assignComplaint,
  getComplaintStats
} from '../controllers/complaint.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Statistics route (before /:id to avoid conflict)
router.get('/stats', getComplaintStats);

// CRUD routes
router.get('/', getAllComplaints);
router.post('/', createComplaint);
router.get('/:id', getComplaintById);
router.put('/:id', updateComplaint);
router.delete('/:id', deleteComplaint);

// Assignment route
router.put('/:id/assign', assignComplaint);

export default router;
