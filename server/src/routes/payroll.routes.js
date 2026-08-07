import express from 'express';
import * as payrollController from '../controllers/payroll.controller.js';
import { renderPayslipPdf } from '../controllers/payrollPdf.controller.js';
import { protect, authorize, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/', payrollController.getAllPayroll);
router.get('/:id/pdf', renderPayslipPdf);
router.get('/:id', payrollController.getPayrollById);
router.post('/', requirePermission(PERMISSIONS.HR_CREATE), payrollController.createPayroll);
router.put('/:id', requirePermission(PERMISSIONS.HR_EDIT), payrollController.updatePayroll);
router.put('/:id/process', requirePermission(PERMISSIONS.HR_EDIT), payrollController.processPayroll);
router.delete('/:id', authorize('Admin'), payrollController.deletePayroll);

export default router;
