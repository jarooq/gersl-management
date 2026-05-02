import express from 'express';
import {
  getAllBudgetCategories,
  getBudgetCategoryById,
  createBudgetCategory,
  updateBudgetCategory,
  deleteBudgetCategory
} from '../controllers/budgetCategory.controller.js';
import { requireAuth, authorize } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';

const router = express.Router();

router.use(requireAuth);
const requireFinance = authorize('Admin', 'CEO', 'Finance Manager');

router.get   ('/',         getAllBudgetCategories);
router.post  ('/',         requireFinance, createBudgetCategory);
router.get   ('/:id',      validateId(), getBudgetCategoryById);
router.put   ('/:id',      validateId(), requireFinance, updateBudgetCategory);
router.delete('/:id',      validateId(), requireFinance, deleteBudgetCategory);

export default router;
