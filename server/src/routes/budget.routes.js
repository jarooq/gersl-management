import express from 'express';
import * as budgetController from '../controllers/budget.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/', budgetController.getAllBudgets);
router.get('/:id', budgetController.getBudgetById);
router.post('/', budgetController.createBudget);
router.put('/:id', budgetController.updateBudget);
router.put('/:id/approve', authorize('Admin', 'Manager'), budgetController.approveBudget);
router.delete('/:id', authorize('Admin'), budgetController.deleteBudget);

export default router;
