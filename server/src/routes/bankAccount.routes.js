import express from 'express';
import * as bankAccountController from '../controllers/bankAccount.controller.js';
import { protect, authorize, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/', bankAccountController.getAllBankAccounts);
router.get('/:id/balance', bankAccountController.getBankAccountBalance);
router.get('/:id', bankAccountController.getBankAccountById);
router.post('/', requirePermission(PERMISSIONS.FINANCE_CREATE), bankAccountController.createBankAccount);
router.put('/:id', requirePermission(PERMISSIONS.FINANCE_EDIT), bankAccountController.updateBankAccount);
router.delete('/:id', authorize('Admin'), bankAccountController.deleteBankAccount);

export default router;
