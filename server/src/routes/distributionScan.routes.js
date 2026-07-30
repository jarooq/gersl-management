import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { scan } from '../controllers/distributionScan.controller.js';

// Mounted at /api/distribution-scans
const router = express.Router();

router.use(protect);

// Field Officer included — they are the ones scanning at distribution sites.
const canScan = authorize(
  'Admin', 'CEO', 'Director Programmes', 'Programme Manager',
  'MEAL Officer', 'Project Officer', 'Field Officer'
);

router.post('/', canScan, scan);

export default router;
