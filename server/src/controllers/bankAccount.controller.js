import { Op } from 'sequelize';
import { BankAccount, BankTransaction } from '../models/index.js';
import { asyncHandler, NotFoundError } from '../middleware/error.middleware.js';

export const getAllBankAccounts = asyncHandler(async (req, res) => {
  const { search, isActive } = req.query;
  const where = {};

  if (search) {
    where[Op.or] = [
      { accountName: { [Op.iLike]: `%${search}%` } },
      { bankName: { [Op.iLike]: `%${search}%` } },
      { accountNumber: { [Op.iLike]: `%${search}%` } }
    ];
  }
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const accounts = await BankAccount.findAll({
    where,
    order: [['accountName', 'ASC']]
  });

  res.json({ success: true, data: { accounts } });
});

export const getBankAccountById = asyncHandler(async (req, res) => {
  const account = await BankAccount.findByPk(req.params.id, {
    include: [{ model: BankTransaction, as: 'transactions', limit: 10, order: [['transactionDate', 'DESC']] }]
  });

  if (!account) throw new NotFoundError('Bank account not found');
  res.json({ success: true, data: { account } });
});

export const createBankAccount = asyncHandler(async (req, res) => {
  const accountData = req.body;
  accountData.currentBalance = accountData.openingBalance || 0;

  const account = await BankAccount.create(accountData);
  res.status(201).json({ success: true, message: 'Bank account created successfully', data: { account } });
});

export const updateBankAccount = asyncHandler(async (req, res) => {
  const account = await BankAccount.findByPk(req.params.id);
  if (!account) throw new NotFoundError('Bank account not found');

  await account.update(req.body);
  res.json({ success: true, message: 'Bank account updated successfully', data: { account } });
});

export const deleteBankAccount = asyncHandler(async (req, res) => {
  const account = await BankAccount.findByPk(req.params.id);
  if (!account) throw new NotFoundError('Bank account not found');

  await account.destroy();
  res.json({ success: true, message: 'Bank account deleted successfully' });
});

export const getBankAccountBalance = asyncHandler(async (req, res) => {
  const account = await BankAccount.findByPk(req.params.id);
  if (!account) throw new NotFoundError('Bank account not found');

  res.json({ 
    success: true, 
    data: { 
      accountId: account.id,
      accountName: account.accountName,
      currentBalance: parseFloat(account.currentBalance),
      currency: account.currency
    } 
  });
});
