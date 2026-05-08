import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';
import {
  list, stats, getById, create, update, assign, returnAsset, remove,
} from '../controllers/asset.controller.js';

const router = express.Router();
router.use(protect);

router.get   ('/stats',           stats);
router.get   ('/',                list);
router.post  ('/',                create);
router.get   ('/:id',             validateId(), getById);
router.patch ('/:id',             validateId(), update);
router.patch ('/:id/assign',      validateId(), assign);
router.patch ('/:id/return',      validateId(), returnAsset);
router.delete('/:id',             validateId(), remove);

export default router;
