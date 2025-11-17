import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { User } from '../models/index.js';
import { asyncHandler, AppError, BadRequestError, UnauthorizedError, ConflictError } from '../middleware/error.middleware.js';

// ============================================
// PASSWORD VALIDATION
// ============================================
const validatePassword = (password) => {
  if (!password) {
    throw new BadRequestError('Password is required');
  }

  if (password.length < 8) {
    throw new BadRequestError('Password must be at least 8 characters long');
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    throw new BadRequestError('Password must contain at least one lowercase letter');
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    throw new BadRequestError('Password must contain at least one uppercase letter');
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    throw new BadRequestError('Password must contain at least one number');
  }

  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password)) {
    throw new BadRequestError('Password must contain at least one special character');
  }

  return true;
};

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
// SET AUTH COOKIES (httpOnly for security)
// ============================================
const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Access token cookie (24 hours)
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction, // Only HTTPS in production
    sameSite: 'none', // Allow cross-site cookies for API
    domain: isProduction ? '.erp-globalehsan.org' : undefined,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  // Refresh token cookie (7 days)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'none', // Allow cross-site cookies for API
    domain: isProduction ? '.erp-globalehsan.org' : undefined,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

// ============================================
// CLEAR AUTH COOKIES
// ============================================
const clearAuthCookies = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

