import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

// ============================================
// VERIFY JWT TOKEN
// ============================================
export const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'refreshToken'] }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    // Check if user is active
    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active. Please contact administrator.'
      });
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication error.',
      error: error.message
    });
  }
};

// ============================================
// REQUIRE AUTHENTICATION
// ============================================
export const requireAuth = verifyToken;

// ============================================
// CHECK SPECIFIC ROLE
// ============================================
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// ============================================
// CHECK SPECIFIC PERMISSION
// ============================================
// Permission definitions matching frontend RBAC
const PERMISSIONS = {
  // Orphan permissions
  ORPHANS_VIEW: 'orphans:view',
  ORPHANS_CREATE: 'orphans:create',
  ORPHANS_EDIT: 'orphans:edit',
  ORPHANS_DELETE: 'orphans:delete',
  ORPHANS_APPROVE: 'orphans:approve',

  // Project permissions
  PROJECTS_VIEW: 'projects:view',
  PROJECTS_CREATE: 'projects:create',
  PROJECTS_EDIT: 'projects:edit',
  PROJECTS_DELETE: 'projects:delete',

  // Finance permissions
  FINANCE_VIEW: 'finance:view',
  FINANCE_CREATE: 'finance:create',
  FINANCE_EDIT: 'finance:edit',
  FINANCE_DELETE: 'finance:delete',
  FINANCE_APPROVE: 'finance:approve',
  FINANCE_CEO_APPROVE: 'finance:ceo_approve',

  // HR permissions
  HR_VIEW: 'hr:view',
  HR_CREATE: 'hr:create',
  HR_EDIT: 'hr:edit',
  HR_DELETE: 'hr:delete',
  HR_APPROVE_LEAVE: 'hr:approve_leave',

  // CBO permissions
  CBO_VIEW: 'cbo:view',
  CBO_CREATE: 'cbo:create',
  CBO_EDIT: 'cbo:edit',
  CBO_DELETE: 'cbo:delete',

  // Partner permissions
  PARTNERS_VIEW: 'partners:view',
  PARTNERS_CREATE: 'partners:create',
  PARTNERS_EDIT: 'partners:edit',
  PARTNERS_DELETE: 'partners:delete',

  // MEAL permissions
  MEAL_VIEW: 'meal:view',
  MEAL_CREATE: 'meal:create',
  MEAL_EDIT: 'meal:edit',
  MEAL_DELETE: 'meal:delete',

  // Report permissions
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',

  // Settings permissions
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',

  // User management
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete'
};

// Role to permissions mapping (matching frontend)
const ROLE_PERMISSIONS = {
  'Admin': [...Object.values(PERMISSIONS)],

  'CEO': [
    PERMISSIONS.ORPHANS_VIEW,
    PERMISSIONS.ORPHANS_APPROVE,
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_EDIT,
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.FINANCE_CEO_APPROVE,
    PERMISSIONS.HR_VIEW,
    PERMISSIONS.HR_APPROVE_LEAVE,
    PERMISSIONS.CBO_VIEW,
    PERMISSIONS.PARTNERS_VIEW,
    PERMISSIONS.MEAL_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.SETTINGS_VIEW
  ],

  'Programme Manager': [
    PERMISSIONS.ORPHANS_VIEW,
    PERMISSIONS.ORPHANS_CREATE,
    PERMISSIONS.ORPHANS_EDIT,
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_EDIT,
    PERMISSIONS.CBO_VIEW,
    PERMISSIONS.CBO_CREATE,
    PERMISSIONS.CBO_EDIT,
    PERMISSIONS.PARTNERS_VIEW,
    PERMISSIONS.MEAL_VIEW,
    PERMISSIONS.MEAL_CREATE,
    PERMISSIONS.MEAL_EDIT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT
  ],

  'Finance Manager': [
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.FINANCE_CREATE,
    PERMISSIONS.FINANCE_EDIT,
    PERMISSIONS.FINANCE_DELETE,
    PERMISSIONS.FINANCE_APPROVE,
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT
  ],

  'Finance Officer': [
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.FINANCE_CREATE,
    PERMISSIONS.FINANCE_EDIT,
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.REPORTS_VIEW
  ],

  'Fundraising Manager': [
    PERMISSIONS.PARTNERS_VIEW,
    PERMISSIONS.PARTNERS_CREATE,
    PERMISSIONS.PARTNERS_EDIT,
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT
  ],

  'HR Manager': [
    PERMISSIONS.HR_VIEW,
    PERMISSIONS.HR_CREATE,
    PERMISSIONS.HR_EDIT,
    PERMISSIONS.HR_DELETE,
    PERMISSIONS.HR_APPROVE_LEAVE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT
  ],

  'Project Officer': [
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_EDIT,
    PERMISSIONS.ORPHANS_VIEW,
    PERMISSIONS.ORPHANS_CREATE,
    PERMISSIONS.ORPHANS_EDIT,
    PERMISSIONS.MEAL_VIEW,
    PERMISSIONS.MEAL_CREATE,
    PERMISSIONS.REPORTS_VIEW
  ],

  'Field Officer': [
    PERMISSIONS.ORPHANS_VIEW,
    PERMISSIONS.ORPHANS_EDIT,
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.MEAL_VIEW,
    PERMISSIONS.MEAL_CREATE,
    PERMISSIONS.CBO_VIEW,
    PERMISSIONS.REPORTS_VIEW
  ],

  'MEAL Officer': [
    PERMISSIONS.MEAL_VIEW,
    PERMISSIONS.MEAL_CREATE,
    PERMISSIONS.MEAL_EDIT,
    PERMISSIONS.MEAL_DELETE,
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.ORPHANS_VIEW,
    PERMISSIONS.CBO_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT
  ],

  'Accountant': [
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.FINANCE_CREATE,
    PERMISSIONS.FINANCE_EDIT,
    PERMISSIONS.REPORTS_VIEW
  ],

  'Guest': [
    PERMISSIONS.ORPHANS_VIEW,
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.CBO_VIEW,
    PERMISSIONS.PARTNERS_VIEW
  ]
};

// Check if user has specific permission
export const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  return rolePermissions.includes(permission);
};

// Middleware to check permission
export const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const hasRequiredPermission = permissions.some(permission =>
      hasPermission(req.user, permission)
    );

    if (!hasRequiredPermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to perform this action.'
      });
    }

    next();
  };
};

// ============================================
// CHECK IF USER IS ADMIN
// ============================================
export const requireAdmin = requireRole('Admin');

// ============================================
// OPTIONAL AUTHENTICATION
// ============================================
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password', 'refreshToken'] }
      });

      if (user && user.status === 'Active') {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
};

export { PERMISSIONS, ROLE_PERMISSIONS };
