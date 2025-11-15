import express from 'express';
import {
  getAllVolunteers,
  getVolunteerById,
  getVolunteersByCBO,
  createVolunteer,
  updateVolunteer,
  deleteVolunteer,
  searchVolunteers,
  getVolunteerStats
} from '../controllers/cbo-volunteer.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Statistics and search routes (before /:id to avoid conflict)
router.get('/stats', getVolunteerStats);
router.get('/search', searchVolunteers);

// CBO-specific volunteers
router.get('/cbo/:cboPartnerId', getVolunteersByCBO);

// CRUD routes
router.get('/', getAllVolunteers);
router.post('/', createVolunteer);
router.get('/:id', getVolunteerById);
router.put('/:id', updateVolunteer);
router.delete('/:id', deleteVolunteer);

export default router;
