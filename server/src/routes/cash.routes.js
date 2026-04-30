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
import {
  listCounts,
  getCount,
  startCount,
  submitCount,
  approveCount,
  disputeCount,
  cancelCount
} from '../controllers/cashCount.controller.js';
import {
  listReplenishments,
  getReplenishment,
  requestReplenishment,
  approveReplenishment,
  rejectReplenishment,
  disburseReplenishment,
  cancelReplenishment
} from '../controllers/pettyCashReplenishment.controller.js';
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

// Cash count sessions
router.get   ('/counts',                          requireCashView, listCounts);
router.post  ('/counts',                          requireCashWrite, startCount);
router.get   ('/counts/:id',                      validateId(), requireCashView, getCount);
router.patch ('/counts/:id/submit',               validateId(), requireCashWrite, submitCount);
router.patch ('/counts/:id/approve',              validateId(), requireCashManager, approveCount);
router.patch ('/counts/:id/dispute',              validateId(), requireCashManager, disputeCount);
router.delete('/counts/:id',                      validateId(), requireCashWrite, cancelCount);

// Petty cash replenishments
router.get   ('/replenishments',                       requireCashView, listReplenishments);
router.post  ('/replenishments',                       requireCashWrite, requestReplenishment);
router.get   ('/replenishments/:id',                   validateId(), requireCashView, getReplenishment);
router.patch ('/replenishments/:id/approve',           validateId(), requireCashManager, approveReplenishment);
router.patch ('/replenishments/:id/reject',            validateId(), requireCashManager, rejectReplenishment);
router.post  ('/replenishments/:id/disburse',          validateId(), requireCashManager, disburseReplenishment);
router.patch ('/replenishments/:id/cancel',            validateId(), requireCashWrite, cancelReplenishment);

export default router;
