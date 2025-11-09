import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { User } from '../models/index.js';
import { asyncHandler, AppError, BadRequestError, UnauthorizedError, ConflictError } from '../middleware/error.middleware.js';

// ============================================
// GENERATE JWT TOKENS
// ============================================
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );

  return { accessToken, refreshToken };
};

// ============================================
// REGISTER NEW USER
// ============================================
export const register = asyncHandler(async (req, res) => {
  const { username, email, password, fullName, role = 'Guest' } = req.body;

  // Check if user already exists
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

  // Create new user (password will be hashed by model hook)
  const user = await User.create({
    username,
    email,
    password,
    fullName,
    role,
    status: 'Active'
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  // Save refresh token to database
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.toJSON(),
      accessToken,
      refreshToken
    }
  });
});

// ============================================
// LOGIN USER
// ============================================
export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    throw new BadRequestError('Username and password are required');
  }

  // Find user by username or email
  const user = await User.findOne({
    where: {
      [Op.or]: [
        { username },
        { email: username }
      ]
    }
  });

  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Check if account is active
  if (user.status !== 'Active') {
    throw new UnauthorizedError('Account is not active. Please contact administrator.');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  // Update user
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toJSON(),
      accessToken,
      refreshToken
    }
  });
});

// ============================================
// LOGOUT USER
// ============================================
export const logout = asyncHandler(async (req, res) => {
  const user = req.user;

  // Clear refresh token
  user.refreshToken = null;
  await user.save();

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// ============================================
// REFRESH ACCESS TOKEN
// ============================================
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new BadRequestError('Refresh token is required');
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  // Find user
  const user = await User.findByPk(decoded.id);

  if (!user || user.refreshToken !== refreshToken) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  if (user.status !== 'Active') {
    throw new UnauthorizedError('Account is not active');
  }

  // Generate new tokens
  const tokens = generateTokens(user.id);

  // Update refresh token in database
  user.refreshToken = tokens.refreshToken;
  await user.save();

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: tokens
  });
});

// ============================================
// GET CURRENT USER
// ============================================
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password', 'refreshToken'] }
  });

  res.json({
    success: true,
    data: { user }
  });
});

// ============================================
// UPDATE PROFILE
// ============================================
export const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, email } = req.body;
  const user = req.user;

  // Check if email is being changed and already exists
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictError('Email already in use');
    }
    user.email = email;
  }

  // Update allowed fields
  if (fullName) user.fullName = fullName;
  if (phone) user.phone = phone;

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: user.toJSON() }
  });
});

// ============================================
// CHANGE PASSWORD
// ============================================
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findByPk(req.user.id);

  // Validate input
  if (!currentPassword || !newPassword) {
    throw new BadRequestError('Current password and new password are required');
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  // Check new password strength
  if (newPassword.length < 6) {
    throw new BadRequestError('New password must be at least 6 characters long');
  }

  // Update password (will be hashed by model hook)
  user.password = newPassword;
  user.refreshToken = null; // Invalidate all sessions
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully. Please login again.'
  });
});

// ============================================
// REQUEST PASSWORD RESET (Placeholder)
// ============================================
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email } });

  if (!user) {
    // Don't reveal if user exists
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  }

  // TODO: Generate reset token and send email
  // For now, just return success
  res.json({
    success: true,
    message: 'Password reset functionality will be implemented soon.'
  });
});

// ============================================
// RESET PASSWORD (Placeholder)
// ============================================
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  // TODO: Verify reset token and update password

  res.json({
    success: true,
    message: 'Password reset functionality will be implemented soon.'
  });
});
