import { Op } from 'sequelize';
import { Staff, User, Role } from '../models/index.js';
import { asyncHandler, NotFoundError, BadRequestError, ConflictError } from '../middleware/error.middleware.js';
import sequelize from '../config/database.js';

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
// CREATE STAFF (with automatic user account creation)
// ============================================
export const createStaff = asyncHandler(async (req, res) => {
  const {
    // Staff data
    fullName, email, phone, department, position, joiningDate,
    salary, leaveBalance, employmentType, contractEndDate,
    // User account data
    username, password, userRole = 'Staff', userStatus = 'Active'
  } = req.body;

  // Validate required user fields
  if (!username || !password) {
    throw new BadRequestError('Username and password are required to create user account');
  }

  // Check if user with email or username already exists
  const existingUser = await User.findOne({
    where: {
      [Op.or]: [{ email }, { username }]
    }
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new ConflictError('Email already registered');
    }
    if (existingUser.username === username) {
      throw new ConflictError('Username already taken');
    }
  }

  // Find the role (for linking)
  const role = await Role.findOne({ where: { name: userRole } });
  const roleId = role ? role.id : null;

  // Use transaction to ensure both staff and user are created together
  const transaction = await sequelize.transaction();

  try {
    // 1. Create user account first
    const user = await User.create({
      username,
      email,
      password, // Will be hashed by User model hook
      fullName,
      phone,
      role: userRole,
      roleId,
      status: userStatus,
      department
    }, { transaction });

    // 2. Create staff record linked to user
    const staff = await Staff.create({
      fullName,
      email,
      phone,
      department,
      position,
      joinDate: joiningDate,
      salary,
      employmentType: employmentType || 'Full-Time',
      status: 'Active',
      userId: user.id
    }, { transaction });

    // Commit transaction
    await transaction.commit();

    // Fetch created staff with user data
    const createdStaff = await Staff.findByPk(staff.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'role', 'email', 'status']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Staff member and user account created successfully',
      data: {
        staff: createdStaff,
        userCredentials: {
          username: user.username,
          email: user.email,
          role: user.role,
          message: 'User account has been created. The staff member can now log in with their credentials.'
        }
      }
    });
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    throw error;
  }
});

// ============================================
// PUBLIC SELF-REGISTRATION
// Used by /staff-register on the web. No auth required, BUT every record
// is forced to status='Pending' on the user side (must be activated by HR
// before login works) and the role is forced to 'Guest' (lowest privilege)
// regardless of what the client sent. Salary is dropped — staff don't set
// their own salary on a public form.
// ============================================
export const publicRegisterStaff = asyncHandler(async (req, res) => {
  const {
    fullName, email, phone, department, position, joiningDate,
    employmentType,
    username, password
  } = req.body;

  if (!fullName || !email || !department || !position) {
    throw new BadRequestError('Full name, email, department, and position are required');
  }
  if (!username || !password) {
    throw new BadRequestError('Username and password are required');
  }
  if (password.length < 8) {
    throw new BadRequestError('Password must be at least 8 characters');
  }

  const existingUser = await User.findOne({
    where: { [Op.or]: [{ email }, { username }] }
  });
  if (existingUser) {
    if (existingUser.email === email)       throw new ConflictError('Email already registered');
    if (existingUser.username === username) throw new ConflictError('Username already taken');
  }

  const transaction = await sequelize.transaction();
  try {
    // User.status ENUM is ('Active', 'Inactive', 'Suspended') — no 'Pending'.
    // Use 'Inactive' for new self-registrations; HR flips to 'Active' from
    // the admin app to allow login. Role is forced to 'Guest' (lowest
    // privilege) regardless of what the client sent.
    const user = await User.create({
      username,
      email,
      password,
      fullName,
      phone,
      role: 'Guest',
      status: 'Inactive',
      department
    }, { transaction });

    // Staff.status is a free STRING — 'Pending' here is the visible HR
    // signal in the Staff Directory that this row hasn't been approved yet.
    const staff = await Staff.create({
      fullName,
      email,
      phone,
      department,
      position,
      joinDate: joiningDate || null,
      salary: 0,
      employmentType: employmentType || 'Full-Time',
      status: 'Pending',
      userId: user.id
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Registered. Awaiting HR approval before you can log in.',
      data: { staffId: staff.id }
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
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
