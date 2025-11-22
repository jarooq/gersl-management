import express from 'express';
import * as coordinatorController from '../controllers/coordinator.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all coordinators with stats
router.get('/', coordinatorController.getAllCoordinators);

// Get single coordinator details
router.get('/:id', coordinatorController.getCoordinatorById);

// Get coordinator performance stats
router.get('/:id/stats', coordinatorController.getCoordinatorStats);

// Get orphans assigned to coordinator
router.get('/:id/orphans', coordinatorController.getAssignedOrphans);

// Assign orphan to coordinator
router.post('/:id/assign-orphan', coordinatorController.assignOrphanToCoordinator);

// Unassign orphan from coordinator
router.delete('/:id/orphans/:orphanId', coordinatorController.unassignOrphan);

export default router;
