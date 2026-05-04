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
import {
  recordPunch,
  listMyPunches,
  todayStatus,
  listPunchesByUser,
  listAllPunches
} from '../controllers/attendancePunch.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';

const router = express.Router();
router.use(protect);

// Static sub-paths must come BEFORE /:id routes — Express matches in order.

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

// Mobile attendance punches
router.post('/punches',           recordPunch);
router.get ('/punches/today',     todayStatus);
router.get ('/punches/me',        listMyPunches);
// HR view: list all staff punches in a window (NB: must come before the
// userId-required handler so the all-punches fetch isn't gated on userId).
router.get ('/punches/all',       listAllPunches);
router.get ('/punches',           listPunchesByUser);

// Stats and listings
router.get('/', attendanceController.getAllAttendance);
router.get('/stats', attendanceController.getAttendanceStats);
router.post('/', attendanceController.createAttendance);

// Param routes — must be LAST
router.get('/:id', attendanceController.getAttendanceById);
router.put('/:id', attendanceController.updateAttendance);
router.delete('/:id', authorize('Admin', 'Manager'), attendanceController.deleteAttendance);

export default router;
