import express from 'express';
import {
  getAllDueDiligence,
  getDueDiligenceById,
  getDueDiligenceByCBO,
  createDueDiligence,
  updateDueDiligence,
  submitDueDiligence,
  approveDueDiligence,
  rejectDueDiligence,
  deleteDueDiligence,
  getDueDiligenceStats
} from '../controllers/cbo-due-diligence.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Statistics route (before /:id to avoid conflict)
router.get('/stats', getDueDiligenceStats);

// CBO-specific due diligence assessments
router.get('/cbo/:cboPartnerId', getDueDiligenceByCBO);

// CRUD routes
router.get('/', getAllDueDiligence);
router.post('/', createDueDiligence);
router.get('/:id', getDueDiligenceById);
router.put('/:id', updateDueDiligence);
router.delete('/:id', deleteDueDiligence);

// Workflow routes
router.put('/:id/submit', submitDueDiligence);
router.put('/:id/approve', approveDueDiligence);
router.put('/:id/reject', rejectDueDiligence);

export default router;
