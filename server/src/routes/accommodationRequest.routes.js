import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';
import { list, stats, create, decide } from '../controllers/accommodationRequest.controller.js';

const router = express.Router();
router.use(protect);

router.get   ('/stats',                                       stats);
router.get   ('/',                                            list);
router.post  ('/',                                            create);
router.patch ('/:id/:action(approve|reject|book|complete|cancel)', validateId(), decide);

export default router;
