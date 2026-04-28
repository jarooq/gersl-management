import { Op } from 'sequelize';
import { Attendance, LeaveRequest, Staff, User } from '../models/index.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error.middleware.js';

export const getAllAttendance = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, staffId, status, startDate, endDate } = req.query;
  const offset = (page - 1) * limit;
  const where = {};

  if (staffId) where.staffId = staffId;
  if (status) where.status = status;
  if (startDate || endDate) {
    where.attendanceDate = {};
    if (startDate) where.attendanceDate[Op.gte] = startDate;
    if (endDate) where.attendanceDate[Op.lte] = endDate;
  }

  const { count, rows: attendanceRecords } = await Attendance.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['attendanceDate', 'DESC']],
    include: [
      { model: Staff, as: 'staff', attributes: ['id', 'fullName'] },
      { model: User, as: 'approver', attributes: ['id', 'fullName'] }
    ]
  });

  res.json({
    success: true,
    data: {
      attendanceRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    }
  });
});

export const getAttendanceById = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findByPk(req.params.id, {
    include: [
      { model: Staff, as: 'staff' },
      { model: User, as: 'approver', attributes: ['id', 'fullName'] }
    ]
  });

  if (!attendance) throw new NotFoundError('Attendance record not found');
  res.json({ success: true, data: { attendance } });
});

export const createAttendance = asyncHandler(async (req, res) => {
  const attendanceData = req.body;

  // Check if attendance already exists for staff on this date
  const existing = await Attendance.findOne({
    where: {
      staffId: attendanceData.staffId,
      attendanceDate: attendanceData.attendanceDate
    }
  });

  if (existing) {
    throw new ValidationError('Attendance already recorded for this date');
  }

  // Calculate work hours if check-in and check-out times provided
  if (attendanceData.checkInTime && attendanceData.checkOutTime) {
    const checkIn = new Date(`2000-01-01 ${attendanceData.checkInTime}`);
    const checkOut = new Date(`2000-01-01 ${attendanceData.checkOutTime}`);
    const diffMs = checkOut - checkIn;
    attendanceData.workHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
  }

  const attendance = await Attendance.create(attendanceData);
  res.status(201).json({ success: true, message: 'Attendance recorded successfully', data: { attendance } });
});

export const updateAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findByPk(req.params.id);
  if (!attendance) throw new NotFoundError('Attendance record not found');

  const updateData = req.body;

  // Recalculate work hours if times changed
  if (updateData.checkInTime || updateData.checkOutTime) {
    const checkInTime = updateData.checkInTime || attendance.checkInTime;
    const checkOutTime = updateData.checkOutTime || attendance.checkOutTime;

    if (checkInTime && checkOutTime) {
      const checkIn = new Date(`2000-01-01 ${checkInTime}`);
      const checkOut = new Date(`2000-01-01 ${checkOutTime}`);
      const diffMs = checkOut - checkIn;
      updateData.workHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    }
  }

  await attendance.update(updateData);
  res.json({ success: true, message: 'Attendance updated successfully', data: { attendance } });
});

export const deleteAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findByPk(req.params.id);
  if (!attendance) throw new NotFoundError('Attendance record not found');

  await attendance.destroy();
  res.json({ success: true, message: 'Attendance record deleted successfully' });
});

export const getAttendanceStats = asyncHandler(async (req, res) => {
  const { staffId, month, year } = req.query;

  const where = {};
  if (staffId) where.staffId = staffId;

  // Filter by month/year if provided
  if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    where.attendanceDate = { [Op.between]: [startDate, endDate] };
  }

  const totalDays = await Attendance.count({ where });
  const present = await Attendance.count({ where: { ...where, status: 'Present' } });
  const absent = await Attendance.count({ where: { ...where, status: 'Absent' } });
  const late = await Attendance.count({ where: { ...where, status: 'Late' } });
  const leave = await Attendance.count({ where: { ...where, status: 'Leave' } });

  const totalWorkHours = await Attendance.sum('workHours', { where }) || 0;
  const totalOvertimeHours = await Attendance.sum('overtimeHours', { where }) || 0;

  res.json({
    success: true,
    data: {
      totalDays, present, absent, late, leave,
      totalWorkHours: parseFloat(totalWorkHours),
      totalOvertimeHours: parseFloat(totalOvertimeHours)
    }
  });
});

// Leave Request handlers
export const getAllLeaveRequests = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, staffId, status, leaveType } = req.query;
  const offset = (page - 1) * limit;
  const where = {};

  if (staffId) where.staffId = staffId;
  if (status) where.status = status;
  if (leaveType) where.leaveType = leaveType;

  const { count, rows: leaveRequests } = await LeaveRequest.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: [
      { model: Staff, as: 'staff', attributes: ['id', 'fullName'] },
      { model: User, as: 'approver', attributes: ['id', 'fullName'] }
    ]
  });

  res.json({
    success: true,
    data: {
      leaveRequests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    }
  });
});

export const createLeaveRequest = asyncHandler(async (req, res) => {
  const leaveData = req.body;

  // Calculate days count if not provided
  if (!leaveData.daysCount && leaveData.startDate && leaveData.endDate) {
    const start = new Date(leaveData.startDate);
    const end = new Date(leaveData.endDate);
    const diffTime = Math.abs(end - start);
    leaveData.daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  const leaveRequest = await LeaveRequest.create(leaveData);
  res.status(201).json({ success: true, message: 'Leave request submitted successfully', data: { leaveRequest } });
});

export const updateLeaveRequestStatus = asyncHandler(async (req, res) => {
  const leaveRequest = await LeaveRequest.findByPk(req.params.id);
  if (!leaveRequest) throw new NotFoundError('Leave request not found');

  const { status, rejectionReason } = req.body;

  await leaveRequest.update({
    status,
    approvedBy: req.user?.id,
    approvalDate: new Date(),
    rejectionReason: rejectionReason || null
  });

  // If approved, create attendance records for leave period
  if (status === 'Approved') {
    const start = new Date(leaveRequest.startDate);
    const end = new Date(leaveRequest.endDate);

    const attendanceRecords = [];
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      // Check if attendance doesn't already exist
      const existing = await Attendance.findOne({
        where: {
          staffId: leaveRequest.staffId,
          attendanceDate: new Date(date)
        }
      });

      if (!existing) {
        attendanceRecords.push({
          staffId: leaveRequest.staffId,
          attendanceDate: new Date(date),
          status: 'Leave',
          leaveType: leaveRequest.leaveType,
          approvedBy: req.user?.id
        });
      }
    }

    if (attendanceRecords.length > 0) {
      await Attendance.bulkCreate(attendanceRecords);
    }
  }

  res.json({ success: true, message: 'Leave request updated successfully', data: { leaveRequest } });
});

export const deleteLeaveRequest = asyncHandler(async (req, res) => {
  const leaveRequest = await LeaveRequest.findByPk(req.params.id);
  if (!leaveRequest) throw new NotFoundError('Leave request not found');

  if (leaveRequest.status === 'Approved') {
    throw new ValidationError('Cannot delete approved leave request');
  }

  await leaveRequest.destroy();
  res.json({ success: true, message: 'Leave request deleted successfully' });
});
