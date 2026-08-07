import express from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, authorize } from '../middleware/auth.middleware.js';
import { ingestBatch, listForUser, liveSnapshot } from '../controllers/locationPoint.controller.js';

const router = express.Router();
router.use(requireAuth);

// Mobile pushes a batch every ~minute per active tracker — keep generous.
// Per-user limit (key = user id) so one chatty client can't starve others.
const ingestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 batches/min/user = ample headroom over the 1-min default flush
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `loc-ingest:${req.user?.id ?? req.ip}`
});

// Admin polls /live every 10s. With 5 admins on the dashboard that's 30 hits/min.
const liveLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `loc-live:${req.user?.id ?? req.ip}`
});

router.post('/batch', ingestLimiter, ingestBatch);
// 'HR Officer' was a ghost role (not defined in ROLE_PERMISSIONS) — dropped.
router.get ('/live',  liveLimiter, authorize('Admin', 'CEO', 'HR Manager', 'Programme Manager'), liveSnapshot);
router.get ('/',      listForUser);

export default router;
