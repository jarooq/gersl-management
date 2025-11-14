import express from 'express';
import {
  getAllVisitLogs,
  getVisitLogsByOrphan,
  getVisitLogById,
  createVisitLog,
  updateVisitLog,
  deleteVisitLog,
  getVisitLogsByDateRange
} from '../controllers/visitLog.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// ============================================
// VISIT LOG ROUTES
// ============================================

// @route   GET /api/visit-logs
// @desc    Get all visit logs with optional filters
// @access  Private
router.get('/', verifyToken, getAllVisitLogs);

// @route   GET /api/visit-logs/range/:orphanId
// @desc    Get visit logs within a date range (for report generation)
// @access  Private
router.get('/range/:orphanId', verifyToken, getVisitLogsByDateRange);

// @route   GET /api/visit-logs/orphan/:orphanId
// @desc    Get all visit logs for a specific orphan
// @access  Private
router.get('/orphan/:orphanId', verifyToken, getVisitLogsByOrphan);

// @route   GET /api/visit-logs/:id
// @desc    Get single visit log by ID
// @access  Private
router.get('/:id', verifyToken, getVisitLogById);

// @route   POST /api/visit-logs
// @desc    Create new visit log
// @access  Private
router.post('/', verifyToken, createVisitLog);

// @route   PUT /api/visit-logs/:id
// @desc    Update visit log
// @access  Private
router.put('/:id', verifyToken, updateVisitLog);

// @route   DELETE /api/visit-logs/:id
// @desc    Delete visit log
// @access  Private
router.delete('/:id', verifyToken, deleteVisitLog);

export default router;
