import express from 'express';
import {
  listOrders, getOrder, createOrder, updateOrder, cancelOrder,
  bulkCreateItems, listItems, getItem, updateItem,
  transitionStage, addStageUpdate, listStageUpdates, recordFollowUp,
  listMyItems, getSummary,
} from '../controllers/igp.controller.js';
import { generateInvoiceForIgpOrder, reconcileIgpOrder } from '../controllers/orderConversion.controller.js';
import { renderIgpItemPdf, renderIgpDonorBundle, emailIgpDonorReport } from '../controllers/programmeReportPdf.controller.js';
import { requireAuth, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';

const router = express.Router();
router.use(requireAuth);

// Permission-driven gates (audit-hardening 2026-05). Admin can re-wire
// which roles hold IGP_VIEW / IGP_ORDER_WRITE / IGP_STAGE_UPDATE via
// Settings → Roles & Permissions.
const requireIgpView        = requirePermission(PERMISSIONS.IGP_VIEW);
const requireIgpWrite       = requirePermission(PERMISSIONS.IGP_ORDER_WRITE);
const requireIgpFieldUpdate = requirePermission(PERMISSIONS.IGP_STAGE_UPDATE);

router.get('/summary',           requireIgpView,  getSummary);
router.get('/items/mine',        requireIgpView,  listMyItems);

router.get   ('/orders',         requireIgpView,  listOrders);
router.post  ('/orders',         requireIgpWrite, createOrder);
router.get   ('/orders/:id',     validateId(), requireIgpView,  getOrder);
router.patch ('/orders/:id',     validateId(), requireIgpWrite, updateOrder);
router.delete('/orders/:id',     validateId(), requireIgpWrite, cancelOrder);
router.post  ('/orders/:id/items',             validateId(), requireIgpWrite, bulkCreateItems);
router.post  ('/orders/:id/generate-invoice',  validateId(), requireIgpWrite, generateInvoiceForIgpOrder);
router.patch ('/orders/:id/reconcile',         validateId(), requireIgpWrite, reconcileIgpOrder);

router.get   ('/items',          requireIgpView,        listItems);
router.get   ('/items/:id',      validateId(), requireIgpView,        getItem);
router.patch ('/items/:id',      validateId(), requireIgpWrite,       updateItem);
router.patch ('/items/:id/stage', validateId(), requireIgpFieldUpdate, transitionStage);
router.post  ('/items/:id/follow-up', validateId(), requireIgpFieldUpdate, recordFollowUp);

router.get ('/items/:id/stage-updates', validateId(), requireIgpView,        listStageUpdates);
router.post('/items/:id/stage-updates', validateId(), requireIgpFieldUpdate, addStageUpdate);

router.get ('/items/:id/report',              validateId(), requireIgpView,  renderIgpItemPdf);
router.get ('/orders/:id/donor-report',       validateId(), requireIgpView,  renderIgpDonorBundle);
router.post('/orders/:id/email-donor-report', validateId(), requireIgpWrite, emailIgpDonorReport);

export default router;
