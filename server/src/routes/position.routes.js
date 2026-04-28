import express from 'express';
import positionController from '../controllers/position.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// ============================================
// POSITION CRUD ROUTES
// ============================================

// Get all positions (with optional includeInactive query param)
router.get('/', protect, positionController.getAllPositions);

// Get single position by ID
router.get('/:id', protect, positionController.getPositionById);

// Create new position
router.post('/', protect, positionController.createPosition);

// Update position
router.put('/:id', protect, positionController.updatePosition);

// Soft delete (deactivate) position
router.delete('/:id', protect, positionController.deletePosition);

// Hard delete position (permanent)
router.delete('/:id/hard', protect, positionController.hardDeletePosition);

// Reorder positions
router.put('/reorder', protect, positionController.reorderPositions);

export default router;
