import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Baby,
  Briefcase,
  DollarSign,
  Users,
  FileText,
  HeartHandshake,
  Shield,
  BarChart,
  Settings,
  Users2,
  ChevronDown,
  ChevronRight,
  Share2,
  FileBarChart,
  FolderKanban,
  Target,
  ClipboardCheck,
  CheckCircle,
  Clock,
  Calendar,
  Award,
  MapPin,
  UserPlus,
  TrendingUp,
  Megaphone,
  Store,
  X,
  UserCheck,
  Wallet,
  Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const location = useLocation();
  const { hasPermission, hasAnyPermission, currentUser } = useAuth();

  console.log('🔍 SIDEBAR - currentUser:', currentUser);
  console.log('🔍 SIDEBAR - currentUser.role:', currentUser?.role);
  console.log('🔍 SIDEBAR - currentUser.permissions:', currentUser?.permissions);

  // Auto-detect which dropdown should be open based on current path
  const getInitialDropdown = () => {
    if (location.pathname.startsWith('/admin/orphans') ||
        location.pathname.startsWith('/admin/coordinators')) return 'orphan care';
    if (location.pathname.startsWith('/admin/partners') ||
        location.pathname.startsWith('/admin/proposals')) return 'fund development';
    if (location.pathname.startsWith('/admin/operations') ||
        location.pathname.startsWith('/admin/projects') ||
        location.pathname.startsWith('/admin/approvals') ||
        location.pathname.startsWith('/admin/compliance')) return 'operations';
    if (location.pathname.startsWith('/admin/finance')) return 'finance';
    if (location.pathname.startsWith('/admin/campaigns') ||
        location.pathname.startsWith('/admin/donations') ||
        location.pathname.startsWith('/admin/job-postings') ||
        location.pathname.startsWith('/admin/vendor-calls')) return 'public engagement';
    if (location.pathname.startsWith('/admin/hr')) return 'human resources';
    return null;
  };

  const [openDropdown, setOpenDropdown] = useState(getInitialDropdown());

  const toggleDropdown = (label) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-blue-600', bgColor: 'bg-blue-50', permission: PERMISSIONS.DASHBOARD_VIEW },
    { path: '/admin/my-dashboard', icon: Activity, label: 'My Dashboard', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    {
      label: 'Orphan Care',
      icon: Baby,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      hasSubmenu: true,
      subItems: [
        { path: '/admin/orphans', icon: Baby, label: 'Orphan Management', color: 'text-pink-600', bgColor: 'bg-pink-50', permission: PERMISSIONS.ORPHANS_VIEW },
        { path: '/admin/coordinators', icon: UserCheck, label: 'Coordinators', color: 'text-pink-600', bgColor: 'bg-pink-50', permission: PERMISSIONS.ORPHANS_VIEW },
      ]
    },
    { path: '/admin/beneficiaries', icon: Users, label: 'Beneficiaries', color: 'text-blue-600', bgColor: 'bg-blue-50', permission: PERMISSIONS.BENEFICIARIES_VIEW },
    {
      label: 'Fund Development',
      icon: Award,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      hasSubmenu: true,
      subItems: [
        { path: '/admin/partners', icon: HeartHandshake, label: 'Partners', color: 'text-emerald-600', bgColor: 'bg-emerald-50', permission: PERMISSIONS.PARTNERS_VIEW },
        { path: '/admin/proposals', icon: FileText, label: 'Proposals', color: 'text-emerald-600', bgColor: 'bg-emerald-50', permission: PERMISSIONS.PROPOSALS_VIEW },
      ]
    },
    {
      label: 'Operations',
      icon: Briefcase,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hasSubmenu: true,
      subItems: [
        { path: '/admin/projects', icon: FolderKanban, label: 'Projects', color: 'text-purple-600', bgColor: 'bg-purple-50', permission: PERMISSIONS.PROJECTS_VIEW },
        { path: '/admin/operations/activities', icon: Target, label: 'Activities', color: 'text-purple-600', bgColor: 'bg-purple-50', permission: PERMISSIONS.OPERATIONS_VIEW_ACTIVITIES },
        { path: '/admin/operations/tasks', icon: ClipboardCheck, label: 'All Tasks', color: 'text-purple-600', bgColor: 'bg-purple-50', permission: PERMISSIONS.OPERATIONS_VIEW_TASKS },
        { path: '/admin/operations/my-tasks', icon: UserCheck, label: 'My Tasks', color: 'text-purple-600', bgColor: 'bg-purple-50', permission: PERMISSIONS.OPERATIONS_VIEW_TASKS },
        { path: '/admin/approvals', icon: CheckCircle, label: 'Approvals', color: 'text-purple-600', bgColor: 'bg-purple-50', permission: PERMISSIONS.APPROVALS_VIEW },
        { path: '/admin/compliance', icon: Shield, label: 'Compliance & Safeguarding', color: 'text-purple-600', bgColor: 'bg-purple-50', permission: PERMISSIONS.COMPLIANCE_VIEW },
      ]
    },
    { path: '/admin/finance', icon: DollarSign, label: 'Finance', color: 'text-green-600', bgColor: 'bg-green-50', permission: PERMISSIONS.FINANCE_VIEW },
    {
      label: 'Public Engagement',
      icon: Megaphone,
      color: 'text-fuchsia-600',
      bgColor: 'bg-fuchsia-50',
      hasSubmenu: true,
      subItems: [
        { path: '/admin/campaigns', icon: Megaphone, label: 'Campaigns', color: 'text-fuchsia-600', bgColor: 'bg-fuchsia-50', permission: PERMISSIONS.CAMPAIGNS_VIEW },
        { path: '/admin/donations', icon: DollarSign, label: 'Donations', color: 'text-fuchsia-600', bgColor: 'bg-fuchsia-50', permission: PERMISSIONS.DONATIONS_VIEW },
        { path: '/admin/job-postings', icon: Briefcase, label: 'Job Postings', color: 'text-fuchsia-600', bgColor: 'bg-fuchsia-50', permission: PERMISSIONS.JOB_POSTINGS_VIEW },
        { path: '/admin/vendor-calls', icon: Store, label: 'Vendor Calls', color: 'text-fuchsia-600', bgColor: 'bg-fuchsia-50', permission: PERMISSIONS.VENDOR_CALLS_VIEW },
      ]
    },
    {
      label: 'Human Resources',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      hasSubmenu: true,
      subItems: [
        { path: '/admin/hr', icon: Users, label: 'HR Overview', color: 'text-orange-600', bgColor: 'bg-orange-50', permission: PERMISSIONS.HR_VIEW },
        { path: '/admin/hr/attendance', icon: Clock, label: 'Attendance', color: 'text-orange-600', bgColor: 'bg-orange-50', permission: PERMISSIONS.HR_VIEW_ATTENDANCE },
        { path: '/admin/hr/onboarding', icon: UserPlus, label: 'Onboarding', color: 'text-orange-600', bgColor: 'bg-orange-50', permission: PERMISSIONS.HR_MANAGE_ONBOARDING },
        { path: '/admin/hr/appraisal', icon: TrendingUp, label: 'Appraisal', color: 'text-orange-600', bgColor: 'bg-orange-50', permission: PERMISSIONS.HR_MANAGE_APPRAISALS },
        { path: '/admin/hr/contracts', icon: FileText, label: 'Contracts', color: 'text-orange-600', bgColor: 'bg-orange-50', permission: PERMISSIONS.HR_MANAGE_CONTRACTS },
        { path: '/admin/hr/payroll', icon: Wallet, label: 'Payroll', color: 'text-orange-600', bgColor: 'bg-orange-50', permission: PERMISSIONS.FINANCE_VIEW_PAYROLL },
      ]
    },
    { path: '/admin/cbo', icon: Users2, label: 'CBO Partners', color: 'text-indigo-600', bgColor: 'bg-indigo-50', permission: PERMISSIONS.CBO_VIEW },
    { path: '/admin/meal', icon: BarChart, label: 'MEAL', color: 'text-teal-600', bgColor: 'bg-teal-50', permission: PERMISSIONS.MEAL_VIEW },
    { path: '/admin/social-media', icon: Share2, label: 'Social Media', color: 'text-sky-600', bgColor: 'bg-sky-50', permission: PERMISSIONS.SOCIAL_MEDIA_VIEW },
    { path: '/admin/reports', icon: FileBarChart, label: 'Reports', color: 'text-amber-600', bgColor: 'bg-amber-50', permission: PERMISSIONS.REPORTS_VIEW },
    { path: '/admin/settings', icon: Settings, label: 'Settings', color: 'text-gray-600', bgColor: 'bg-gray-50', permission: PERMISSIONS.SETTINGS_VIEW },
  ];

  // If no user is logged in, show empty menu
  if (!currentUser) {
    console.log('⚠️ SIDEBAR - No currentUser, showing empty menu');
    return null; // Don't render sidebar if not logged in
  }

  // Check if user has wildcard permission (grants access to everything)
  // Ensure permissions is an array before calling .some()
  const hasWildcardPermission = Array.isArray(currentUser.permissions) &&
    currentUser.permissions.some(p => p.permissionKey === '*');

  console.log('🔍 SIDEBAR - currentUser.permissions:', currentUser?.permissions?.length || 0, 'permissions');
  console.log('🔍 SIDEBAR - hasWildcardPermission:', hasWildcardPermission);
  console.log('🔍 SIDEBAR - Will filter menu items:', !hasWildcardPermission);

  // Filter menu items based on user permissions
  // If user has wildcard permission (*), show all items
  const filteredMenuItems = hasWildcardPermission ? menuItems : menuItems.filter((item) => {
    if (item.hasSubmenu) {
      // Filter sub-items and only show the parent if at least one sub-item is accessible
      const accessibleSubItems = item.subItems.filter((subItem) =>
        hasPermission(subItem.permission)
      );
      if (accessibleSubItems.length > 0) {
        // Return item with filtered sub-items
        item.subItems = accessibleSubItems;
        return true;
      }
      return false;
    } else {
      // For regular items, check if user has permission
      return hasPermission(item.permission);
    }
  });

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (closeSidebar) {
      closeSidebar();
    }
  }, [location.pathname]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-gray-200 h-full overflow-y-auto
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile Close Button */}
        <div className="lg:hidden flex justify-end p-4 border-b border-gray-200">
          <button
            onClick={closeSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="py-4 px-3">
        <div className="space-y-1">
          {filteredMenuItems.map((item, index) => {
            if (item.hasSubmenu) {
              // Dropdown menu item (Operations)
              const isAnySubItemActive = item.subItems.some(subItem => location.pathname === subItem.path);
              const isOpen = openDropdown === item.label.toLowerCase();

              return (
                <div key={index}>
                  <button
                    onClick={() => toggleDropdown(item.label.toLowerCase())}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isAnySubItemActive
                        ? `${item.bgColor} ${item.color} shadow-sm font-semibold`
                        : 'text-gray-700 hover:bg-gray-50 font-medium'
                    }`}
                  >
                    <div className={`transition-transform duration-200 ${isAnySubItemActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                      <item.icon size={20} />
                    </div>
                    <span className="flex-1 text-left">{item.label}</span>
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {/* Sub-menu items */}
                  {isOpen && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
                      {item.subItems.map((subItem) => (
                        <NavLink
                          key={subItem.path}
                          to={subItem.path}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 group ${
                              isActive
                                ? `${subItem.bgColor} ${subItem.color} shadow-sm font-semibold`
                                : 'text-gray-600 hover:bg-gray-50 font-medium'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                                <subItem.icon size={18} />
                              </div>
                              <span className="text-sm">{subItem.label}</span>
                              {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
                              )}
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            } else {
              // Regular menu item
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? `${item.bgColor} ${item.color} shadow-sm font-semibold`
                        : 'text-gray-700 hover:bg-gray-50 font-medium'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                        <item.icon size={20} />
                      </div>
                      <span>{item.label}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
                      )}
                    </>
                  )}
                </NavLink>
              );
            }
          })}
        </div>
      </nav>
      </div>
    </>
  );
};

export default Sidebar;
