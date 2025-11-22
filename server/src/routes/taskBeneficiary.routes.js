import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getTaskBeneficiaries,
  addBeneficiaryToTask,
  addBeneficiariesToTaskBulk,
  updateSelectionStatus,
  markAsReceived,
  markAttendance,
  removeBeneficiaryFromTask,
  getBeneficiaryTaskHistory
} from '../controllers/taskBeneficiary.controller.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Task-specific beneficiary routes
router.get('/tasks/:taskId/beneficiaries', getTaskBeneficiaries);
router.post('/tasks/:taskId/beneficiaries', addBeneficiaryToTask);
router.post('/tasks/:taskId/beneficiaries/bulk', addBeneficiariesToTaskBulk);

// Task beneficiary management routes
router.put('/task-beneficiaries/:id/status', updateSelectionStatus);
router.put('/task-beneficiaries/:id/receive', markAsReceived);
router.put('/task-beneficiaries/:id/attendance', markAttendance);
router.delete('/task-beneficiaries/:id', removeBeneficiaryFromTask);

// Beneficiary history route
router.get('/beneficiaries/:beneficiaryId/task-history', getBeneficiaryTaskHistory);

export default router;
