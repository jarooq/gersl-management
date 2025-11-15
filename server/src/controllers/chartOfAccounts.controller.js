import { Op } from 'sequelize';
import { ChartOfAccounts } from '../models/index.js';
import { asyncHandler, NotFoundError } from '../middleware/error.middleware.js';

export const getAllAccounts = asyncHandler(async (req, res) => {
  const { search, accountType, category } = req.query;
  const where = {};

  if (search) {
    where[Op.or] = [
      { accountCode: { [Op.iLike]: `%${search}%` } },
      { accountName: { [Op.iLike]: `%${search}%` } }
    ];
  }
  if (accountType) where.accountType = accountType;
  if (category) where.category = category;

  const accounts = await ChartOfAccounts.findAll({
    where,
    order: [['accountCode', 'ASC']],
    include: [
      { model: ChartOfAccounts, as: 'parentAccount', attributes: ['id', 'accountCode', 'accountName'] },
      { model: ChartOfAccounts, as: 'subAccounts', attributes: ['id', 'accountCode', 'accountName'] }
    ]
  });

  res.json({ success: true, data: { accounts } });
});

export const getAccountById = asyncHandler(async (req, res) => {
  const account = await ChartOfAccounts.findByPk(req.params.id, {
    include: [
      { model: ChartOfAccounts, as: 'parentAccount' },
      { model: ChartOfAccounts, as: 'subAccounts' }
    ]
  });

  if (!account) throw new NotFoundError('Account not found');
  res.json({ success: true, data: { account } });
});

export const createAccount = asyncHandler(async (req, res) => {
  const account = await ChartOfAccounts.create(req.body);
  res.status(201).json({ success: true, message: 'Account created successfully', data: { account } });
});

export const updateAccount = asyncHandler(async (req, res) => {
  const account = await ChartOfAccounts.findByPk(req.params.id);
  if (!account) throw new NotFoundError('Account not found');

  await account.update(req.body);
  res.json({ success: true, message: 'Account updated successfully', data: { account } });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const account = await ChartOfAccounts.findByPk(req.params.id);
  if (!account) throw new NotFoundError('Account not found');

  // Check if account has subaccounts
  const subAccountsCount = await ChartOfAccounts.count({ where: { parentAccountId: req.params.id } });
  if (subAccountsCount > 0) {
    throw new ValidationError('Cannot delete account with subaccounts');
  }

  await account.destroy();
  res.json({ success: true, message: 'Account deleted successfully' });
});