// ============================================
// REGISTER NEW USER
// ============================================
export const register = asyncHandler(async (req, res) => {
  const { username, email, password, fullName, role = 'Guest' } = req.body;

  // Validate password strength
  validatePassword(password);

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

  // Set httpOnly cookies
  setAuthCookies(res, accessToken, refreshToken);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.toJSON()
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

  // Check if account is locked
  if (user.accountLockedUntil && new Date() < user.accountLockedUntil) {
    const remainingMinutes = Math.ceil((user.accountLockedUntil - new Date()) / 60000);
    throw new UnauthorizedError(`Account is temporarily locked due to too many failed login attempts. Please try again in ${remainingMinutes} minute(s).`);
  }

  // Check if account is active
  if (user.status !== 'Active') {
    throw new UnauthorizedError('Account is not active. Please contact administrator.');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    // Increment failed login attempts
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

    // Lock account after 5 failed attempts (15 minutes)
    if (user.failedLoginAttempts >= 5) {
      user.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await user.save();
      throw new UnauthorizedError('Account locked due to too many failed login attempts. Please try again in 15 minutes.');
    }

    await user.save();
    throw new UnauthorizedError(`Invalid credentials. ${5 - user.failedLoginAttempts} attempt(s) remaining before account lockout.`);
  }

  // Reset failed login attempts on successful login
  user.failedLoginAttempts = 0;
  user.accountLockedUntil = null;

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  // Update user
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();

  // Set httpOnly cookies
  setAuthCookies(res, accessToken, refreshToken);

  // Add permissions to user object
  const userWithPermissions = user.toJSON();

  console.log('🔍 login - User role:', userWithPermissions.role);
  console.log('🔍 login - User ID:', userWithPermissions.id);

  if (userWithPermissions.role === 'Admin') {
    userWithPermissions.permissions = [
      { id: 1, permissionKey: '*', name: 'Full Access', description: 'Access to all features' }
    ];
    console.log('✅ login - Added wildcard permissions for Admin');
  } else {
    userWithPermissions.permissions = [];
    console.log('⚠️  login - Non-admin user, empty permissions array');
  }

  console.log('📤 login - Response user:', JSON.stringify({ user: userWithPermissions }, null, 2));

  res.json({
    success: true,
    message: 'Login successful',
    accessToken, // Include tokens in response for frontend
    refreshToken, // Include tokens in response for frontend
    user: userWithPermissions, // Return user WITH permissions for compatibility
    data: {
      user: userWithPermissions // Return user WITH permissions
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

  // Clear httpOnly cookies
  clearAuthCookies(res);

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// ============================================
// REFRESH ACCESS TOKEN
// ============================================
export const refreshToken = asyncHandler(async (req, res) => {
  // Get refresh token from httpOnly cookie
  const refreshTokenFromCookie = req.cookies.refreshToken;

  if (!refreshTokenFromCookie) {
    throw new UnauthorizedError('Refresh token is required');
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(
      refreshTokenFromCookie,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  // Find user
  const user = await User.findByPk(decoded.id);

  if (!user || user.refreshToken !== refreshTokenFromCookie) {
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

  // Set new httpOnly cookies
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

  res.json({
    success: true,
    message: 'Token refreshed successfully'
  });
});

// ============================================
// GET CURRENT USER
// ============================================
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password', 'refreshToken'] }
  });

  // Add permissions array for compatibility with frontend
  // Since users.role is a VARCHAR (not a foreign key to roles table),
  // we'll add a wildcard permission for Admin users
  const userWithPermissions = user.toJSON();

  console.log('🔍 getMe - User role:', userWithPermissions.role);
  console.log('🔍 getMe - User ID:', userWithPermissions.id);

  if (userWithPermissions.role === 'Admin') {
    // Admin gets wildcard permission (access to everything)
    userWithPermissions.permissions = [
      { id: 1, permissionKey: '*', name: 'Full Access', description: 'Access to all features' }
    ];
    console.log('✅ getMe - Added wildcard permissions for Admin');
  } else {
    // Other roles get empty permissions for now (can be enhanced later)
    userWithPermissions.permissions = [];
    console.log('⚠️  getMe - Non-admin user, empty permissions array');
  }

  console.log('📤 getMe - Response:', JSON.stringify({ user: userWithPermissions }, null, 2));

  // Add no-cache headers to prevent browser from caching this response
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  res.json({
    success: true,
    data: { user: userWithPermissions }
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

  // Validate new password strength
  validatePassword(newPassword);

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
// REQUEST PASSWORD RESET
// ============================================
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new BadRequestError('Email is required');
  }

  const user = await User.findOne({ where: { email } });

  if (!user) {
    // Don't reveal if user exists (security best practice)
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  }

  // Generate reset token (cryptographically secure random token)
  const crypto = await import('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash the token before storing (security best practice)
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Set reset token and expiry (1 hour)
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  // Send password reset email
  try {
    const { sendPasswordResetEmail } = await import('../utils/emailService.js');
    await sendPasswordResetEmail(user.email, user.username, resetToken);
    console.log('✅ Password reset email sent to:', user.email);
  } catch (emailError) {
    console.error('❌ Failed to send password reset email:', emailError);
    // Continue anyway - don't reveal email sending failures to user
  }

  // Only log in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 Password Reset Request');
    console.log('User:', user.email);
    console.log('Reset URL:', `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`);
    console.log('Token expires:', user.passwordResetExpires);
  }

  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent to your email.',
    // REMOVE THIS IN PRODUCTION - only for development testing
    ...(process.env.NODE_ENV === 'development' && {
      resetToken,
      note: 'Reset token provided for development only'
    })
  });
});

// ============================================
// RESET PASSWORD
// ============================================
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new BadRequestError('Token and new password are required');
  }

  // Validate new password strength
  validatePassword(newPassword);

  // Hash the provided token to compare with stored hash
  const crypto = await import('crypto');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with matching reset token and check expiry
  const user = await User.findOne({
    where: {
      passwordResetToken: hashedToken,
    }
  });

  if (!user) {
    throw new BadRequestError('Invalid or expired reset token');
  }

  // Check if token has expired
  if (!user.passwordResetExpires || new Date() > user.passwordResetExpires) {
    throw new BadRequestError('Reset token has expired. Please request a new one.');
  }

  // Update password (will be automatically hashed by beforeUpdate hook)
  user.password = newPassword;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  // Clear refresh token to force re-login
  user.refreshToken = null;

  await user.save();

  res.json({
    success: true,
    message: 'Password has been reset successfully. Please login with your new password.'
  });
});
