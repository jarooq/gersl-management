import express from 'express';
import * as invoiceController from '../controllers/invoice.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', invoiceController.getAllInvoices);
router.get('/stats', invoiceController.getInvoiceStats);
router.get('/forex-report', invoiceController.getForexReport);
router.get('/:id', invoiceController.getInvoiceById);
router.get('/:id/receipts', invoiceController.getInvoiceReceipts);
router.post('/', invoiceController.createInvoice);
router.put('/:id', invoiceController.updateInvoice);
router.post('/:id/payment', invoiceController.recordPayment);
router.delete('/:id', authorize('Admin', 'Manager'), invoiceController.deleteInvoice);

export default router;
