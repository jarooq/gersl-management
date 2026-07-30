import express from 'express';
import * as invoiceController from '../controllers/invoice.controller.js';
import { protect, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', invoiceController.getAllInvoices);
router.get('/stats', invoiceController.getInvoiceStats);
router.get('/forex-report', invoiceController.getForexReport);
router.get('/:id', invoiceController.getInvoiceById);
router.get('/:id/receipts', invoiceController.getInvoiceReceipts);

// Money-write endpoints — must be permission-gated. Without these any
// authenticated role (Guest, Field Officer, etc.) could create invoices,
// edit totals, and record receipts.
router.post('/', requirePermission(PERMISSIONS.FINANCE_CREATE), invoiceController.createInvoice);
router.put('/:id', requirePermission(PERMISSIONS.FINANCE_EDIT), invoiceController.updateInvoice);
router.post('/:id/payment', requirePermission(PERMISSIONS.FINANCE_EDIT), invoiceController.recordPayment);
router.delete('/:id', requirePermission(PERMISSIONS.FINANCE_DELETE), invoiceController.deleteInvoice);

export default router;
