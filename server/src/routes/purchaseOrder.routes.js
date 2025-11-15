import express from 'express';
import * as poController from '../controllers/purchaseOrder.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/', poController.getAllPurchaseOrders);
router.get('/stats', poController.getPurchaseOrderStats);
router.get('/:id', poController.getPurchaseOrderById);
router.post('/', poController.createPurchaseOrder);
router.put('/:id', poController.updatePurchaseOrder);
router.put('/:id/approve', authorize('Admin', 'Manager'), poController.approvePurchaseOrder);
router.delete('/:id', authorize('Admin'), poController.deletePurchaseOrder);

export default router;
