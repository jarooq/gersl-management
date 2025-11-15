import express from 'express';
import * as socialController from '../controllers/socialMedia.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/', socialController.getAllSocialMediaPosts);
router.get('/stats', socialController.getSocialMediaStats);
router.get('/:id', socialController.getSocialMediaPostById);
router.post('/', socialController.createSocialMediaPost);
router.put('/:id', socialController.updateSocialMediaPost);
router.put('/:id/publish', socialController.publishPost);
router.post('/:id/engagement', socialController.recordEngagement);
router.delete('/:id', authorize('Admin', 'Manager'), socialController.deleteSocialMediaPost);

export default router;
