import { FinancialReport, JournalEntry, BankAccount, BankTransaction, ChartOfAccounts, Expense } from '../models/index.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/error.middleware.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

// @desc    Get all financial reports
// @route   GET /api/financial-reports
// @access  Private
export const getAllFinancialReports = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, report_type, status } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (report_type) where.report_type = report_type;
  if (status) where.status = status;

  const { rows: reports, count: total } = await FinancialReport.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [['report_date', 'DESC'], ['created_at', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      reports,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get financial report by ID
// @route   GET /api/financial-reports/:id
// @access  Private
export const getFinancialReportById = asyncHandler(async (req, res) => {
  const report = await FinancialReport.findByPk(req.params.id);

  if (!report) {
    throw new NotFoundError('Financial report not found');
  }

  res.json({
    success: true,
    data: { report }
  });
});

// @desc    Create new financial report
// @route   POST /api/financial-reports
// @access  Private
export const createFinancialReport = asyncHandler(async (req, res) => {
  const {
    report_name,
    report_type,
    report_date,
    period_start,
    period_end,
    report_data,
    notes
  } = req.body;

  if (!report_name || !report_type || !report_date) {
    throw new ValidationError('Report name, type, and date are required');
  }

  const report = await FinancialReport.create({
    report_name,
    report_type,
    report_date,
    period_start,
    period_end,
    report_data,
    notes,
    status: 'Draft',
    created_by: req.user.id
  });

  res.status(201).json({
    success: true,
    data: { report }
  });
});

// @desc    Update financial report
// @route   PUT /api/financial-reports/:id
// @access  Private
export const updateFinancialReport = asyncHandler(async (req, res) => {
  const report = await FinancialReport.findByPk(req.params.id);

  if (!report) {
    throw new NotFoundError('Financial report not found');
  }

  const {
    report_name,
    report_type,
    report_date,
    period_start,
    period_end,
    report_data,
    notes,
    status
  } = req.body;

  await report.update({
    report_name,
    report_type,
    report_date,
    period_start,
    period_end,
    report_data,
    notes,
    status
  });

  res.json({
    success: true,
    data: { report }
  });
});

// @desc    Delete financial report
// @route   DELETE /api/financial-reports/:id
// @access  Private
export const deleteFinancialReport = asyncHandler(async (req, res) => {
  const report = await FinancialReport.findByPk(req.params.id);

  if (!report) {
    throw new NotFoundError('Financial report not found');
  }

  await report.destroy();

  res.json({
    success: true,
    message: 'Financial report deleted successfully'
  });
});

// @desc    Publish financial report
// @route   PUT /api/financial-reports/:id/publish
// @access  Private
export const publishReport = asyncHandler(async (req, res) => {
  const report = await FinancialReport.findByPk(req.params.id);

  if (!report) {
    throw new NotFoundError('Financial report not found');
  }

  await report.update({
    status: 'Published',
    published_at: new Date(),
    published_by: req.user.id
  });

  res.json({
    success: true,
    data: { report }
  });
});

// @desc    Generate balance sheet
// @route   POST /api/financial-reports/generate/balance-sheet
// @access  Private
export const generateBalanceSheet = asyncHandler(async (req, res) => {
  const { as_of_date } = req.body;

  if (!as_of_date) {
    throw new ValidationError('As of date is required');
  }

  const asOfDate = new Date(as_of_date);

  // Get all bank accounts and their balances
  const bankAccounts = await BankAccount.findAll({
    where: {
      created_at: { [Op.lte]: asOfDate }
    }
  });

  let cashAndBankBalance = 0;
  for (const account of bankAccounts) {
    // Calculate balance from transactions up to the as_of_date
    const transactions = await BankTransaction.findAll({
      where: {
        account_id: account.id,
        transaction_date: { [Op.lte]: asOfDate }
      }
    });

    const balance = transactions.reduce((sum, txn) => {
      return txn.transaction_type === 'credit' || txn.transaction_type === 'deposit'
        ? sum + parseFloat(txn.amount || 0)
        : sum - parseFloat(txn.amount || 0);
    }, parseFloat(account.opening_balance || 0));

    cashAndBankBalance += balance;
  }

  // Get accounts receivable (grants receivable, pledges)
  const accountsReceivable = await sequelize.query(`
    SELECT COALESCE(SUM(CAST(remaining_amount AS DECIMAL)), 0) as total
    FROM grant_receivables
    WHERE created_at <= :asOfDate
    AND status != 'Received'
  `, {
    replacements: { asOfDate },
    type: sequelize.QueryTypes.SELECT
  });

  // Get fixed assets
  const fixedAssets = await sequelize.query(`
    SELECT COALESCE(SUM(CAST(current_value AS DECIMAL)), 0) as total
    FROM fixed_assets
    WHERE acquisition_date <= :asOfDate
    AND status = 'Active'
  `, {
    replacements: { asOfDate },
    type: sequelize.QueryTypes.SELECT
  });

  // Get accounts payable
  const accountsPayable = await sequelize.query(`
    SELECT COALESCE(SUM(CAST(amount_due AS DECIMAL)), 0) as total
    FROM payables
    WHERE created_at <= :asOfDate
    AND status != 'Paid'
  `, {
    replacements: { asOfDate },
    type: sequelize.QueryTypes.SELECT
  });

  // Calculate totals
  const currentAssets = {
    cash_and_bank: cashAndBankBalance,
    accounts_receivable: parseFloat(accountsReceivable[0]?.total || 0),
    total: cashAndBankBalance + parseFloat(accountsReceivable[0]?.total || 0)
  };

  const fixedAssetsTotal = parseFloat(fixedAssets[0]?.total || 0);
  const totalAssets = currentAssets.total + fixedAssetsTotal;

  const currentLiabilities = {
    accounts_payable: parseFloat(accountsPayable[0]?.total || 0),
    total: parseFloat(accountsPayable[0]?.total || 0)
  };

  const totalLiabilities = currentLiabilities.total;
  const totalEquity = totalAssets - totalLiabilities;

  const balanceSheetData = {
    as_of_date: as_of_date,
    assets: {
      current_assets: currentAssets,
      fixed_assets: {
        property_and_equipment: fixedAssetsTotal,
        total: fixedAssetsTotal
      },
      total_assets: totalAssets
    },
    liabilities: {
      current_liabilities: currentLiabilities,
      long_term_liabilities: {
        total: 0
      },
      total_liabilities: totalLiabilities
    },
    equity: {
      retained_earnings: totalEquity,
      total_equity: totalEquity
    }
  };

  const report = await FinancialReport.create({
    report_name: `Balance Sheet - ${as_of_date}`,
    report_type: 'Balance Sheet',
    report_date: asOfDate,
    period_start: asOfDate,
    period_end: asOfDate,
    report_data: balanceSheetData,
    status: 'Generated',
    created_by: req.user.id
  });

  res.status(201).json({
    success: true,
    data: { report }
  });
});

// @desc    Generate income statement
// @route   POST /api/financial-reports/generate/income-statement
// @access  Private
export const generateIncomeStatement = asyncHandler(async (req, res) => {
  const { period_start, period_end } = req.body;

  if (!period_start || !period_end) {
    throw new ValidationError('Period start and end dates are required');
  }

  const startDate = new Date(period_start);
  const endDate = new Date(period_end);

  // Get grant revenues (received grants)
  const grantRevenue = await sequelize.query(`
    SELECT COALESCE(SUM(CAST(amount_received AS DECIMAL)), 0) as total
    FROM grant_receipts
    WHERE receipt_date BETWEEN :startDate AND :endDate
  `, {
    replacements: { startDate, endDate },
    type: sequelize.QueryTypes.SELECT
  });

  // Get donation revenue
  const donationRevenue = await sequelize.query(`
    SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total
    FROM donations
    WHERE donation_date BETWEEN :startDate AND :endDate
    AND status = 'Completed'
  `, {
    replacements: { startDate, endDate },
    type: sequelize.QueryTypes.SELECT
  });

  // Get expenses by category
  const expenses = await sequelize.query(`
    SELECT
      budget_category_id,
      COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total
    FROM expenses
    WHERE expense_date BETWEEN :startDate AND :endDate
    AND status = 'Approved'
    GROUP BY budget_category_id
  `, {
    replacements: { startDate, endDate },
    type: sequelize.QueryTypes.SELECT
  });

  // Get program expenses
  const programExpenses = await sequelize.query(`
    SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total
    FROM expenses
    WHERE expense_date BETWEEN :startDate AND :endDate
    AND status = 'Approved'
    AND category = 'Program'
  `, {
    replacements: { startDate, endDate },
    type: sequelize.QueryTypes.SELECT
  });

  // Get administrative expenses
  const adminExpenses = await sequelize.query(`
    SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total
    FROM expenses
    WHERE expense_date BETWEEN :startDate AND :endDate
    AND status = 'Approved'
    AND category = 'Administrative'
  `, {
    replacements: { startDate, endDate },
    type: sequelize.QueryTypes.SELECT
  });

  // Get fundraising expenses
  const fundraisingExpenses = await sequelize.query(`
    SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total
    FROM expenses
    WHERE expense_date BETWEEN :startDate AND :endDate
    AND status = 'Approved'
    AND category = 'Fundraising'
  `, {
    replacements: { startDate, endDate },
    type: sequelize.QueryTypes.SELECT
  });

  // Calculate totals
  const totalGrantRevenue = parseFloat(grantRevenue[0]?.total || 0);
  const totalDonationRevenue = parseFloat(donationRevenue[0]?.total || 0);
  const totalRevenue = totalGrantRevenue + totalDonationRevenue;

  const totalProgramExpenses = parseFloat(programExpenses[0]?.total || 0);
  const totalAdminExpenses = parseFloat(adminExpenses[0]?.total || 0);
  const totalFundraisingExpenses = parseFloat(fundraisingExpenses[0]?.total || 0);
  const totalExpenses = totalProgramExpenses + totalAdminExpenses + totalFundraisingExpenses;

  const netIncome = totalRevenue - totalExpenses;

  const incomeStatementData = {
    period: {
      start: period_start,
      end: period_end
    },
    revenue: {
      grants: totalGrantRevenue,
      donations: totalDonationRevenue,
      other_revenue: 0,
      total_revenue: totalRevenue
    },
    expenses: {
      program_expenses: totalProgramExpenses,
      administrative_expenses: totalAdminExpenses,
      fundraising_expenses: totalFundraisingExpenses,
      total_expenses: totalExpenses
    },
    net_income: netIncome,
    expense_ratio: {
      program_percentage: totalRevenue > 0 ? ((totalProgramExpenses / totalRevenue) * 100).toFixed(2) : 0,
      admin_percentage: totalRevenue > 0 ? ((totalAdminExpenses / totalRevenue) * 100).toFixed(2) : 0,
      fundraising_percentage: totalRevenue > 0 ? ((totalFundraisingExpenses / totalRevenue) * 100).toFixed(2) : 0
    }
  };

  const report = await FinancialReport.create({
    report_name: `Income Statement - ${period_start} to ${period_end}`,
    report_type: 'Income Statement',
    report_date: new Date(),
    period_start: startDate,
    period_end: endDate,
    report_data: incomeStatementData,
    status: 'Generated',
    created_by: req.user.id
  });

  res.status(201).json({
    success: true,
    data: { report }
  });
});

// @desc    Generate cash flow statement
// @route   POST /api/financial-reports/generate/cash-flow
// @access  Private
export const generateCashFlow = asyncHandler(async (req, res) => {
  const { period_start, period_end } = req.body;

  if (!period_start || !period_end) {
    throw new ValidationError('Period start and end dates are required');
  }

  const startDate = new Date(period_start);
  const endDate = new Date(period_end);

  // OPERATING ACTIVITIES

  // Cash receipts from grants and donations
  const grantReceipts = await sequelize.query(`
    SELECT COALESCE(SUM(CAST(amount_received AS DECIMAL)), 0) as total
    FROM grant_receipts
    WHERE receipt_date BETWEEN :startDate AND :endDate
  `, {
    replacements: { startDate, endDate },
    type: sequelize.QueryTypes.SELECT
  });

  const donationReceipts = await sequelize.query(`
    SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total
    FROM donations
    WHERE donation_date BETWEEN :startDate AND :endDate
    AND status = 'Completed'
  `, {
    replacements: { startDate, endDate },
    type: sequelize.QueryTypes.SELECT
  });

  // Cash payments for expenses
  const expensePayments = await sequelize.query(`
    SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total
    FROM payments
    WHERE payment_date BETWEEN :startDate AND :endDate
    AND payment_type = 'Expense'
  `, {
    replacements: { startDate, endDate },
    type: sequelize.QueryTypes.SELECT
  });

  // Cash payments for payroll
  const payrollPayments = await sequelize.query(`
    SELECT COALESCE(SUM(CAST(net_amount AS DECIMAL)), 0) as total
    FROM payroll_records
    WHERE payment_date BETWEEN :startDate AND :endDate
    AND status = 'Paid'
  `, {
    replacements: { startDate, endDate },
    type: sequelize.QueryTypes.SELECT
  });

  const totalGrantReceipts = parseFloat(grantReceipts[0]?.total || 0);
  const totalDonationReceipts = parseFloat(donationReceipts[0]?.total || 0);
  const totalExpensePayments = parseFloat(expensePayments[0]?.total || 0);
  const totalPayrollPayments = parseFloat(payrollPayments[0]?.total || 0);

  const cashFromOperations = totalGrantReceipts + totalDonationReceipts;
  const cashUsedInOperations = totalExpensePayments + totalPayrollPayments;
  const netOperatingCashFlow = cashFromOperations - cashUsedInOperations;

  // INVESTING ACTIVITIES

  // Cash used to purchase fixed assets
  const assetPurchases = await sequelize.query(`
    SELECT COALESCE(SUM(CAST(acquisition_cost AS DECIMAL)), 0) as total
    FROM fixed_assets
    WHERE acquisition_date BETWEEN :startDate AND :endDate
  `, {
    replacements: { startDate, endDate },
    type: sequelize.QueryTypes.SELECT
  });

  const totalAssetPurchases = parseFloat(assetPurchases[0]?.total || 0);
  const netInvestingCashFlow = -totalAssetPurchases;

  // FINANCING ACTIVITIES

  // For now, assuming no loans or financing activities
  const netFinancingCashFlow = 0;

  // CALCULATE NET CASH FLOW
  const netCashFlow = netOperatingCashFlow + netInvestingCashFlow + netFinancingCashFlow;

  // Get opening and closing cash balances
  const openingBalance = await sequelize.query(`
    SELECT COALESCE(SUM(CAST(opening_balance AS DECIMAL)), 0) as total
    FROM bank_accounts
    WHERE created_at < :startDate
  `, {
    replacements: { startDate },
    type: sequelize.QueryTypes.SELECT
  });

  const transactionsBeforeStart = await sequelize.query(`
    SELECT
      COALESCE(SUM(CASE
        WHEN transaction_type IN ('credit', 'deposit') THEN CAST(amount AS DECIMAL)
        ELSE -CAST(amount AS DECIMAL)
      END), 0) as total
    FROM bank_transactions
    WHERE transaction_date < :startDate
  `, {
    replacements: { startDate },
    type: sequelize.QueryTypes.SELECT
  });

  const cashAtBeginning = parseFloat(openingBalance[0]?.total || 0) + parseFloat(transactionsBeforeStart[0]?.total || 0);
  const cashAtEnd = cashAtBeginning + netCashFlow;

  const cashFlowData = {
    period: {
      start: period_start,
      end: period_end
    },
    operating_activities: {
      cash_from_grants: totalGrantReceipts,
      cash_from_donations: totalDonationReceipts,
      total_cash_inflows: cashFromOperations,
      expense_payments: -totalExpensePayments,
      payroll_payments: -totalPayrollPayments,
      total_cash_outflows: -cashUsedInOperations,
      net_cash_from_operations: netOperatingCashFlow
    },
    investing_activities: {
      asset_purchases: -totalAssetPurchases,
      net_cash_from_investing: netInvestingCashFlow
    },
    financing_activities: {
      loans_received: 0,
      loan_repayments: 0,
      net_cash_from_financing: netFinancingCashFlow
    },
    net_cash_flow: netCashFlow,
    cash_reconciliation: {
      cash_at_beginning: cashAtBeginning,
      net_change: netCashFlow,
      cash_at_end: cashAtEnd
    }
  };

  const report = await FinancialReport.create({
    report_name: `Cash Flow Statement - ${period_start} to ${period_end}`,
    report_type: 'Cash Flow',
    report_date: new Date(),
    period_start: startDate,
    period_end: endDate,
    report_data: cashFlowData,
    status: 'Generated',
    created_by: req.user.id
  });

  res.status(201).json({
    success: true,
    data: { report }
  });
});
