import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';
import { listMine, listPending, createMine, cancelMine, decide } from '../controllers/meLeave.controller.js';

const router = express.Router();
router.use(requireAuth);

router.get   ('/',                              listMine);
router.post  ('/',                              createMine);
router.get   ('/pending',                       listPending);
router.patch ('/:id/cancel',                    validateId(), cancelMine);
router.patch ('/:id/:action(approve|reject)',   validateId(), decide);

export default router;
