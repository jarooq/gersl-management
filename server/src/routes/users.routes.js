import express from 'express';
import { Op } from 'sequelize';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import User from '../models/User.js';

const router = express.Router();

// ============================================
// USER MANAGEMENT ROUTES
// ============================================

// @route   POST /api/users
// @desc    Create new user
// @access  Private (Admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, fullName, role, status, department, phone } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }
      if (existingUser.username === username) {
        return res.status(409).json({
          success: false,
          message: 'Username already taken'
        });
      }
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password, // Will be hashed by User model beforeCreate hook
      fullName,
      role: role || 'Guest',
      status: status || 'Active',
      department: department || null,  // Set to null if not provided (ENUM field)
      phone: phone || null
    });

    // Welcome email (no password — recipient uses forgot-password to set one).
    try {
      const { sendNewUserEmail } = await import('../utils/emailService.js');
      await sendNewUserEmail(user.email, user.username);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully. Welcome email sent.',
      data: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        department: user.department,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('❌ Error creating user:');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    if (error.parent) {
      console.error('Database error:', error.parent.message);
    }
    if (error.errors) {
      console.error('Validation errors:', error.errors.map(e => e.message));
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message,
      details: error.errors ? error.errors.map(e => e.message) : undefined
    });
  }
});

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'fullName', 'email', 'role', 'status', 'department', 'phone', 'lastLogin', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin only)
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'username', 'fullName', 'email', 'role', 'status', 'department', 'phone', 'lastLogin', 'createdAt', 'updatedAt']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin only)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { fullName, email, role, status, department, phone } = req.body;

    // Use sequelize.query to update only the columns we know exist, avoiding
    // any production-vs-model column drift on the wider HR fields (salary,
    // joining_date, etc.). findByPk + save() loads ALL model attributes,
    // which fails when a recently-added model column hasn't been migrated.
    const user = await User.findByPk(req.params.id, {
      attributes: [
        'id', 'username', 'email', 'fullName', 'role',
        'status', 'department', 'phone'
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update only the fields that came through, restricted to the safe
    // column set. Any field not in this list is ignored from the payload.
    const updates = {};
    if (fullName   !== undefined) updates.fullName   = fullName;
    if (email      !== undefined) updates.email      = email;
    if (role       !== undefined) updates.role       = role;
    if (status     !== undefined) updates.status     = status;
    if (department !== undefined) updates.department = department;
    if (phone      !== undefined) updates.phone      = phone;

    await user.update(updates);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        department: user.department,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Error updating user:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      sql: error.sql,
      original: error.original?.message,
      errors: error.errors?.map(e => ({ message: e.message, path: e.path, value: e.value }))
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message,
      detail: error.original?.message || error.errors?.[0]?.message || null,
      type: error.name
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting yourself
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

export default router;
