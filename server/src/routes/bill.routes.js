import express from 'express';
import * as billController from '../controllers/bill.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/', billController.getAllBills);
router.get('/stats', billController.getBillStats);
router.get('/:id', billController.getBillById);
router.post('/', billController.createBill);
router.put('/:id', billController.updateBill);
router.delete('/:id', authorize('Admin', 'Manager'), billController.deleteBill);

export default router;
