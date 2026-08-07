import express from 'express';
import * as btController from '../controllers/bankTransaction.controller.js';
import { protect, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/', btController.getAllBankTransactions);
router.get('/:id', btController.getBankTransactionById);
router.post('/', btController.createBankTransaction);
router.put('/:id/reconcile', btController.reconcileTransaction);
router.delete('/:id', requirePermission(PERMISSIONS.FINANCE_DELETE), btController.deleteBankTransaction);

export default router;
