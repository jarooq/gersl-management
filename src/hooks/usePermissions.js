import { useAuth } from '../contexts/AuthContext';
import { hasPermission, hasAnyPermission, hasAllPermissions, isAdmin, isCEO, canApprove } from '../utils/permissions';

/**
 * Custom hook to check user permissions
 * @returns {object} Permission checking functions
 */
export const usePermissions = () => {
  const { currentUser } = useAuth();

  return {
    /**
     * Check if user has a specific permission
     * @param {string} permission - Permission to check
     * @returns {boolean}
     */
    hasPermission: (permission) => hasPermission(currentUser, permission),

    /**
     * Check if user has any of the specified permissions
     * @param {string[]} permissions - Array of permissions
     * @returns {boolean}
     */
    hasAnyPermission: (permissions) => hasAnyPermission(currentUser, permissions),

    /**
     * Check if user has all specified permissions
     * @param {string[]} permissions - Array of permissions
     * @returns {boolean}
     */
    hasAllPermissions: (permissions) => hasAllPermissions(currentUser, permissions),

    /**
     * Check if user is admin
     * @returns {boolean}
     */
    isAdmin: () => isAdmin(currentUser),

    /**
     * Check if user is CEO
     * @returns {boolean}
     */
    isCEO: () => isCEO(currentUser),

    /**
     * Check if user can approve high-level items
     * @returns {boolean}
     */
    canApprove: () => canApprove(currentUser),

    /**
     * Get current user
     * @returns {object|null}
     */
    currentUser,
  };
};

/**
 * Component wrapper for permission-based rendering
 * Usage: <PermissionGate permission="orphans:create">...</PermissionGate>
 */
export const PermissionGate = ({ children, permission, permissions, requireAll = false, fallback = null }) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && requireAll) {
    hasAccess = hasAllPermissions(permissions);
  } else if (permissions) {
    hasAccess = hasAnyPermission(permissions);
  }

  return hasAccess ? children : fallback;
};
