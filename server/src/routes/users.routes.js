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

    // Store plain password before hashing (for email)
    const plainPassword = password;

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

    // Send welcome email with credentials
    try {
      const { sendNewUserEmail } = await import('../utils/emailService.js');
      await sendNewUserEmail(user.email, user.username, plainPassword);
      console.log('✅ Welcome email sent to:', user.email);
    } catch (emailError) {
      console.error('❌ Failed to send welcome email:', emailError);
      // Continue anyway - user was created successfully
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully. Welcome email sent with login credentials.',
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

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user fields
    if (fullName !== undefined) user.fullName = fullName;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (status !== undefined) user.status = status;
    if (department !== undefined) user.department = department;
    if (phone !== undefined) user.phone = phone;

    await user.save();

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
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
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
