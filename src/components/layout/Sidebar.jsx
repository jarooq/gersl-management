import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Baby, Briefcase, DollarSign, Users, FileText, HeartHandshake,
  Shield, BarChart, Settings, Users2, ChevronDown, ChevronRight, Share2,
  FileBarChart, FolderKanban, Target, ClipboardCheck, CheckCircle, Clock,
  Calendar, Award, MapPin, UserPlus, TrendingUp, Megaphone, Store, X,
  UserCheck, Wallet, Activity, ShoppingCart, Droplets,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';

// === GERSL Sidebar v2 — navy shell, ink text, mission-amber active accent ===
//
// Visual rules:
//   - Background: navy-900 with a subtle vertical gradient down to navy-800.
//   - Body text: ink-100 → navy-50 on hover.
//   - Active item: white text + navy-700 fill + 3px mission-500 left border.
//   - Module icons keep their semantic colour but at lower saturation
//     (text-mission-300, text-success-400 etc.) to read on a dark bg.

const Sidebar = ({ isOpen, closeSidebar }) => {
  const location = useLocation();
  const { hasPermission, currentUser } = useAuth();

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
    if (location.pathname.startsWith('/admin/procurement')) return 'procurement';
    return null;
  };

  const [openDropdown, setOpenDropdown] = useState(getInitialDropdown());
  const toggleDropdown = (label) => setOpenDropdown(openDropdown === label ? null : label);

  // Module icon tints — subtle, work on dark bg.
  const ICON = {
    blue:    'text-primary-300',
    pink:    'text-pink-300',
    emerald: 'text-emerald-300',
    purple:  'text-violet-300',
    green:   'text-emerald-300',
    fuchsia: 'text-fuchsia-300',
    amber:   'text-mission-300',
    orange:  'text-mission-300',
    indigo:  'text-indigo-300',
    teal:    'text-teal-300',
    sky:     'text-sky-300',
    gray:    'text-ink-300',
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', icc: ICON.blue, permission: PERMISSIONS.DASHBOARD_VIEW },
    { path: '/admin/my-dashboard', icon: Activity, label: 'My Dashboard', icc: ICON.indigo, showOnlyWithoutPermission: PERMISSIONS.DASHBOARD_VIEW },
    {
      label: 'Programmes', icon: Award, icc: ICON.pink, hasSubmenu: true,
      subItems: [
        { path: '/admin/orphans',      icon: Baby,      label: 'Orphan Care',   icc: ICON.pink, permission: PERMISSIONS.ORPHANS_VIEW },
        { path: '/admin/wash',         icon: Droplets,  label: 'WASH',          icc: ICON.sky },
        { path: '/admin/igp',          icon: Briefcase, label: 'IGP',           icc: ICON.emerald },
        { path: '/admin/coordinators', icon: UserCheck, label: 'Coordinators',  icc: ICON.pink, permission: PERMISSIONS.ORPHANS_VIEW },
      ]
    },
    { path: '/admin/beneficiaries', icon: Users, label: 'Beneficiaries', icc: ICON.blue, permission: PERMISSIONS.BENEFICIARIES_VIEW },
    { path: '/admin/map', icon: MapPin, label: 'Beneficiary Map', icc: ICON.sky },
    {
      label: 'Fund Development', icon: Award, icc: ICON.emerald, hasSubmenu: true,
      subItems: [
        { path: '/admin/partners', icon: HeartHandshake, label: 'Partners', icc: ICON.emerald, permission: PERMISSIONS.PARTNERS_VIEW },
        { path: '/admin/proposals', icon: FileText, label: 'Proposals', icc: ICON.emerald, permission: PERMISSIONS.PROPOSALS_VIEW },
      ]
    },
    {
      label: 'Operations', icon: Briefcase, icc: ICON.purple, hasSubmenu: true,
      subItems: [
        { path: '/admin/projects', icon: FolderKanban, label: 'Projects', icc: ICON.purple, permission: PERMISSIONS.PROJECTS_VIEW },
        { path: '/admin/operations/activities', icon: Target, label: 'Activities', icc: ICON.purple, permission: PERMISSIONS.OPERATIONS_VIEW_ACTIVITIES },
        { path: '/admin/operations/tasks', icon: ClipboardCheck, label: 'All Tasks', icc: ICON.purple, permission: PERMISSIONS.OPERATIONS_VIEW_TASKS },
        { path: '/admin/operations/my-tasks', icon: UserCheck, label: 'My Tasks', icc: ICON.purple },
        { path: '/admin/operations/field-visits', icon: MapPin, label: 'Field Visits', icc: ICON.purple },
        { path: '/admin/operations/movements', icon: MapPin, label: 'Movement Register', icc: ICON.purple },
        { path: '/admin/operations/fuel-claims', icon: DollarSign, label: 'Fuel Claims', icc: ICON.purple },
        { path: '/admin/operations/fuel-rates', icon: Settings, label: 'Fuel Rates', icc: ICON.purple },
        { path: '/admin/approvals', icon: CheckCircle, label: 'Approvals', icc: ICON.purple, permission: PERMISSIONS.APPROVALS_VIEW },
        { path: '/admin/compliance', icon: Shield, label: 'Compliance & Safeguarding', icc: ICON.purple, permission: PERMISSIONS.COMPLIANCE_VIEW },
      ]
    },
    { path: '/admin/finance', icon: DollarSign, label: 'Finance', icc: ICON.green, permission: PERMISSIONS.FINANCE_VIEW },
    { path: '/admin/finance/cash/accounts', icon: Wallet, label: 'Cash Accounts', icc: ICON.green, permission: PERMISSIONS.CASH_ACCOUNTS_VIEW },
    { path: '/admin/finance/cash/replenishments', icon: HeartHandshake, label: 'Cash Replenishments', icc: ICON.green, permission: PERMISSIONS.CASH_REPLENISHMENT_REQUEST },
    {
      label: 'Public Engagement', icon: Megaphone, icc: ICON.fuchsia, hasSubmenu: true,
      subItems: [
        { path: '/admin/campaigns', icon: Megaphone, label: 'Campaigns', icc: ICON.fuchsia, permission: PERMISSIONS.CAMPAIGNS_VIEW },
        { path: '/admin/job-postings', icon: Briefcase, label: 'Job Postings', icc: ICON.fuchsia, permission: PERMISSIONS.JOB_POSTINGS_VIEW },
        { path: '/admin/vendor-calls', icon: Store, label: 'Vendor Calls', icc: ICON.fuchsia, permission: PERMISSIONS.VENDOR_CALLS_VIEW },
      ]
    },
    {
      label: 'Procurement', icon: ShoppingCart, icc: ICON.amber, hasSubmenu: true,
      subItems: [
        { path: '/admin/procurement/dashboard', icon: BarChart, label: 'Dashboard', icc: ICON.amber, permission: PERMISSIONS.PROCUREMENT_DASHBOARD_VIEW },
        { path: '/admin/procurement/inbox', icon: ClipboardCheck, label: 'Inbox', icc: ICON.amber, permission: PERMISSIONS.PROCUREMENT_REQUEST_VIEW },
        { path: '/admin/procurement/vendors', icon: Store, label: 'Vendors', icc: ICON.amber, permission: PERMISSIONS.PROCUREMENT_VENDOR_VIEW },
      ]
    },
    {
      label: 'Human Resources', icon: Users, icc: ICON.orange, hasSubmenu: true,
      subItems: [
        { path: '/admin/hr', icon: Users, label: 'HR Overview', icc: ICON.orange, permission: PERMISSIONS.HR_VIEW },
        { path: '/admin/hr/attendance', icon: Clock, label: 'Attendance', icc: ICON.orange, permission: PERMISSIONS.HR_VIEW_ATTENDANCE },
        { path: '/staff-register', icon: UserPlus, label: 'Register Staff', icc: ICON.orange, permission: PERMISSIONS.HR_VIEW },
        { path: '/admin/hr/onboarding', icon: UserPlus, label: 'Onboarding', icc: ICON.orange, permission: PERMISSIONS.HR_MANAGE_ONBOARDING },
        { path: '/admin/hr/payroll', icon: Wallet, label: 'Payroll', icc: ICON.orange, permission: PERMISSIONS.FINANCE_VIEW_PAYROLL },
        { path: '/admin/hr/salary-advances', icon: DollarSign, label: 'Salary Advances', icc: ICON.orange, permission: PERMISSIONS.HR_VIEW },
        { path: '/admin/hr/staff-expenses', icon: ClipboardCheck, label: 'Staff Expenses', icc: ICON.orange, permission: PERMISSIONS.HR_VIEW },
      ]
    },
    { path: '/admin/cbo', icon: Users2, label: 'CBO Partners', icc: ICON.indigo, permission: PERMISSIONS.CBO_VIEW },
    { path: '/admin/meal', icon: BarChart, label: 'MEAL', icc: ICON.teal, permission: PERMISSIONS.MEAL_VIEW },
    { path: '/admin/social-media', icon: Share2, label: 'Social Media', icc: ICON.sky, permission: PERMISSIONS.SOCIAL_MEDIA_VIEW },
    { path: '/admin/announcements', icon: Megaphone, label: 'Announcements', icc: ICON.pink },
    { path: '/admin/reports', icon: FileBarChart, label: 'Reports', icc: ICON.amber, permission: PERMISSIONS.REPORTS_VIEW },
    { path: '/admin/settings', icon: Settings, label: 'Settings', icc: ICON.gray, permission: PERMISSIONS.SETTINGS_VIEW },
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

  // Active row classes — used for both top-level and sub-items.
  const activeRow   = 'bg-navy-700 text-white shadow-card border-l-[3px] border-mission-500';
  const inactiveRow = 'text-ink-100 hover:bg-navy-800 hover:text-white border-l-[3px] border-transparent';
  const activeSub   = 'bg-navy-800 text-white border-l-2 border-mission-500';
  const inactiveSub = 'text-ink-200 hover:bg-navy-800/50 hover:text-white border-l-2 border-transparent';

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={closeSidebar} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 h-screen flex flex-col
        bg-navy-900 text-ink-100
        border-r border-navy-900
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand block — always visible, sits above nav */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-navy-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src="/Logo.png" alt="Global Ehsan Relief" className="h-9 w-9 object-contain shrink-0" />
            <div className="min-w-0 leading-tight">
              <p className="text-[13px] font-semibold text-white truncate">Global Ehsan Relief</p>
              <p className="text-[10px] text-mission-300 truncate">Sri Lanka · Management</p>
            </div>
          </div>
          <button onClick={closeSidebar}
            className="lg:hidden p-1.5 rounded-md text-ink-200 hover:bg-navy-800 hover:text-white shrink-0">
            <X size={18} />
          </button>
        </div>

        <nav className="py-3 px-2.5 space-y-0.5 flex-1 overflow-y-auto">
          {filteredMenuItems.map((item, index) => {
            if (item.hasSubmenu) {
              const isActive = item.subItems.some(sub => location.pathname === sub.path);
              const isOpen2 = openDropdown === item.label.toLowerCase();
              return (
                <div key={index}>
                  <button
                    onClick={() => toggleDropdown(item.label.toLowerCase())}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-r-md text-sm font-medium transition ${
                      isActive ? activeRow : inactiveRow
                    }`}
                  >
                    <item.icon size={18} className={isActive ? 'text-mission-300' : item.icc} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isOpen2 ? <ChevronDown size={14} className="text-ink-300" /> : <ChevronRight size={14} className="text-ink-400" />}
                  </button>
                  {isOpen2 && (
                    <div className="mt-0.5 mb-1 space-y-0.5">
                      {item.subItems.map((sub) => (
                        <NavLink
                          key={sub.path}
                          to={sub.path}
                          className={({ isActive: a }) =>
                            `flex items-center gap-3 pl-9 pr-3 py-1.5 rounded-r-md text-[13px] transition ${
                              a ? activeSub : inactiveSub
                            }`
                          }
                        >
                          {({ isActive: a }) => (
                            <>
                              <sub.icon size={14} className={a ? 'text-mission-300' : sub.icc} />
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
                  `flex items-center gap-3 px-3 py-2 rounded-r-md text-sm font-medium transition ${
                    isActive ? activeRow : inactiveRow
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={18} className={isActive ? 'text-mission-300' : item.icc} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer — mission credo (sticky at bottom) */}
        <div className="px-5 py-3 border-t border-navy-800 shrink-0">
          <p className="text-[10px] text-ink-400 leading-relaxed">
            Serving with compassion since 2015
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
