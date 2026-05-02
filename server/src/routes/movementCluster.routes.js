import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { runClusterer, listSegments } from '../controllers/movementCluster.controller.js';

const router = express.Router();
router.use(requireAuth);

// Mounted at /api/movement-segments
router.get ('/',         listSegments);
router.post('/cluster',  runClusterer);

export default router;
