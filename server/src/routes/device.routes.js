import express from 'express';
import {
  registerDevice,
  unregisterDevice,
  listMyDevices
} from '../controllers/device.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';

const router = express.Router();
router.use(protect);

router.post  ('/',     registerDevice);
router.get   ('/me',   listMyDevices);
router.delete('/:id',  validateId(), unregisterDevice);

export default router;
