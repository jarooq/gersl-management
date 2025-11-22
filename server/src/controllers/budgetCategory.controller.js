import { BudgetCategory } from '../models/index.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/error.middleware.js';
import { Op } from 'sequelize';

// @desc    Get all budget categories
// @route   GET /api/budget-categories
// @access  Private
export const getAllBudgetCategories = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (search) {
    where[Op.or] = [
      { category_name: { [Op.iLike]: `%${search}%` } },
      { category_code: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const { rows: categories, count: total } = await BudgetCategory.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [['category_code', 'ASC']]
  });

  res.json({
    success: true,
    data: {
      categories,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get budget category by ID
// @route   GET /api/budget-categories/:id
// @access  Private
export const getBudgetCategoryById = asyncHandler(async (req, res) => {
  const category = await BudgetCategory.findByPk(req.params.id);

  if (!category) {
    throw new NotFoundError('Budget category not found');
  }

  res.json({
    success: true,
    data: { category }
  });
});

// @desc    Create new budget category
// @route   POST /api/budget-categories
// @access  Private (Finance)
export const createBudgetCategory = asyncHandler(async (req, res) => {
  const { category_code, category_name, parent_category_id, description } = req.body;

  if (!category_code || !category_name) {
    throw new ValidationError('Category code and name are required');
  }

  const category = await BudgetCategory.create({
    category_code,
    category_name,
    parent_category_id,
    description,
    created_by: req.user.id
  });

  res.status(201).json({
    success: true,
    data: { category }
  });
});

// @desc    Update budget category
// @route   PUT /api/budget-categories/:id
// @access  Private (Finance)
export const updateBudgetCategory = asyncHandler(async (req, res) => {
  const category = await BudgetCategory.findByPk(req.params.id);

  if (!category) {
    throw new NotFoundError('Budget category not found');
  }

  const { category_code, category_name, parent_category_id, description } = req.body;

  await category.update({
    category_code,
    category_name,
    parent_category_id,
    description
  });

  res.json({
    success: true,
    data: { category }
  });
});

// @desc    Delete budget category
// @route   DELETE /api/budget-categories/:id
// @access  Private (Finance)
export const deleteBudgetCategory = asyncHandler(async (req, res) => {
  const category = await BudgetCategory.findByPk(req.params.id);

  if (!category) {
    throw new NotFoundError('Budget category not found');
  }

  await category.destroy();

  res.json({
    success: true,
    message: 'Budget category deleted successfully'
  });
});
