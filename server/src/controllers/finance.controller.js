import { Op } from 'sequelize';
import { Expense, Project, User } from '../models/index.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/error.middleware.js';
import { notifyDecision } from '../services/email.service.js';
import { recalcProjectSpent } from '../utils/budgetGuard.js';

// ============================================
// GET ALL EXPENSES
// ============================================
export const getAllExpenses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, category, status, projectId, startDate, endDate } = req.query;
  const offset = (page - 1) * limit;

  const where = {};

  if (search) {
    where[Op.or] = [
      { description: { [Op.iLike]: `%${search}%` } },
      { category: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (category) where.category = category;
  if (status) where.status = status;
  if (projectId) where.projectId = projectId;

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date[Op.gte] = startDate;
    if (endDate) where.date[Op.lte] = endDate;
  }

  const { count, rows: expenses } = await Expense.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['date', 'DESC']],
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'programmeArea']
      },
      {
        model: User,
        as: 'approver',
        attributes: ['id', 'fullName', 'username']
      }
    ]
  });

  res.json({
    success: true,
    data: {
      expenses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    }
  });
});

// ============================================
// GET SINGLE EXPENSE
// ============================================
export const getExpenseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const expense = await Expense.findByPk(id, {
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'programmeArea', 'budget']
      },
      {
        model: User,
        as: 'approver',
        attributes: ['id', 'fullName', 'username']
      }
    ]
  });

  if (!expense) {
    throw new NotFoundError('Expense not found');
  }

  res.json({
    success: true,
    data: { expense }
  });
});

// ============================================
// CREATE EXPENSE
// ============================================
export const createExpense = asyncHandler(async (req, res) => {
  // New expenses always start as Pending — a client-supplied status must not
  // let an expense skip the approval workflow.
  const expenseData = { ...req.body, status: 'Pending' };

  // Verify project exists if projectId is provided
  if (expenseData.projectId) {
    const project = await Project.findByPk(expenseData.projectId);
    if (!project) {
      throw new BadRequestError('Project not found');
    }
  }

  const expense = await Expense.create(expenseData);

  const createdExpense = await Expense.findByPk(expense.id, {
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'programmeArea']
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Expense created successfully',
    data: { expense: createdExpense }
  });
});

// ============================================
// UPDATE EXPENSE
// ============================================
export const updateExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const expense = await Expense.findByPk(id);

  if (!expense) {
    throw new NotFoundError('Expense not found');
  }

  // Don't allow editing if already approved or paid
  if (expense.status === 'Paid') {
    throw new BadRequestError('Cannot edit paid expenses');
  }

  await expense.update(updateData);

  const updatedExpense = await Expense.findByPk(id, {
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'programmeArea']
      }
    ]
  });

  res.json({
    success: true,
    message: 'Expense updated successfully',
    data: { expense: updatedExpense }
  });
});

// ============================================
// DELETE EXPENSE
// ============================================
export const deleteExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const expense = await Expense.findByPk(id);

  if (!expense) {
    throw new NotFoundError('Expense not found');
  }

  // Don't allow deleting if paid
  if (expense.status === 'Paid') {
    throw new BadRequestError('Cannot delete paid expenses');
  }

  const wasApproved = expense.status === 'Approved';
  const projectId = expense.projectId;
  await expense.destroy();

  // If the expense was Approved when deleted, project.spent had this amount
  // baked in — recompute to back it out.
  if (wasApproved && projectId) {
    await recalcProjectSpent(projectId);
  }

  res.json({
    success: true,
    message: 'Expense deleted successfully'
  });
});

