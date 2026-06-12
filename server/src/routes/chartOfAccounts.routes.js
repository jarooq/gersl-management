import express from 'express';
import * as coaController from '../controllers/chartOfAccounts.controller.js';
import { protect, authorize, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/', coaController.getAllAccounts);
router.get('/:id', coaController.getAccountById);
router.post('/', requirePermission(PERMISSIONS.FINANCE_CREATE), coaController.createAccount);
router.put('/:id', requirePermission(PERMISSIONS.FINANCE_EDIT), coaController.updateAccount);
router.delete('/:id', authorize('Admin'), coaController.deleteAccount);

export default router;
