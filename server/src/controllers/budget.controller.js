import { Op } from 'sequelize';
import { Budget, Project, User } from '../models/index.js';
import { asyncHandler, NotFoundError } from '../middleware/error.middleware.js';

export const getAllBudgets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, fiscalYear, status, projectId } = req.query;
  const offset = (page - 1) * limit;
  const where = {};

  if (fiscalYear) where.fiscalYear = fiscalYear;
  if (status) where.status = status;
  if (projectId) where.projectId = projectId;

  const { count, rows: budgets } = await Budget.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['fiscalYear', 'DESC'], ['budgetName', 'ASC']],
    include: [
      { model: Project, as: 'project', attributes: ['id', 'name', 'projectCode'] },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] },
      { model: User, as: 'approver', attributes: ['id', 'fullName'] }
    ]
  });

  res.json({
    success: true,
    data: {
      budgets,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    }
  });
});

export const getBudgetById = asyncHandler(async (req, res) => {
  const budget = await Budget.findByPk(req.params.id, {
    include: [
      { model: Project, as: 'project' },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] },
      { model: User, as: 'approver', attributes: ['id', 'fullName'] }
    ]
  });

  if (!budget) throw new NotFoundError('Budget not found');
  res.json({ success: true, data: { budget } });
});

export const createBudget = asyncHandler(async (req, res) => {
  const budgetData = req.body;
  budgetData.remainingAmount = parseFloat(budgetData.totalBudget) - parseFloat(budgetData.spentAmount || 0);
  if (req.user) budgetData.createdBy = req.user.id;

  const budget = await Budget.create(budgetData);
  res.status(201).json({ success: true, message: 'Budget created successfully', data: { budget } });
});

export const updateBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findByPk(req.params.id);
  if (!budget) throw new NotFoundError('Budget not found');

  const updateData = req.body;
  if (updateData.totalBudget !== undefined || updateData.spentAmount !== undefined) {
    const totalBudget = updateData.totalBudget !== undefined ? updateData.totalBudget : budget.totalBudget;
    const spentAmount = updateData.spentAmount !== undefined ? updateData.spentAmount : budget.spentAmount;
    updateData.remainingAmount = parseFloat(totalBudget) - parseFloat(spentAmount);
  }

  await budget.update(updateData);
  res.json({ success: true, message: 'Budget updated successfully', data: { budget } });
});

export const approveBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findByPk(req.params.id);
  if (!budget) throw new NotFoundError('Budget not found');

  await budget.update({
    status: 'Approved',
    approvedBy: req.user?.id,
    approvalDate: new Date()
  });

  res.json({ success: true, message: 'Budget approved successfully', data: { budget } });
});

export const deleteBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findByPk(req.params.id);
  if (!budget) throw new NotFoundError('Budget not found');

  await budget.destroy();
  res.json({ success: true, message: 'Budget deleted successfully' });
});
