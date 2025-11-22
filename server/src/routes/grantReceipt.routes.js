import express from 'express';
import {
  getAllGrantReceipts,
  getGrantReceiptById,
  createGrantReceipt,
  updateGrantReceipt,
  deleteGrantReceipt,
  getGrantReceiptsByGrant
} from '../controllers/grantReceipt.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// @route   GET /api/grant-receipts/grant/:grantId
// @desc    Get all receipts for a specific grant
// @access  Private
router.get('/grant/:grantId', getGrantReceiptsByGrant);

// @route   GET /api/grant-receipts
// @desc    Get all grant receipts with pagination and filters
// @access  Private
router.get('/', getAllGrantReceipts);

// @route   POST /api/grant-receipts
// @desc    Create new grant receipt
// @access  Private
router.post('/', createGrantReceipt);

// @route   GET /api/grant-receipts/:id
// @desc    Get grant receipt by ID
// @access  Private
router.get('/:id', getGrantReceiptById);

// @route   PUT /api/grant-receipts/:id
// @desc    Update grant receipt
// @access  Private
router.put('/:id', updateGrantReceipt);

// @route   DELETE /api/grant-receipts/:id
// @desc    Delete grant receipt
// @access  Private
router.delete('/:id', deleteGrantReceipt);

export default router;
