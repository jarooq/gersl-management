import express from 'express';
import {
  listCashAccounts,
  getCashAccount,
  createCashAccount,
  updateCashAccount,
  deactivateCashAccount,
  reactivateCashAccount,
  getCashSummary
} from '../controllers/cashAccount.controller.js';
import {
  listTransactions,
  getTransaction,
  recordTransaction,
  transferBetweenAccounts,
  approveTransaction,
  rejectTransaction,
  reverseTransaction
} from '../controllers/cashTransaction.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';

const router = express.Router();

router.use(requireAuth);

// View open to most finance roles; Manager-only for write/lifecycle.
const requireCashView = requireRole(
  'Admin', 'CEO', 'Finance Manager', 'Finance Officer', 'Accountant', 'Procurement Manager'
);
const requireCashWrite = requireRole(
  'Admin', 'CEO', 'Finance Manager', 'Finance Officer', 'Accountant'
);
const requireCashApprover = requireRole('Admin', 'CEO', 'Finance Manager', 'Finance Officer');
const requireCashManager = requireRole('Admin', 'CEO', 'Finance Manager');

// Cash Accounts (Locker / CashBook / PettyCash)
router.get   ('/accounts/summary', requireCashView, getCashSummary);
router.get   ('/accounts',         requireCashView, listCashAccounts);
router.post  ('/accounts',         requireCashManager, createCashAccount);
router.get   ('/accounts/:id',     validateId(), requireCashView, getCashAccount);
router.put   ('/accounts/:id',     validateId(), requireCashManager, updateCashAccount);
router.patch ('/accounts/:id/deactivate', validateId(), requireCashManager, deactivateCashAccount);
router.patch ('/accounts/:id/reactivate', validateId(), requireCashManager, reactivateCashAccount);

// Cash transactions
router.get   ('/transactions',                    requireCashView, listTransactions);
router.post  ('/transactions',                    requireCashWrite, recordTransaction);
router.post  ('/transactions/transfer',           requireCashWrite, transferBetweenAccounts);
router.get   ('/transactions/:id',                validateId(), requireCashView, getTransaction);
router.patch ('/transactions/:id/approve',        validateId(), requireCashApprover, approveTransaction);
router.patch ('/transactions/:id/reject',         validateId(), requireCashApprover, rejectTransaction);
router.post  ('/transactions/:id/reverse',        validateId(), requireCashApprover, reverseTransaction);

export default router;
