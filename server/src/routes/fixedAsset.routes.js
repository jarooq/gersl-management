import express from 'express';
import * as assetController from '../controllers/fixedAsset.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/', assetController.getAllFixedAssets);
router.get('/stats', assetController.getFixedAssetStats);
router.get('/:id', assetController.getFixedAssetById);
router.post('/', assetController.createFixedAsset);
router.put('/:id', assetController.updateFixedAsset);
router.put('/:id/dispose', assetController.disposeFixedAsset);
router.delete('/:id', authorize('Admin'), assetController.deleteFixedAsset);

export default router;
