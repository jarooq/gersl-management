import express from 'express';
import {
  getAllFinancialReports,
  getFinancialReportById,
  createFinancialReport,
  updateFinancialReport,
  deleteFinancialReport,
  publishReport,
  generateBalanceSheet,
  generateIncomeStatement,
  generateCashFlow
} from '../controllers/financialReport.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// @route   POST /api/financial-reports/generate/balance-sheet
// @desc    Generate balance sheet
// @access  Private
router.post('/generate/balance-sheet', generateBalanceSheet);

// @route   POST /api/financial-reports/generate/income-statement
// @desc    Generate income statement
// @access  Private
router.post('/generate/income-statement', generateIncomeStatement);

// @route   POST /api/financial-reports/generate/cash-flow
// @desc    Generate cash flow statement
// @access  Private
router.post('/generate/cash-flow', generateCashFlow);

// @route   GET /api/financial-reports
// @desc    Get all financial reports
// @access  Private
router.get('/', getAllFinancialReports);

// @route   POST /api/financial-reports
// @desc    Create new financial report
// @access  Private
router.post('/', createFinancialReport);

// @route   GET /api/financial-reports/:id
// @desc    Get financial report by ID
// @access  Private
router.get('/:id', validateId(), getFinancialReportById);

// @route   PUT /api/financial-reports/:id
// @desc    Update financial report
// @access  Private
router.put('/:id', validateId(), updateFinancialReport);

// @route   PUT /api/financial-reports/:id/publish
// @desc    Publish financial report
// @access  Private
router.put('/:id/publish', validateId(), publishReport);

// @route   DELETE /api/financial-reports/:id
// @desc    Delete financial report
// @access  Private
router.delete('/:id', validateId(), deleteFinancialReport);

export default router;
