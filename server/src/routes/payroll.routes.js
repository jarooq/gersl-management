import express from 'express';
import * as payrollController from '../controllers/payroll.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/', payrollController.getAllPayroll);
router.get('/:id', payrollController.getPayrollById);
router.post('/', authorize('Admin', 'Manager'), payrollController.createPayroll);
router.put('/:id', authorize('Admin', 'Manager'), payrollController.updatePayroll);
router.put('/:id/process', authorize('Admin', 'Manager'), payrollController.processPayroll);
router.delete('/:id', authorize('Admin'), payrollController.deletePayroll);

export default router;
