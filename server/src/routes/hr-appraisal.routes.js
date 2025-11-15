import express from 'express';
import {
  getAllAppraisalRecords,
  getAppraisalRecordById,
  getAppraisalRecordsByStaff,
  createAppraisalRecord,
  updateAppraisalRecord,
  submitAppraisal,
  acknowledgeAppraisal,
  deleteAppraisalRecord,
  getAppraisalStats
} from '../controllers/hr-appraisal.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Statistics route (before /:id to avoid conflict)
router.get('/stats', getAppraisalStats);

// Staff-specific appraisal records
router.get('/staff/:staffId', getAppraisalRecordsByStaff);

// CRUD routes
router.get('/', getAllAppraisalRecords);
router.post('/', createAppraisalRecord);
router.get('/:id', getAppraisalRecordById);
router.put('/:id', updateAppraisalRecord);
router.delete('/:id', deleteAppraisalRecord);

// Workflow routes
router.put('/:id/submit', submitAppraisal);
router.put('/:id/acknowledge', acknowledgeAppraisal);

export default router;
