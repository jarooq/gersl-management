import express from 'express';
import {
  listOrders, getOrder, createOrder, updateOrder, cancelOrder,
  bulkCreateItems, listItems, getItem, updateItem,
  transitionStage, addStageUpdate, listStageUpdates, recordFollowUp,
  listMyItems, getSummary,
} from '../controllers/igp.controller.js';
import { generateInvoiceForIgpOrder, reconcileIgpOrder } from '../controllers/orderConversion.controller.js';
import { renderIgpItemPdf, renderIgpDonorBundle, emailIgpDonorReport } from '../controllers/programmeReportPdf.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';

const router = express.Router();
router.use(requireAuth);

const requireIgpView = requireRole(
  'Admin', 'CEO', 'Programme Manager', 'Director Programmes',
  'Programme Officer', 'Field Officer', 'MEAL Officer',
  'Finance Manager', 'Finance Officer'
);
const requireIgpWrite = requireRole(
  'Admin', 'CEO', 'Programme Manager', 'Director Programmes',
  'Programme Officer'
);
const requireIgpFieldUpdate = requireRole(
  'Admin', 'CEO', 'Programme Manager', 'Director Programmes',
  'Programme Officer', 'Field Officer', 'MEAL Officer'
);

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
