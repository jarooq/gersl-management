import express from 'express';
import {
  getAllDonors,
  getDonorById,
  createDonor,
  updateDonor,
  deleteDonor,
  getDonorStats
} from '../controllers/donor.controller.js';
import { requireAuth, authorize } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';

const router = express.Router();

router.use(requireAuth);
// 'Fundraising Assistant' was a ghost role (not in ROLE_PERMISSIONS) — dropped.
const requireFundraising = authorize('Admin', 'CEO', 'Fundraising Manager');

router.get   ('/stats',    getDonorStats);
router.get   ('/',         getAllDonors);
router.post  ('/',         requireFundraising, createDonor);
router.get   ('/:id',      validateId(), getDonorById);
router.put   ('/:id',      validateId(), requireFundraising, updateDonor);
router.delete('/:id',      validateId(), authorize('Admin', 'CEO', 'Fundraising Manager'), deleteDonor);

export default router;
