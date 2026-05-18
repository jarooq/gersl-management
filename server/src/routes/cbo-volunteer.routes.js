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
import { requireAuth, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';

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
router.post('/', requirePermission(PERMISSIONS.CBO_CREATE), createVolunteer);
router.get('/:id', getVolunteerById);
router.put('/:id', requirePermission(PERMISSIONS.CBO_EDIT), updateVolunteer);
router.delete('/:id', requirePermission(PERMISSIONS.CBO_DELETE), deleteVolunteer);

export default router;
