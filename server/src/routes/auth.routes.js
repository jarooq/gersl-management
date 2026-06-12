import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  getDownloadToken,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { sanitizeBody } from '../middleware/validate.middleware.js';

const router = express.Router();

// Brute-force protection on credential endpoints. Per-IP, counts failures only
// (skipSuccessfulRequests=true) so legitimate users aren't punished.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many failed attempts. Try again in 15 minutes.' }
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many password reset requests. Try again in 1 hour.' }
});

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
router.post('/login', credentialLimiter, sanitizeBody, login);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', refreshToken);

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', passwordResetLimiter, sanitizeBody, forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', passwordResetLimiter, sanitizeBody, resetPassword);

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

// @route   GET /api/auth/download-token
// @desc    Mint a short-lived token for external file/PDF URLs
// @access  Private
router.get('/download-token', requireAuth, getDownloadToken);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', requireAuth, sanitizeBody, updateProfile);

// @route   PUT /api/auth/password
// @desc    Change password
// @access  Private
router.put('/password', requireAuth, sanitizeBody, changePassword);

export default router;
