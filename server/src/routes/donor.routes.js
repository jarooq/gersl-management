import express from 'express';
import {
  getAllDonors,
  getDonorById,
  createDonor,
  updateDonor,
  deleteDonor,
  getDonorStats
} from '../controllers/donor.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// @route   GET /api/donors/stats
// @desc    Get donor statistics
// @access  Private
router.get('/stats', getDonorStats);

// @route   GET /api/donors
// @desc    Get all donors
// @access  Private
router.get('/', getAllDonors);

// @route   POST /api/donors
// @desc    Create new donor
// @access  Private
router.post('/', createDonor);

// @route   GET /api/donors/:id
// @desc    Get donor by ID
// @access  Private
router.get('/:id', validateId(), getDonorById);

// @route   PUT /api/donors/:id
// @desc    Update donor
// @access  Private
router.put('/:id', validateId(), updateDonor);

// @route   DELETE /api/donors/:id
// @desc    Delete donor
// @access  Private
router.delete('/:id', validateId(), deleteDonor);

export default router;
