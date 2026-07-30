import express from 'express';
import * as ctrl from '../controllers/exchangeRate.controller.js';
import { protect, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', ctrl.getRates);
router.get('/rate', ctrl.resolveRate);
router.get('/history', ctrl.getHistory);
// Gate refresh + manual rate entry on FINANCE_EDIT — there is no `Manager`
// role; the previous `authorize('Admin','Manager')` made these endpoints
// effectively Admin-only, blocking finance staff from entering rates manually
// when the Sampath API is unreachable (the documented fallback path).
router.post('/refresh', requirePermission(PERMISSIONS.FINANCE_EDIT), ctrl.refreshRates);
router.post('/', requirePermission(PERMISSIONS.FINANCE_EDIT), ctrl.upsertManualRate);

export default router;
