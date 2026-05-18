import express from 'express';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import User from '../models/User.js';
import sequelize from '../config/database.js';

const router = express.Router();

// ============================================
// USER MANAGEMENT ROUTES
// ============================================

// @route   PATCH /api/users/me/avatar
// @desc    Set the CURRENT user's profile photo (mobile self-service).
//          Body: { avatarUrl }. The image itself is uploaded first via
//          POST /api/upload/profile, which returns the URL.
// @access  Private (any authenticated user — own account only)
router.patch('/me/avatar', requireAuth, async (req, res) => {
  try {
    const { avatarUrl } = req.body || {};
    if (avatarUrl != null && typeof avatarUrl !== 'string') {
      return res.status(400).json({ success: false, message: 'avatarUrl must be a string or null' });
    }
    await User.update(
      { avatarUrl: avatarUrl || null },
      { where: { id: req.user.id } }
    );
    res.json({
      success: true,
      message: 'Profile photo updated',
      data: { avatarUrl: avatarUrl || null },
    });
  } catch (error) {
    console.error('Error updating avatar:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile photo' });
  }
});

// @route   POST /api/users
// @desc    Create new user
// @access  Private (Admin only)
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { username, email, password, fullName, role, status, department, phone, avatarUrl } = req.body;

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
      phone: phone || null,
      avatarUrl: avatarUrl || null,
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
    // Let the central error handler turn Sequelize ValidationError /
    // UniqueConstraintError into proper 400 / 409 responses instead of a
    // blanket 500. Anything else also goes to the central handler.
    return next(error);
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
      message: 'Failed to fetch users'
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
      message: 'Failed to fetch user'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin only)
//
// NOTE: This route uses raw SQL (sequelize.query) instead of Sequelize's
// model save/update. Background: Sequelize's findByPk + save was throwing
// 500 on this endpoint and the actual error was never reaching the
// frontend (wrapper hid it, frontend formatting hid it again). Switching
// to a raw SQL UPDATE with a whitelisted column map removes every
// Sequelize-side variable (validation hooks, association loads,
// transaction defaults) so the only way this can 500 is a real DB error,
// which we'll see clearly.
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (!Number.isFinite(userId) || userId < 1) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    // Whitelisted body field → DB column. Any field outside this map is
    // ignored entirely. Coerces status to a value the User.status enum
    // accepts (some Staff rows have 'Pending' which the enum rejects).
    const VALID_STATUS = new Set(['Active', 'Inactive', 'Suspended']);
    const map = {
      fullName:   'full_name',
      email:      'email',
      role:       'role',
      status:     'status',
      department: 'department',
      phone:      'phone',
      avatarUrl:  'avatar_url',  // admin can set/replace a staff photo
    };

    const sets = [];
    const replacements = { id: userId };
    for (const [field, column] of Object.entries(map)) {
      if (req.body[field] === undefined) continue;
      let value = req.body[field];
      if (field === 'status' && !VALID_STATUS.has(value)) value = 'Active';
      sets.push(`${column} = :${field}`);
      replacements[field] = value;
    }

    // Password reset path. The User.js beforeUpdate hook hashes via bcrypt
    // when the model save path is used, but this endpoint runs raw SQL to
    // avoid the historical Sequelize-side 500s — so we hash here. Earlier
    // bug: the whitelist above didn't include `password`, so admin password
    // resets were silently dropped (UI returned success, user still
    // couldn't log in with the new password). Also clear the lockout
    // fields so an admin reset frees a previously locked account.
    if (typeof req.body.password === 'string' && req.body.password.length > 0) {
      const pw = req.body.password;
      if (pw.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
      }
      const salt = await bcrypt.genSalt(10);
      replacements.password = await bcrypt.hash(pw, salt);
      sets.push(`password = :password`);
      sets.push(`failed_login_attempts = 0`);
      sets.push(`account_locked_until = NULL`);
    }

    if (sets.length === 0) {
      return res.status(400).json({ success: false, message: 'No updatable fields provided' });
    }

    sets.push(`updated_at = NOW()`);

    const sql = `UPDATE users SET ${sets.join(', ')} WHERE id = :id RETURNING id, username, email, full_name, role, status, department, phone;`;
    const [rows] = await sequelize.query(sql, { replacements });

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const u = rows[0];
    return res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: u.id,
        username: u.username,
        fullName: u.full_name,
        email: u.email,
        role: u.role,
        status: u.status,
        department: u.department,
        phone: u.phone,
      }
    });
  } catch (error) {
    console.error('Error updating user:', {
      name: error.name,
      message: error.message,
      sql: error.sql,
      original: error.original?.message,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (cascades to linked Staff record so HR list stays in sync)
// @access  Private (Admin only)
//
// Audit-hardening 2026-05-15: previously this only destroyed the User row,
// leaving the linked Staff row orphaned. HR → Staff Register kept showing
// the deleted person. Now we delete the linked Staff first inside a
// transaction so both screens reflect the deletion atomically.
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

    // Lazy import — Staff lives in models/index.js which (eagerly) pulls in
    // every model in the project, including User. Importing at top of file
    // creates a circular load. Lazy load keeps the existing module graph.
    const { Staff } = await import('../models/index.js');

    await sequelize.transaction(async (t) => {
      // Cascade to Staff first; FK constraint requires user row to exist
      // until the Staff row is gone.
      await Staff.destroy({ where: { userId: user.id }, transaction: t });
      await user.destroy({ transaction: t });
    });

    res.json({
      success: true,
      message: 'User and linked staff record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

export default router;
