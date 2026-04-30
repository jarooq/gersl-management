import express from 'express';
import * as attendanceController from '../controllers/attendance.controller.js';
import {
  listCorrections,
  getCorrection,
  requestCorrection,
  approveCorrection,
  rejectCorrection,
  cancelCorrection,
  attendanceRegister,
  movementRegister
} from '../controllers/attendanceCorrection.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/', attendanceController.getAllAttendance);
router.get('/stats', attendanceController.getAttendanceStats);
router.get('/:id', attendanceController.getAttendanceById);
router.post('/', attendanceController.createAttendance);
router.put('/:id', attendanceController.updateAttendance);
router.delete('/:id', authorize('Admin', 'Manager'), attendanceController.deleteAttendance);

// Leave requests
router.get('/leave/requests', attendanceController.getAllLeaveRequests);
router.post('/leave/requests', attendanceController.createLeaveRequest);
router.put('/leave/requests/:id', authorize('Admin', 'Manager'), attendanceController.updateLeaveRequestStatus);
router.delete('/leave/requests/:id', attendanceController.deleteLeaveRequest);

// Attendance corrections
router.get   ('/corrections',                 listCorrections);
router.post  ('/corrections',                 requestCorrection);
router.get   ('/corrections/:id',             validateId(), getCorrection);
router.patch ('/corrections/:id/approve',     validateId(), authorize('Admin', 'CEO', 'HR Manager', 'HR Officer'), approveCorrection);
router.patch ('/corrections/:id/reject',      validateId(), authorize('Admin', 'CEO', 'HR Manager', 'HR Officer'), rejectCorrection);
router.patch ('/corrections/:id/cancel',      validateId(), cancelCorrection);

// Register reports
router.get('/reports/attendance', attendanceRegister);
router.get('/reports/movements',  movementRegister);

export default router;
