import express from 'express';
import {
  getAllIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident,
  assignIncident,
  getIncidentStats
} from '../controllers/safeguarding-incident.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Statistics route (before /:id to avoid conflict)
router.get('/stats', getIncidentStats);

// CRUD routes
router.get('/', getAllIncidents);
router.post('/', createIncident);
router.get('/:id', getIncidentById);
router.put('/:id', updateIncident);
router.delete('/:id', deleteIncident);

// Assign incident
router.put('/:id/assign', assignIncident);

export default router;
