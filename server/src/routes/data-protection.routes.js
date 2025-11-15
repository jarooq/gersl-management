import express from 'express';
import {
  getAllDataProtectionRecords,
  getDataProtectionRecordById,
  createDataProtectionRecord,
  updateDataProtectionRecord,
  deleteDataProtectionRecord,
  getConsentRecords,
  getDataAccessRequests,
  getDataBreaches,
  getAuditRecords,
  getDataProtectionStats
} from '../controllers/data-protection.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Statistics and filtered views (before /:id to avoid conflict)
router.get('/stats', getDataProtectionStats);
router.get('/consent', getConsentRecords);
router.get('/data-access-requests', getDataAccessRequests);
router.get('/data-breaches', getDataBreaches);
router.get('/audits', getAuditRecords);

// CRUD routes
router.get('/', getAllDataProtectionRecords);
router.post('/', createDataProtectionRecord);
router.get('/:id', getDataProtectionRecordById);
router.put('/:id', updateDataProtectionRecord);
router.delete('/:id', deleteDataProtectionRecord);

export default router;
