import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Baby, Briefcase, DollarSign, Users, FileText, HeartHandshake,
  Shield, BarChart, Settings, Users2, ChevronDown, ChevronRight, Share2,
  FileBarChart, FolderKanban, Target, ClipboardCheck, CheckCircle, Clock,
  Award, MapPin, UserPlus, Megaphone, Store, X,
  UserCheck, Wallet, Activity, ShoppingCart, Droplets,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';

// === GERSL Sidebar v3 — HubSpot console shell ===
//
// Visual rules:
//   - Background: hs-navy-700 (HubSpot dark navy).
//   - Body text: hs-slate-200 → white on hover.
//   - Active item: white text + hs-navy-800 fill + 3px orange-500 left border.
//   - Icons: hs-slate-400 → orange-400 when active.

const Sidebar = ({ isOpen, closeSidebar }) => {
  const location = useLocation();
  const { hasPermission, currentUser } = useAuth();

  const getInitialDropdown = () => {
    if (location.pathname.startsWith('/admin/orphans') ||
        location.pathname.startsWith('/admin/coordinators')) return 'programmes';
    if (location.pathname.startsWith('/admin/partners') ||
        location.pathname.startsWith('/admin/proposals')) return 'fund development';
    if (location.pathname.startsWith('/admin/operations') ||
        location.pathname.startsWith('/admin/projects') ||
        location.pathname.startsWith('/admin/approvals') ||
        location.pathname.startsWith('/admin/compliance')) return 'operations';
    if (location.pathname.startsWith('/admin/campaigns') ||
        location.pathname.startsWith('/admin/donations') ||
        location.pathname.startsWith('/admin/job-postings') ||
        location.pathname.startsWith('/admin/vendor-calls')) return 'public engagement';
    if (location.pathname.startsWith('/admin/hr')) return 'human resources';
    if (location.pathname.startsWith('/admin/procurement')) return 'procurement';
    return null;
  };

  const [openDropdown, setOpenDropdown] = useState(getInitialDropdown());
  const toggleDropdown = (label) => setOpenDropdown(openDropdown === label ? null : label);

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: PERMISSIONS.DASHBOARD_VIEW },
    { path: '/admin/my-dashboard', icon: Activity, label: 'My Dashboard', showOnlyWithoutPermission: PERMISSIONS.DASHBOARD_VIEW },
    {
      label: 'Programmes', icon: Award, hasSubmenu: true,
      subItems: [
        { path: '/admin/orphans',      icon: Baby,      label: 'Orphan Care',   permission: PERMISSIONS.ORPHANS_VIEW },
        { path: '/admin/wash',         icon: Droplets,  label: 'WASH' },
        { path: '/admin/igp',          icon: Briefcase, label: 'IGP' },
        { path: '/admin/coordinators', icon: UserCheck, label: 'Coordinators',  permission: PERMISSIONS.ORPHANS_VIEW },
      ]
    },
    { path: '/admin/beneficiaries', icon: Users, label: 'Beneficiaries', permission: PERMISSIONS.BENEFICIARIES_VIEW },
    { path: '/admin/map', icon: MapPin, label: 'Beneficiary Map' },
    {
      label: 'Fund Development', icon: HeartHandshake, hasSubmenu: true,
      subItems: [
        { path: '/admin/partners',  icon: HeartHandshake, label: 'Partners',  permission: PERMISSIONS.PARTNERS_VIEW },
        { path: '/admin/proposals', icon: FileText,       label: 'Proposals', permission: PERMISSIONS.PROPOSALS_VIEW },
      ]
    },
    {
      label: 'Operations', icon: Briefcase, hasSubmenu: true,
      subItems: [
        { path: '/admin/projects',                  icon: FolderKanban,    label: 'Projects',                permission: PERMISSIONS.PROJECTS_VIEW },
        { path: '/admin/operations/activities',     icon: Target,          label: 'Activities',              permission: PERMISSIONS.OPERATIONS_VIEW_ACTIVITIES },
        { path: '/admin/operations/tasks',          icon: ClipboardCheck,  label: 'All Tasks',               permission: PERMISSIONS.OPERATIONS_VIEW_TASKS },
        { path: '/admin/operations/my-tasks',       icon: UserCheck,       label: 'My Tasks' },
        { path: '/admin/operations/field-visits',   icon: MapPin,          label: 'Field Visits' },
        { path: '/admin/operations/movements',      icon: MapPin,          label: 'Movement Register' },
        { path: '/admin/operations/fuel-claims',    icon: DollarSign,      label: 'Fuel Claims' },
        { path: '/admin/operations/fuel-rates',     icon: Settings,        label: 'Fuel Rates' },
        { path: '/admin/approvals',                 icon: CheckCircle,     label: 'Approvals',               permission: PERMISSIONS.APPROVALS_VIEW },
        { path: '/admin/compliance',                icon: Shield,          label: 'Compliance & Safeguarding', permission: PERMISSIONS.COMPLIANCE_VIEW },
      ]
    },
    { path: '/admin/finance', icon: DollarSign, label: 'Finance', permission: PERMISSIONS.FINANCE_VIEW },
    {
      label: 'Public Engagement', icon: Megaphone, hasSubmenu: true,
      subItems: [
        { path: '/admin/campaigns',    icon: Megaphone, label: 'Campaigns',    permission: PERMISSIONS.CAMPAIGNS_VIEW },
        { path: '/admin/job-postings', icon: Briefcase, label: 'Job Postings', permission: PERMISSIONS.JOB_POSTINGS_VIEW },
        { path: '/admin/vendor-calls', icon: Store,     label: 'Vendor Calls', permission: PERMISSIONS.VENDOR_CALLS_VIEW },
      ]
    },
    {
      label: 'Procurement', icon: ShoppingCart, hasSubmenu: true,
      subItems: [
        { path: '/admin/procurement/dashboard', icon: BarChart,       label: 'Dashboard', permission: PERMISSIONS.PROCUREMENT_DASHBOARD_VIEW },
        { path: '/admin/procurement/inbox',     icon: ClipboardCheck, label: 'Inbox',     permission: PERMISSIONS.PROCUREMENT_REQUEST_VIEW },
        { path: '/admin/procurement/vendors',   icon: Store,          label: 'Vendors',   permission: PERMISSIONS.PROCUREMENT_VENDOR_VIEW },
      ]
    },
    {
      label: 'Human Resources', icon: Users, hasSubmenu: true,
      subItems: [
        { path: '/admin/hr',                  icon: Users,          label: 'HR Overview',     permission: PERMISSIONS.HR_VIEW },
        { path: '/admin/hr/attendance',       icon: Clock,          label: 'Attendance',      permission: PERMISSIONS.HR_VIEW_ATTENDANCE },
        { path: '/staff-register',            icon: UserPlus,       label: 'Register Staff',  permission: PERMISSIONS.HR_VIEW },
        { path: '/admin/hr/onboarding',       icon: UserPlus,       label: 'Onboarding',      permission: PERMISSIONS.HR_MANAGE_ONBOARDING },
        { path: '/admin/hr/weekly-hours',     icon: Clock,          label: 'Weekly Hours',    permission: PERMISSIONS.HR_VIEW },
        { path: '/admin/hr/payroll',          icon: Wallet,         label: 'Payroll',         permission: PERMISSIONS.FINANCE_VIEW_PAYROLL },
        { path: '/admin/hr/salary-advances',  icon: DollarSign,     label: 'Salary Advances', permission: PERMISSIONS.HR_VIEW },
        { path: '/admin/hr/staff-expenses',   icon: ClipboardCheck, label: 'Staff Expenses',  permission: PERMISSIONS.HR_VIEW },
      ]
    },
    { path: '/admin/cbo',          icon: Users2,      label: 'CBO Partners',  permission: PERMISSIONS.CBO_VIEW },
    { path: '/admin/meal',         icon: BarChart,    label: 'MEAL',          permission: PERMISSIONS.MEAL_VIEW },
    { path: '/admin/social-media', icon: Share2,      label: 'Social Media',  permission: PERMISSIONS.SOCIAL_MEDIA_VIEW },
    { path: '/admin/announcements',icon: Megaphone,   label: 'Announcements' },
    { path: '/admin/reports',      icon: FileBarChart,label: 'Reports',       permission: PERMISSIONS.REPORTS_VIEW },
    { path: '/admin/settings',     icon: Settings,    label: 'Settings',      permission: PERMISSIONS.SETTINGS_VIEW },
  ];

  if (!currentUser) return null;

  const hasWildcard = Array.isArray(currentUser.permissions) &&
    currentUser.permissions.some(p => p.permissionKey === '*');

  const filteredMenuItems = hasWildcard ? menuItems : menuItems.filter((item) => {
    if (item.hasSubmenu) {
      const accessible = item.subItems.filter((s) => !s.permission || hasPermission(s.permission));
      if (accessible.length > 0) { item.subItems = accessible; return true; }
      return false;
    }
    if (item.showOnlyWithoutPermission) return !hasPermission(item.showOnlyWithoutPermission);
    return !item.permission || hasPermission(item.permission);
  });

  useEffect(() => { if (closeSidebar) closeSidebar(); }, [location.pathname]); // eslint-disable-line

  const activeRow   = 'bg-hs-navy-800 text-white border-l-[3px] border-orange-500';
  const inactiveRow = 'text-hs-slate-200 hover:bg-hs-navy-800/70 hover:text-white border-l-[3px] border-transparent';
  const activeSub   = 'bg-hs-navy-800 text-white border-l-2 border-orange-500';
  const inactiveSub = 'text-hs-slate-300 hover:bg-hs-navy-800/50 hover:text-white border-l-2 border-transparent';

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={closeSidebar} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-60 h-screen flex flex-col
        bg-hs-navy-700 text-hs-slate-200
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-hs-navy-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-md bg-white flex items-center justify-center shrink-0">
              <img src="/Logo.png" alt="GERSL" className="h-7 w-7 object-contain" />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-[13px] font-display font-semibold text-white truncate">GERSL</p>
              <p className="text-[10px] text-orange-400 truncate">Management Console</p>
            </div>
          </div>
          <button onClick={closeSidebar}
            className="lg:hidden p-1.5 rounded-md text-hs-slate-300 hover:bg-hs-navy-800 hover:text-white shrink-0">
            <X size={18} />
          </button>
        </div>

        <nav className="py-2 px-2 space-y-0.5 flex-1 overflow-y-auto">
          {filteredMenuItems.map((item, index) => {
            if (item.hasSubmenu) {
              const isActive = item.subItems.some(sub => location.pathname === sub.path);
              const isOpen2 = openDropdown === item.label.toLowerCase();
              return (
                <div key={index}>
                  <button
                    onClick={() => toggleDropdown(item.label.toLowerCase())}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-r-md text-[13px] font-medium transition ${
                      isActive ? activeRow : inactiveRow
                    }`}
                  >
                    <item.icon size={16} className={isActive ? 'text-orange-400' : 'text-hs-slate-400'} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isOpen2
                      ? <ChevronDown size={13} className="text-hs-slate-400" />
                      : <ChevronRight size={13} className="text-hs-slate-500" />}
                  </button>
                  {isOpen2 && (
                    <div className="mt-0.5 mb-1 space-y-0.5">
                      {item.subItems.map((sub) => (
                        <NavLink
                          key={sub.path}
                          to={sub.path}
                          className={({ isActive: a }) =>
                            `flex items-center gap-2.5 pl-9 pr-3 py-1.5 rounded-r-md text-[12.5px] transition ${
                              a ? activeSub : inactiveSub
                            }`
                          }
                        >
                          {({ isActive: a }) => (
                            <>
                              <sub.icon size={13} className={a ? 'text-orange-400' : 'text-hs-slate-400'} />
                              <span>{sub.label}</span>
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-r-md text-[13px] font-medium transition ${
                    isActive ? activeRow : inactiveRow
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={16} className={isActive ? 'text-orange-400' : 'text-hs-slate-400'} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-4 py-2.5 border-t border-hs-navy-800 shrink-0">
          <p className="text-[10px] text-hs-slate-400 leading-relaxed">
            Serving with compassion since 2015
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
