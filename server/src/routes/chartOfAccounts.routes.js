import express from 'express';
import * as coaController from '../controllers/chartOfAccounts.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/', coaController.getAllAccounts);
router.get('/:id', coaController.getAccountById);
router.post('/', authorize('Admin', 'Manager'), coaController.createAccount);
router.put('/:id', authorize('Admin', 'Manager'), coaController.updateAccount);
router.delete('/:id', authorize('Admin'), coaController.deleteAccount);

export default router;
