import express from 'express';
import * as donationController from '../controllers/donation.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, donationController.getAllDonations);
router.get('/stats', protect, donationController.getDonationStats);
router.get('/:id', protect, donationController.getDonationById);
router.post('/', donationController.createDonation); // Public for online donations
router.put('/:id', protect, donationController.updateDonation);
router.delete('/:id', protect, authorize('Admin', 'Manager'), donationController.deleteDonation);

export default router;
