import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';
import { listMine, listPending, listAll, createMine, cancelMine, decide } from '../controllers/meExpense.controller.js';

const router = express.Router();
router.use(requireAuth);

// HR / Finance admin queue — every expense across all users.
router.get   ('/admin',                         listAll);
router.get   ('/pending',                       listPending);
router.get   ('/',                              listMine);
router.post  ('/',                              createMine);
router.patch ('/:id/cancel',                    validateId(), cancelMine);
router.patch ('/:id/:action(approve|reject)',   validateId(), decide);

export default router;
