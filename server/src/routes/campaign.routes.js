import express from 'express';
import * as campaignController from '../controllers/campaign.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes (read-only)
router.get('/', campaignController.getAllCampaigns);
router.get('/stats', campaignController.getCampaignStats);
router.get('/:id', campaignController.getCampaignById);

// Protected routes (require authentication)
router.use(protect);

router.post('/', campaignController.createCampaign);
router.put('/:id', campaignController.updateCampaign);
router.delete('/:id', campaignController.deleteCampaign);

// Admin only routes
router.put('/:id/approve', authorize('Admin', 'Manager'), campaignController.approveCampaign);

export default router;
