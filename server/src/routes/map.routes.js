import express from 'express';
import { getMapPins } from '../controllers/map.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(requireAuth);

// Single endpoint that returns all map pins for the requested layers.
// /api/map/pins?types=wash,igp,orphan,beneficiary&projectId=&donorId=&district=&stage=
router.get('/pins', getMapPins);

export default router;
