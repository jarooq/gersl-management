import express from 'express';
import * as donationController from '../controllers/donation.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, donationController.getAllDonations);
router.get('/stats', protect, donationController.getDonationStats);
router.get('/:id', protect, donationController.getDonationById);
router.post('/', donationController.createDonation); // Public for online donations
router.put('/:id', protect, donationController.updateDonation);
// 'Manager' was a ghost role — replaced with the real fundraising approver set.
router.delete('/:id', protect, authorize('Admin', 'CEO', 'Fundraising Manager'), donationController.deleteDonation);

export default router;
