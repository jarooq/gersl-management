import express from 'express';
import * as attendanceController from '../controllers/attendance.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

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

export default router;
