// =============================================================================
// Cron trigger routes — HTTP endpoints that scheduled jobs can hit. Designed
// for Vercel Cron (no in-process scheduler in serverless mode) but works with
// any external scheduler that can send an HTTP request with a shared secret.
//
// Auth: requires `x-cron-secret` header to match process.env.CRON_SECRET. If
// the env var isn't set, all endpoints respond 503 (don't accept unsigned
// triggers — safer than accidentally exposing them).
// =============================================================================

import express from 'express';
import { sendDeadlineReminders } from '../utils/programmeDeadlineReminders.js';

const router = express.Router();

const requireCronSecret = (req, res, next) => {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return res.status(503).json({ success: false, message: 'CRON_SECRET not configured' });
  }
  const got = req.headers['x-cron-secret'] || req.query.secret;
  if (got !== expected) {
    return res.status(401).json({ success: false, message: 'Invalid cron secret' });
  }
  next();
};

router.post('/programme-deadline-reminders', requireCronSecret, async (req, res) => {
  try {
    const summary = await sendDeadlineReminders();
    res.json({ success: true, data: summary });
  } catch (e) {
    console.error('[cron] deadline reminders failed:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
