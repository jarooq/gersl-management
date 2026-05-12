import React, { createContext, useContext, useState, useEffect } from 'react';
import API, { TokenManager } from '../services/api';
import { getRoleInfo, canApprove as roleCanApprove, isSubordinate, canAccessUserData } from '../config/roleHierarchy';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Source of truth on boot is /api/me — the httpOnly cookie (or legacy
    // Bearer token kept by TokenManager) authenticates the request. If the
    // call succeeds we're logged in; a 401 means we're not. We deliberately
    // do NOT read user data from localStorage anymore — keeping a copy
    // there is XSS-exfiltrable for no real gain, and any local copy can
    // drift from the server's view (stale role, stale permissions).
    const initAuth = async () => {
      try {
        const userData = await API.Auth.getCurrentUser();
        if (isMounted && userData) {
          setCurrentUser(userData);
          setIsLoggedIn(true);
        }
      } catch (error) {
        // 401 / network error — treat as logged-out and clear any stale
        // tokens left over from older clients.
        if (isMounted) {
          TokenManager.clearTokens();
        }
      } finally {
        // Belt-and-braces: scrub any pre-existing currentUser entry from
        // a previous app version that wrote it.
        localStorage.removeItem('currentUser');
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (username, password) => {
    try {
      const response = await API.Auth.login({ username, password });

      // Store tokens
      TokenManager.setTokens(response.accessToken, response.refreshToken);

      // Store user data — in-memory only. Server is the source of truth
      // for current-user data via /api/me on subsequent reloads.
      setCurrentUser(response.user);
      setIsLoggedIn(true);

      return { success: true, user: response.user };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Invalid username or password'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await API.Auth.register(userData);

      // Automatically log in after registration. In-memory user only.
      TokenManager.setTokens(response.accessToken, response.refreshToken);
      setCurrentUser(response.user);
      setIsLoggedIn(true);

      return { success: true, user: response.user };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed'
      };
    }
  };

  const logout = async () => {
    try {
      await API.Auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state regardless of API call success. TokenManager.clearTokens
      // also strips any legacy currentUser entry.
      setCurrentUser(null);
      setIsLoggedIn(false);
      TokenManager.clearTokens();
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await API.Auth.updateProfile(profileData);
      setCurrentUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        message: error.message || 'Profile update failed'
      };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await API.Auth.changePassword({ currentPassword, newPassword });
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      console.error('Password change error:', error);
      return {
        success: false,
        message: error.message || 'Password change failed'
      };
    }
  };

  /**
   * Check if current user has a specific permission
   * @param {string} permission - Permission key to check (e.g., 'orphans:create')
   * @returns {boolean}
   */
  const hasPermission = (permission) => {
    if (!currentUser) return false;
    const perms = currentUser.permissions;
    if (!Array.isArray(perms)) return false;
    // Admins carry a '*' wildcard; everyone else has an explicit list.
    if (perms.some(p => p.permissionKey === '*')) return true;
    return perms.some(p => p.permissionKey === permission);
  };

  /**
   * Check if current user has any of the specified permissions
   * @param {string[]} permissions - Array of permission keys to check
   * @returns {boolean} - True if user has at least one of the permissions
   */
  const hasAnyPermission = (permissions) => {
    if (!currentUser) return false;
    if (!Array.isArray(permissions)) return false;

    // Use database permissions from user object
    if (currentUser.permissions && Array.isArray(currentUser.permissions)) {
      return permissions.some(permission =>
        currentUser.permissions.some(p => p.permissionKey === permission)
      );
    }

    return false;
  };

  /**
   * Check if current user has all of the specified permissions
   * @param {string[]} permissions - Array of permission keys to check
   * @returns {boolean} - True if user has all permissions
   */
  const hasAllPermissions = (permissions) => {
    if (!currentUser) return false;
    if (!Array.isArray(permissions)) return false;

    // Use database permissions from user object
    if (currentUser.permissions && Array.isArray(currentUser.permissions)) {
      return permissions.every(permission =>
        currentUser.permissions.some(p => p.permissionKey === permission)
      );
    }

    return false;
  };

  /**
   * Check if current user can approve a specific type of request
   * @param {string} approvalType - Type of approval (e.g., 'finance_transactions')
   * @returns {boolean}
   */
  const canApprove = (approvalType) => {
    if (!currentUser) return false;
    // Convert role name with spaces to role key (e.g., 'Finance Manager' -> 'FINANCE_MANAGER')
    const roleKey = currentUser.role.toUpperCase().replace(/\s+/g, '_');
    return roleCanApprove(roleKey, approvalType);
  };

  /**
   * Get the hierarchy level of the current user
   * @returns {number|null} - Hierarchy level (1=highest, 7=lowest) or null if not found
   */
  const getUserHierarchyLevel = () => {
    if (!currentUser) return null;
    const roleKey = currentUser.role.toUpperCase().replace(/\s+/g, '_');
    const roleInfo = getRoleInfo(roleKey);
    return roleInfo ? roleInfo.level : null;
  };

  /**
   * Check if current user can access a specific department
   * @param {string} department - Department name (e.g., 'Finance', 'HR')
   * @returns {boolean}
   */
  const canAccessDepartment = (department) => {
    if (!currentUser) return false;

    // Admin can access all departments
    if (currentUser.role === 'Admin') return true;

    // BOD and CEO can access all departments
    if (currentUser.role === 'BOD' || currentUser.role === 'CEO') return true;

    // Users can access their own department
    if (currentUser.department === department) return true;

    return false;
  };

  /**
   * Check if current user is subordinate to another role
   * @param {string} superiorRole - Role to check against
   * @returns {boolean}
   */
  const isSubordinateTo = (superiorRole) => {
    if (!currentUser) return false;
    const currentRoleKey = currentUser.role.toUpperCase().replace(/\s+/g, '_');
    const superiorRoleKey = superiorRole.toUpperCase().replace(/\s+/g, '_');
    return isSubordinate(currentRoleKey, superiorRoleKey);
  };

  /**
   * Check if current user can access another user's data
   * @param {string} targetUserRole - Role of the user whose data is being accessed
   * @returns {boolean}
   */
  const canAccessUser = (targetUserRole) => {
    if (!currentUser) return false;
    const currentRoleKey = currentUser.role.toUpperCase().replace(/\s+/g, '_');
    const targetRoleKey = targetUserRole.toUpperCase().replace(/\s+/g, '_');
    return canAccessUserData(currentRoleKey, targetRoleKey);
  };

  /**
   * Get all permissions for the current user
   * @returns {string[]} - Array of permission keys
   */
  const getUserPermissions = () => {
    if (!currentUser) return [];

    // Use database permissions from user object
    if (currentUser.permissions && Array.isArray(currentUser.permissions)) {
      return currentUser.permissions.map(p => p.permissionKey);
    }

    return [];
  };

  /**
   * Check if current user is in a specific role
   * @param {string|string[]} roles - Role or array of roles to check
   * @returns {boolean}
   */
  const hasRole = (roles) => {
    if (!currentUser) return false;
    if (Array.isArray(roles)) {
      return roles.includes(currentUser.role);
    }
    return currentUser.role === roles;
  };

  /**
   * Check if current user is in a management position
   * @returns {boolean}
   */
  const isManager = () => {
    if (!currentUser) return false;
    return currentUser.role.includes('Manager') ||
           currentUser.role === 'CEO' ||
           currentUser.role === 'BOD' ||
           currentUser.role.includes('Director');
  };

  const value = {
    currentUser,
    isLoggedIn,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    // Permission functions
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canApprove,
    // Hierarchy functions
    getUserHierarchyLevel,
    canAccessDepartment,
    isSubordinateTo,
    canAccessUser,
    // Utility functions
    getUserPermissions,
    hasRole,
    isManager
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
