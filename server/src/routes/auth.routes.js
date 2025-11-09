import express from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { sanitizeBody } from '../middleware/validate.middleware.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', sanitizeBody, register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', sanitizeBody, login);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', refreshToken);

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', sanitizeBody, forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', sanitizeBody, resetPassword);

// ============================================
// PROTECTED ROUTES
// ============================================

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', requireAuth, logout);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', requireAuth, getMe);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', requireAuth, sanitizeBody, updateProfile);

// @route   PUT /api/auth/password
// @desc    Change password
// @access  Private
router.put('/password', requireAuth, sanitizeBody, changePassword);

export default router;
