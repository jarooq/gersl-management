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
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';

const router = express.Router();

router.use(requireAuth);

// View open to most finance roles; Manager-only for write/lifecycle.
const requireCashView = requireRole(
  'Admin', 'CEO', 'Finance Manager', 'Finance Officer', 'Accountant', 'Procurement Manager'
);
const requireCashManager = requireRole('Admin', 'CEO', 'Finance Manager');

// Cash Accounts (Locker / CashBook / PettyCash)
router.get   ('/accounts/summary', requireCashView, getCashSummary);
router.get   ('/accounts',         requireCashView, listCashAccounts);
router.post  ('/accounts',         requireCashManager, createCashAccount);
router.get   ('/accounts/:id',     validateId(), requireCashView, getCashAccount);
router.put   ('/accounts/:id',     validateId(), requireCashManager, updateCashAccount);
router.patch ('/accounts/:id/deactivate', validateId(), requireCashManager, deactivateCashAccount);
router.patch ('/accounts/:id/reactivate', validateId(), requireCashManager, reactivateCashAccount);

export default router;