// ============================================
// APPROVE EXPENSE
// ============================================
export const approveExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  const expense = await Expense.findByPk(id);

  if (!expense) {
    throw new NotFoundError('Expense not found');
  }

  if (!['Approved', 'Rejected'].includes(status)) {
    throw new BadRequestError('Invalid approval status');
  }

  const previousStatus = expense.status;
  expense.status = status;
  expense.approvedBy = req.user.id;
  expense.approvalDate = new Date();

  await expense.save();

  // Recompute project.spent from the source of truth on EITHER decision —
  // previously we only added on Approved, which meant a later Reject left
  // the previously-added amount stuck in project.spent forever.
  if (expense.projectId &&
      (status === 'Approved' || previousStatus === 'Approved')) {
    await recalcProjectSpent(expense.projectId);
  }

  const updatedExpense = await Expense.findByPk(id, {
    include: [
      {
        model: User,
        as: 'approver',
        attributes: ['id', 'fullName', 'username']
      }
    ]
  });

  // Notify the submitter of the decision (best-effort).
  if (expense.submittedBy) {
    const submitter = await User.findByPk(expense.submittedBy, { attributes: ['email'] });
    if (submitter?.email) {
      await notifyDecision({
        to: submitter.email,
        kind: 'expense',
        decision: status,
        reason: remarks || null,
      });
    }
  }

  res.json({
    success: true,
    message: `Expense ${status.toLowerCase()} successfully`,
    data: { expense: updatedExpense }
  });
});

// ============================================
// MARK EXPENSE AS PAID
// ============================================
export const markAsPaid = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentMethod } = req.body;

  const expense = await Expense.findByPk(id);

  if (!expense) {
    throw new NotFoundError('Expense not found');
  }

  if (expense.status !== 'Approved') {
    throw new BadRequestError('Only approved expenses can be marked as paid');
  }

  expense.status = 'Paid';
  if (paymentMethod) {
    expense.paymentMethod = paymentMethod;
  }

  await expense.save();

  res.json({
    success: true,
    message: 'Expense marked as paid',
    data: { expense }
  });
});

// ============================================
// GET EXPENSE STATISTICS
// ============================================
export const getExpenseStats = asyncHandler(async (req, res) => {
  const { projectId, category, startDate, endDate } = req.query;

  const where = {};
  if (projectId) where.projectId = projectId;
  if (category) where.category = category;

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date[Op.gte] = startDate;
    if (endDate) where.date[Op.lte] = endDate;
  }

  // Total expenses
  const totalExpenses = await Expense.sum('amount', { where });

  // Status breakdown
  const byStatus = await Expense.findAll({
    where,
    attributes: [
      'status',
      [Expense.sequelize.fn('COUNT', Expense.sequelize.col('id')), 'count'],
      [Expense.sequelize.fn('SUM', Expense.sequelize.col('amount')), 'total']
    ],
    group: ['status']
  });

  // Category breakdown
  const byCategory = await Expense.findAll({
    where,
    attributes: [
      'category',
      [Expense.sequelize.fn('COUNT', Expense.sequelize.col('id')), 'count'],
      [Expense.sequelize.fn('SUM', Expense.sequelize.col('amount')), 'total']
    ],
    group: ['category'],
    order: [[Expense.sequelize.fn('SUM', Expense.sequelize.col('amount')), 'DESC']]
  });

  // Monthly breakdown
  const byMonth = await Expense.findAll({
    where,
    attributes: [
      [Expense.sequelize.fn('DATE_TRUNC', 'month', Expense.sequelize.col('date')), 'month'],
      [Expense.sequelize.fn('SUM', Expense.sequelize.col('amount')), 'total']
    ],
    group: [Expense.sequelize.fn('DATE_TRUNC', 'month', Expense.sequelize.col('date'))],
    order: [[Expense.sequelize.fn('DATE_TRUNC', 'month', Expense.sequelize.col('date')), 'DESC']],
    limit: 12
  });

  res.json({
    success: true,
    data: {
      totalExpenses: parseFloat(totalExpenses || 0),
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: parseInt(s.get('count')),
        total: parseFloat(s.get('total'))
      })),
      byCategory: byCategory.map(c => ({
        category: c.category,
        count: parseInt(c.get('count')),
        total: parseFloat(c.get('total'))
      })),
      byMonth: byMonth.map(m => ({
        month: m.get('month'),
        total: parseFloat(m.get('total'))
      }))
    }
  });
});

// ============================================
// GET PENDING APPROVALS
// ============================================
export const getPendingApprovals = asyncHandler(async (req, res) => {
  const expenses = await Expense.findAll({
    where: { status: 'Pending' },
    order: [['date', 'DESC']],
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'programmeArea']
      }
    ]
  });

  res.json({
    success: true,
    data: { expenses }
  });
});
