import express from 'express';
import * as campaignController from '../controllers/campaign.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { getActivePackages } from '../controllers/campaignPackage.controller.js';

const router = express.Router();

// Public routes (read-only) - NO AUTHENTICATION REQUIRED
// These routes MUST be defined before router.use(protect)
router.get('/', campaignController.getAllCampaigns);
router.get('/stats', campaignController.getCampaignStats);
// Public route for active campaign packages (must come before /:id route to avoid conflicts)
router.get('/:campaignId(\\d+)/packages/active', getActivePackages);
// Note: /:id route uses regex to only match numeric IDs
router.get('/:id(\\d+)', campaignController.getCampaignById);

// Protected routes (require authentication)
// All routes defined after this middleware require authentication
router.use(protect);

// Campaign writes are restricted to fundraising/admin roles. Any authenticated
// user could previously update or delete any campaign — there's no ownership
// concept on the model, so role-based gating is the only practical control.
const requireCampaignManager = authorize('Admin', 'CEO', 'Fundraising Manager', 'Manager');

router.post('/', requireCampaignManager, campaignController.createCampaign);
router.put('/:id', requireCampaignManager, campaignController.updateCampaign);
router.delete('/:id', requireCampaignManager, campaignController.deleteCampaign);

// Approval is reserved for senior approvers.
router.put('/:id/approve', authorize('Admin', 'CEO', 'Manager'), campaignController.approveCampaign);

export default router;
