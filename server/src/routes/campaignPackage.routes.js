import express from 'express';
import {
  getAllPackages,
  getActivePackages,
  getPackage,
  createPackage,
  updatePackage,
  deletePackage,
  reorderPackages,
  togglePackageStatus
} from '../controllers/campaignPackage.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================
// IMPORTANT: Use regex to ensure campaignId is numeric so it doesn't conflict with other routes

// @route   GET /api/campaigns/:campaignId/packages/active
// @desc    Get all active packages for a campaign (public)
// @access  Public
router.get('/:campaignId(\\d+)/packages/active', getActivePackages);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// All routes below require authentication
router.use(requireAuth);

// @route   GET /api/campaigns/:campaignId/packages
// @desc    Get all packages for a campaign (including inactive)
// @access  Private
router.get('/:campaignId/packages', getAllPackages);

// @route   GET /api/campaigns/packages/:id
// @desc    Get single package
// @access  Private
router.get('/packages/:id', getPackage);

// @route   POST /api/campaigns/:campaignId/packages
// @desc    Create new package for a campaign
// @access  Private
router.post('/:campaignId/packages', createPackage);

// @route   PUT /api/campaigns/packages/:id
// @desc    Update package
// @access  Private
router.put('/packages/:id', updatePackage);

// @route   DELETE /api/campaigns/packages/:id
// @desc    Delete package
// @access  Private
router.delete('/packages/:id', deletePackage);

// @route   PUT /api/campaigns/:campaignId/packages/reorder
// @desc    Reorder packages for a campaign
// @access  Private
router.put('/:campaignId/packages/reorder', reorderPackages);

// @route   PATCH /api/campaigns/packages/:id/toggle
// @desc    Toggle package active status
// @access  Private
router.patch('/packages/:id/toggle', togglePackageStatus);

export default router;
