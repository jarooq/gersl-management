import express from 'express';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import { listAuditLogs, getEntityHistory } from '../controllers/auditLog.controller.js';

const router = express.Router();

// Audit logs are sensitive — only Admin / CEO / BOD / Internal Audit roles.
const requireAuditAccess = requireRole('Admin', 'CEO', 'BOD');

router.use(protect, requireAuditAccess);

router.get('/', listAuditLogs);
router.get('/:entityType/:entityId', getEntityHistory);

export default router;
