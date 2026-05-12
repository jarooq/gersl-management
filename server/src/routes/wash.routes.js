import express from 'express';
import {
  listOrders, getOrder, createOrder, updateOrder, cancelOrder,
  bulkCreateItems, listItems, getItem, updateItem,
  transitionStage, addStageUpdate, listStageUpdates,
  listMyItems, getSummary,
} from '../controllers/wash.controller.js';
import { generateInvoiceForWashOrder, reconcileWashOrder } from '../controllers/orderConversion.controller.js';
import { renderWashItemPdf, renderWashDonorBundle, emailWashDonorReport } from '../controllers/programmeReportPdf.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';

const router = express.Router();
router.use(requireAuth);

// Programme management = WASH module write roles. Field officers can still
// read, but order creation and contractor assignment are gated.
const requireWashView = requireRole(
  'Admin', 'CEO', 'Programme Manager', 'Director Programmes',
  'Programme Officer', 'Field Officer', 'MEAL Officer',
  'Finance Manager', 'Finance Officer'
);
const requireWashWrite = requireRole(
  'Admin', 'CEO', 'Programme Manager', 'Director Programmes',
  'Programme Officer'
);
const requireWashFieldUpdate = requireRole(
  'Admin', 'CEO', 'Programme Manager', 'Director Programmes',
  'Programme Officer', 'Field Officer', 'MEAL Officer'
);

// Org-wide summary tile for dashboards.
router.get('/summary',           requireWashView,  getSummary);

// "What's assigned to me" — mobile + web for field officers.
router.get('/items/mine',        requireWashView,  listMyItems);

// Orders
router.get   ('/orders',         requireWashView,  listOrders);
router.post  ('/orders',         requireWashWrite, createOrder);
router.get   ('/orders/:id',     validateId(), requireWashView,  getOrder);
router.patch ('/orders/:id',     validateId(), requireWashWrite, updateOrder);
router.delete('/orders/:id',     validateId(), requireWashWrite, cancelOrder);
router.post  ('/orders/:id/items',             validateId(), requireWashWrite, bulkCreateItems);
router.post  ('/orders/:id/generate-invoice',  validateId(), requireWashWrite, generateInvoiceForWashOrder);
router.patch ('/orders/:id/reconcile',         validateId(), requireWashWrite, reconcileWashOrder);

// Items
router.get   ('/items',          requireWashView,        listItems);
router.get   ('/items/:id',      validateId(), requireWashView,        getItem);
router.patch ('/items/:id',      validateId(), requireWashWrite,       updateItem);
router.patch ('/items/:id/stage', validateId(), requireWashFieldUpdate, transitionStage);

// Stage updates (append-only progress timeline)
router.get ('/items/:id/stage-updates', validateId(), requireWashView,        listStageUpdates);
router.post('/items/:id/stage-updates', validateId(), requireWashFieldUpdate, addStageUpdate);

// PDF reports (per-item + donor bundle). Opened in a new tab — token can be
// passed in ?token= for cookieless contexts (see auth.middleware.js whitelist).
router.get ('/items/:id/report',              validateId(), requireWashView,  renderWashItemPdf);
router.get ('/orders/:id/donor-report',       validateId(), requireWashView,  renderWashDonorBundle);
router.post('/orders/:id/email-donor-report', validateId(), requireWashWrite, emailWashDonorReport);

export default router;
