import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  getAllApprovals,
  getApprovalById,
  createApproval,
  approveApproval,
  rejectApproval,
  getApprovalStats,
  getPendingApprovalsForUser
} from '../controllers/approval.controller.js';

const router = express.Router();

// Get approval stats (must be before /:id route)
router.get('/stats/overview', verifyToken, getApprovalStats);

// Get pending approvals for current user
router.get('/pending', verifyToken, getPendingApprovalsForUser);

// Get all approvals with filtering
router.get('/', verifyToken, getAllApprovals);

// Get single approval by ID
router.get('/:id', verifyToken, getApprovalById);

// Create new approval
router.post('/', verifyToken, createApproval);

// Approve an item
router.post('/:id/approve', verifyToken, approveApproval);

// Reject an item
router.post('/:id/reject', verifyToken, rejectApproval);

export default router;
