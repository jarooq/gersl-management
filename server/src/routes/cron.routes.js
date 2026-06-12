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
import { timingSafeEqual } from 'crypto';
import { sendDeadlineReminders } from '../utils/programmeDeadlineReminders.js';
import { fetchSampathRates } from '../services/exchangeRate.service.js';

const router = express.Router();

// Constant-time comparison so attackers can't probe the secret one byte at a
// time by measuring response latency. Buffer lengths must match for
// timingSafeEqual; we pad/short-circuit when they don't.
const constantEq = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

const requireCronSecret = (req, res, next) => {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return res.status(503).json({ success: false, message: 'CRON_SECRET not configured' });
  }
  const got = String(req.headers['x-cron-secret'] || req.query.secret || '');
  if (!constantEq(got, expected)) {
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

// Daily Sampath Bank exchange-rate snapshot (for Vercel Cron / serverless mode).
router.post('/exchange-rates', requireCronSecret, async (req, res) => {
  try {
    const result = await fetchSampathRates();
    res.status(result.ok ? 200 : 502).json({ success: result.ok, data: result });
  } catch (e) {
    console.error('[cron] exchange-rate snapshot failed:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
