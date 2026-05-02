import express from 'express';
import {
  getAllBackgroundChecks,
  getBackgroundCheckById,
  createBackgroundCheck,
  updateBackgroundCheck,
  deleteBackgroundCheck,
  getExpiringChecks,
  getBackgroundCheckStats
} from '../controllers/background-check.controller.js';
import { requireAuth, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(requireAuth);
const requireHR = authorize('Admin', 'CEO', 'HR Manager', 'HR Officer');

router.get   ('/stats',     getBackgroundCheckStats);
router.get   ('/expiring',  getExpiringChecks);
router.get   ('/',          getAllBackgroundChecks);
router.post  ('/',          requireHR, createBackgroundCheck);
router.get   ('/:id',       getBackgroundCheckById);
router.put   ('/:id',       requireHR, updateBackgroundCheck);
router.delete('/:id',       authorize('Admin', 'HR Manager'), deleteBackgroundCheck);

export default router;
