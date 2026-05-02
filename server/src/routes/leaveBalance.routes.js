import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { listForUser, upsertEntitlement } from '../controllers/leaveBalance.controller.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', listForUser);
router.put('/', upsertEntitlement);

export default router;
