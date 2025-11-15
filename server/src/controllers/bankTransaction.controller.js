import { Op } from 'sequelize';
import { BankTransaction, BankAccount, User } from '../models/index.js';
import { asyncHandler, NotFoundError } from '../middleware/error.middleware.js';

export const getAllBankTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, bankAccountId, transactionType, isReconciled } = req.query;
  const offset = (page - 1) * limit;
  const where = {};

  if (bankAccountId) where.bankAccountId = bankAccountId;
  if (transactionType) where.transactionType = transactionType;
  if (isReconciled !== undefined) where.isReconciled = isReconciled === 'true';

  const { count, rows: transactions } = await BankTransaction.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['transactionDate', 'DESC']],
    include: [
      { model: BankAccount, as: 'bankAccount', attributes: ['id', 'accountName', 'accountNumber'] },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ]
  });

  res.json({
    success: true,
    data: {
      transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    }
  });
});

export const getBankTransactionById = asyncHandler(async (req, res) => {
  const transaction = await BankTransaction.findByPk(req.params.id, {
    include: [
      { model: BankAccount, as: 'bankAccount' },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ]
  });

  if (!transaction) throw new NotFoundError('Transaction not found');
  res.json({ success: true, data: { transaction } });
});

export const createBankTransaction = asyncHandler(async (req, res) => {
  const txnData = req.body;
  if (req.user) txnData.createdBy = req.user.id;

  const transaction = await BankTransaction.create(txnData);

  // Update bank account balance
  const account = await BankAccount.findByPk(txnData.bankAccountId);
  if (account) {
    const balanceChange = txnData.transactionType === 'Deposit' || txnData.transactionType === 'Credit'
      ? parseFloat(txnData.amount)
      : -parseFloat(txnData.amount);
    
    await account.update({
      currentBalance: parseFloat(account.currentBalance) + balanceChange
    });
  }

  res.status(201).json({ success: true, message: 'Transaction created successfully', data: { transaction } });
});

export const reconcileTransaction = asyncHandler(async (req, res) => {
  const transaction = await BankTransaction.findByPk(req.params.id);
  if (!transaction) throw new NotFoundError('Transaction not found');

  await transaction.update({
    isReconciled: true,
    reconciledDate: new Date()
  });

  res.json({ success: true, message: 'Transaction reconciled successfully', data: { transaction } });
});

export const deleteBankTransaction = asyncHandler(async (req, res) => {
  const transaction = await BankTransaction.findByPk(req.params.id);
  if (!transaction) throw new NotFoundError('Transaction not found');

  // Reverse bank account balance
  const account = await BankAccount.findByPk(transaction.bankAccountId);
  if (account) {
    const balanceChange = transaction.transactionType === 'Deposit' || transaction.transactionType === 'Credit'
      ? -parseFloat(transaction.amount)
      : parseFloat(transaction.amount);
    
    await account.update({
      currentBalance: parseFloat(account.currentBalance) + balanceChange
    });
  }

  await transaction.destroy();
  res.json({ success: true, message: 'Transaction deleted successfully' });
});
