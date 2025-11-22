import express from 'express';
import {
  getAllBudgetCategories,
  getBudgetCategoryById,
  createBudgetCategory,
  updateBudgetCategory,
  deleteBudgetCategory
} from '../controllers/budgetCategory.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// @route   GET /api/budget-categories
// @desc    Get all budget categories
// @access  Private
router.get('/', getAllBudgetCategories);

// @route   POST /api/budget-categories
// @desc    Create new budget category
// @access  Private
router.post('/', createBudgetCategory);

// @route   GET /api/budget-categories/:id
// @desc    Get budget category by ID
// @access  Private
router.get('/:id', validateId(), getBudgetCategoryById);

// @route   PUT /api/budget-categories/:id
// @desc    Update budget category
// @access  Private
router.put('/:id', validateId(), updateBudgetCategory);

// @route   DELETE /api/budget-categories/:id
// @desc    Delete budget category
// @access  Private
router.delete('/:id', validateId(), deleteBudgetCategory);

export default router;
