import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';
import { enroll, list, regenerateToken, withdraw } from '../controllers/projectBeneficiary.controller.js';

// Mounted at /api — covers both /api/projects/:projectId/beneficiaries and
// /api/project-beneficiaries/:id/* (mirrors the taskBeneficiary pattern).
const router = express.Router();

// NOTE: protect is applied per-route (not router.use) because this router is
// mounted at /api — a router-level middleware would force auth onto every
// other /api route mounted after it.

// Same editor role-set as the aggregate-distribution (MEAL) routes.
const canManageEnrolments = authorize(
  'Admin', 'CEO', 'Director Programmes', 'Programme Manager',
  'MEAL Officer', 'Project Officer', 'Field Officer'
);

router.post('/projects/:projectId/beneficiaries', protect, validateId('projectId'), canManageEnrolments, enroll);
router.get('/projects/:projectId/beneficiaries', protect, validateId('projectId'), list);

router.post('/project-beneficiaries/:id/regenerate-token', protect, validateId(), canManageEnrolments, regenerateToken);
router.patch('/project-beneficiaries/:id/withdraw', protect, validateId(), canManageEnrolments, withdraw);

export default router;
