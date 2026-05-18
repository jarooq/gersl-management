import express from 'express';
import * as ctrl from '../controllers/exchangeRate.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', ctrl.getRates);
router.get('/rate', ctrl.resolveRate);
router.get('/history', ctrl.getHistory);
router.post('/refresh', authorize('Admin', 'Manager'), ctrl.refreshRates);
router.post('/', authorize('Admin', 'Manager'), ctrl.upsertManualRate);

export default router;
