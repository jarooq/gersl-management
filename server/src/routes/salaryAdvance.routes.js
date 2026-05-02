import express from 'express';
import { requireAuth, authorize } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';
import { list, create, decide, cancel } from '../controllers/salaryAdvance.controller.js';

const router = express.Router();
router.use(requireAuth);

const requireApprover = authorize('Admin', 'CEO', 'HR Manager', 'Finance Manager');

router.get   ('/',                   list);
router.post  ('/',                   create);
router.patch ('/:id/:action(approve|reject)', validateId(), requireApprover, decide);
router.patch ('/:id/cancel',         validateId(), cancel);

export default router;
