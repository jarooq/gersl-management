import { Op } from 'sequelize';
import { Staff, User } from '../models/index.js';
import { asyncHandler, NotFoundError } from '../middleware/error.middleware.js';

// ============================================
// GET ALL STAFF
// ============================================
export const getAllStaff = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, department, status } = req.query;
  const offset = (page - 1) * limit;

  const where = {};

  if (search) {
    where[Op.or] = [
      { fullName: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { position: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (department) where.department = department;
  if (status) where.status = status;

  const { count, rows: staff } = await Staff.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'role']
      }
    ]
  });

  res.json({
    success: true,
    data: {
      staff,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    }
  });
});

// ============================================
// GET SINGLE STAFF
// ============================================
export const getStaffById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const staff = await Staff.findByPk(id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'role', 'email']
      }
    ]
  });

  if (!staff) {
    throw new NotFoundError('Staff not found');
  }

  res.json({
    success: true,
    data: { staff }
  });
});

// ============================================
// CREATE STAFF
// ============================================
export const createStaff = asyncHandler(async (req, res) => {
  const staffData = req.body;

  const staff = await Staff.create(staffData);

  const createdStaff = await Staff.findByPk(staff.id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'role']
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Staff member created successfully',
    data: { staff: createdStaff }
  });
});

// ============================================
// UPDATE STAFF
// ============================================
export const updateStaff = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const staff = await Staff.findByPk(id);

  if (!staff) {
    throw new NotFoundError('Staff not found');
  }

  await staff.update(updateData);

  const updatedStaff = await Staff.findByPk(id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'role']
      }
    ]
  });

  res.json({
    success: true,
    message: 'Staff updated successfully',
    data: { staff: updatedStaff }
  });
});

// ============================================
// DELETE STAFF
// ============================================
export const deleteStaff = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const staff = await Staff.findByPk(id);

  if (!staff) {
    throw new NotFoundError('Staff not found');
  }

  await staff.destroy();

  res.json({
    success: true,
    message: 'Staff deleted successfully'
  });
});

// ============================================
// GET STAFF STATISTICS
// ============================================
export const getStaffStats = asyncHandler(async (req, res) => {
  const { department } = req.query;

  const where = {};
  if (department) where.department = department;

  // Total count
  const total = await Staff.count({ where });

  // Status breakdown
  const byStatus = await Staff.findAll({
    where,
    attributes: [
      'status',
      [Staff.sequelize.fn('COUNT', Staff.sequelize.col('id')), 'count']
    ],
    group: ['status']
  });

  // Department breakdown
  const byDepartment = await Staff.findAll({
    where,
    attributes: [
      'department',
      [Staff.sequelize.fn('COUNT', Staff.sequelize.col('id')), 'count']
    ],
    group: ['department']
  });

  // Employment type breakdown
  const byEmploymentType = await Staff.findAll({
    where,
    attributes: [
      'employmentType',
      [Staff.sequelize.fn('COUNT', Staff.sequelize.col('id')), 'count']
    ],
    group: ['employmentType']
  });

  // Total salary
  const totalSalary = await Staff.sum('salary', { where: { ...where, status: 'Active' } });

  res.json({
    success: true,
    data: {
      total,
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: parseInt(s.get('count'))
      })),
      byDepartment: byDepartment.map(d => ({
        department: d.department,
        count: parseInt(d.get('count'))
      })),
      byEmploymentType: byEmploymentType.map(e => ({
        employmentType: e.employmentType,
        count: parseInt(e.get('count'))
      })),
      totalSalary: parseFloat(totalSalary || 0)
    }
  });
});
