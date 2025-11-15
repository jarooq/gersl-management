import express from 'express';
import * as bankAccountController from '../controllers/bankAccount.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/', bankAccountController.getAllBankAccounts);
router.get('/:id', bankAccountController.getBankAccountById);
router.get('/:id/balance', bankAccountController.getBankAccountBalance);
router.post('/', authorize('Admin', 'Manager'), bankAccountController.createBankAccount);
router.put('/:id', authorize('Admin', 'Manager'), bankAccountController.updateBankAccount);
router.delete('/:id', authorize('Admin'), bankAccountController.deleteBankAccount);

export default router;
