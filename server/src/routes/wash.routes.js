import express from 'express';
import {
  listOrders, getOrder, createOrder, updateOrder, cancelOrder,
  bulkCreateItems, listItems, getItem, updateItem,
  transitionStage, addStageUpdate, listStageUpdates,
  listMyItems, getSummary,
} from '../controllers/wash.controller.js';
import { generateInvoiceForWashOrder, reconcileWashOrder } from '../controllers/orderConversion.controller.js';
import { renderWashItemPdf, renderWashDonorBundle, emailWashDonorReport } from '../controllers/programmeReportPdf.controller.js';
import { requireAuth, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';

const router = express.Router();
router.use(requireAuth);

// Permission-driven gates — admin can re-wire which roles hold each perm
// via Settings → Roles & Permissions. Field officers without
// WASH_STAGE_UPDATE can read but not transition stages.
const requireWashView        = requirePermission(PERMISSIONS.WASH_VIEW);
const requireWashWrite       = requirePermission(PERMISSIONS.WASH_ORDER_WRITE);
const requireWashFieldUpdate = requirePermission(PERMISSIONS.WASH_STAGE_UPDATE);

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
