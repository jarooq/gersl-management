import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';

/**
 * Smart Dashboard Redirect Component
 * Redirects users to the appropriate dashboard based on their permissions:
 * - Users with dashboard:view permission → Main Dashboard (organization-wide overview)
 * - Regular staff without dashboard:view → My Dashboard (personal productivity)
 */
const DashboardRedirect = () => {
  const { hasPermission, loading } = useAuth();

  // Show loading state while checking permissions
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-ink-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user has access to main dashboard
  const canViewMainDashboard = hasPermission(PERMISSIONS.DASHBOARD_VIEW);

  console.log('🔄 DashboardRedirect - canViewMainDashboard:', canViewMainDashboard);

  // Redirect to appropriate dashboard
  if (canViewMainDashboard) {
    console.log('✅ Redirecting to main dashboard');
    return <Navigate to="/admin/dashboard" replace />;
  } else {
    console.log('✅ Redirecting to my dashboard (staff)');
    return <Navigate to="/admin/my-dashboard" replace />;
  }
};

export default DashboardRedirect;
