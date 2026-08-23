import express from 'express';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import {
  getStatus,
  listAlerts,
  getAlertSummary,
  snoozeAlert,
  resolveAlert,
  muteAlert,
  triggerRun,
  triggerBriefing,
  listRuns,
  getSettings,
  updateSettings
} from '../controllers/aiEmployee.controller.js';
import {
  createPlan,
  listPlans,
  getPlan,
  updatePlanItem,
  approvePlan,
  rejectPlan,
  getPlannerStatus
} from '../controllers/aiPlanner.controller.js';

const router = express.Router();

// Operating the assistant (run it, retune it) is an admin action; reading and
// actioning your own alerts is not.
const requireOperator = requireRole('Admin', 'CEO', 'BOD', 'Director Programmes');

// ── Status & alerts (any authenticated user) ────────────────────────────
router.get('/status', protect, getStatus);
router.get('/alerts/summary', protect, getAlertSummary);
router.get('/alerts', protect, listAlerts);

router.post('/alerts/:id/snooze', protect, snoozeAlert);
router.post('/alerts/:id/resolve', protect, resolveAlert);
router.post('/alerts/:id/mute', protect, muteAlert);

// Any user may send themselves a briefing ({ me: true }); everyone-at-once is
// gated inside the controller.
router.post('/briefing', protect, triggerBriefing);

// ── Planner (Phase 2) ───────────────────────────────────────────────────
// Anyone may read a plan; only approvers may edit, approve or reject one.
// Generating costs an API call, so it is limited to approvers too.
const requireApprover = requireRole(
  'Admin', 'CEO', 'BOD', 'Director Programmes', 'Programme Manager'
);

router.get('/planner/status', protect, getPlannerStatus);
router.get('/plans', protect, listPlans);
router.get('/plans/:id', protect, getPlan);

router.post('/plans', protect, requireApprover, createPlan);
router.patch('/plans/:id/items/:itemId', protect, requireApprover, updatePlanItem);
router.post('/plans/:id/approve', protect, requireApprover, approvePlan);
router.post('/plans/:id/reject', protect, requireApprover, rejectPlan);

// ── Operations (admin) ──────────────────────────────────────────────────
router.post('/run', protect, requireOperator, triggerRun);
router.get('/runs', protect, requireOperator, listRuns);
router.get('/settings', protect, requireOperator, getSettings);
router.put('/settings', protect, requireOperator, updateSettings);

export default router;
