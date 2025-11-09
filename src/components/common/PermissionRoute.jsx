import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * PermissionRoute - A wrapper component for route protection based on permissions and roles
 *
 * Usage Examples:
 *
 * 1. Protect by single permission:
 *    <PermissionRoute permission="orphans:create">
 *      <OrphansPage />
 *    </PermissionRoute>
 *
 * 2. Protect by multiple permissions (user needs ANY one):
 *    <PermissionRoute anyPermissions={['finance:view', 'finance:create']}>
 *      <FinancePage />
 *    </PermissionRoute>
 *
 * 3. Protect by multiple permissions (user needs ALL):
 *    <PermissionRoute allPermissions={['finance:view', 'finance:approve']}>
 *      <FinanceApprovalPage />
 *    </PermissionRoute>
 *
 * 4. Protect by role(s):
 *    <PermissionRoute roles={['Admin', 'CEO', 'Finance Manager']}>
 *      <FinanceReportsPage />
 *    </PermissionRoute>
 *
 * 5. Protect by department:
 *    <PermissionRoute department="Finance">
 *      <FinancePage />
 *    </PermissionRoute>
 *
 * 6. Protect by hierarchy level (user must be at or above this level):
 *    <PermissionRoute maxHierarchyLevel={4}>
 *      <ManagerDashboard />
 *    </PermissionRoute>
 *
 * 7. Combine multiple conditions (all must be true):
 *    <PermissionRoute
 *      permission="finance:view"
 *      department="Finance"
 *      roles={['Finance Manager', 'Finance Officer']}
 *    >
 *      <FinancePage />
 *    </PermissionRoute>
 *
 * 8. Custom fallback (instead of redirecting):
 *    <PermissionRoute
 *      permission="orphans:create"
 *      fallback={<AccessDenied />}
 *    >
 *      <OrphansPage />
 *    </PermissionRoute>
 */

const PermissionRoute = ({
  children,
  permission,
  anyPermissions,
  allPermissions,
  roles,
  department,
  maxHierarchyLevel,
  fallback,
  redirectTo = '/admin/dashboard'
}) => {
  const {
    isLoggedIn,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    canAccessDepartment,
    getUserHierarchyLevel
  } = useAuth();

  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check all permission conditions
  let hasAccess = true;

  // Check single permission
  if (permission && !hasPermission(permission)) {
    hasAccess = false;
  }

  // Check any permissions (user needs at least one)
  if (anyPermissions && !hasAnyPermission(anyPermissions)) {
    hasAccess = false;
  }

  // Check all permissions (user needs all)
  if (allPermissions && !hasAllPermissions(allPermissions)) {
    hasAccess = false;
  }

  // Check roles
  if (roles && !hasRole(roles)) {
    hasAccess = false;
  }

  // Check department access
  if (department && !canAccessDepartment(department)) {
    hasAccess = false;
  }

  // Check hierarchy level (user must be at or above this level)
  // Lower numbers = higher hierarchy (1 = BOD, 7 = Coordinator)
  if (maxHierarchyLevel !== undefined) {
    const userLevel = getUserHierarchyLevel();
    if (userLevel === null || userLevel > maxHierarchyLevel) {
      hasAccess = false;
    }
  }

  // If access denied, show fallback or redirect
  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }

    // Default access denied component
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // User has access, render children
  return children;
};

export default PermissionRoute;
