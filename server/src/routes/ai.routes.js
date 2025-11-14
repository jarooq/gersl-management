import express from 'express';
import { generateProposal, checkAIStatus } from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { sanitizeBody } from '../middleware/validate.middleware.js';

const router = express.Router();

// @route   GET /api/ai/status
// @desc    Check if AI service is available
// @access  Private
router.get('/status', requireAuth, checkAIStatus);

// @route   POST /api/ai/generate-proposal
// @desc    Generate proposal from idea using AI
// @access  Private
router.post('/generate-proposal', requireAuth, sanitizeBody, generateProposal);

export default router;
