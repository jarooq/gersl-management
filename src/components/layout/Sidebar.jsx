import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Baby, Briefcase, DollarSign, Users, FileText, HeartHandshake,
  Shield, BarChart, Settings, Users2, Share2, FileBarChart, FolderKanban,
  Target, ClipboardCheck, CheckCircle, Clock, Award, MapPin, UserPlus,
  Megaphone, Store, X, UserCheck, Wallet, Activity, ShoppingCart, Droplets,
  Building2, Edit, HandCoins, Package, Receipt, BarChart3, ArrowLeft, ChevronRight,
  Sparkles, Bell, Database, Globe, Palette, Key, Users2 as UsersGroupIcon,
  Activity as ActivityIcon, FileBarChart as FileBarChartIcon, Target as TargetIcon,
  MessageSquare, Lightbulb, Zap, FileCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';

// === GERSL Sidebar v4 — HubSpot-style module consoles ===
//
// Two modes:
//   1) Admin mode  — the main app menu (Dashboard, module entries, tools).
//   2) Console mode — when the user is inside a module (Finance, HR, etc.),
//      the sidebar swaps to that module's sections + a "Back to Admin" pill
//      at the bottom. No double-column secondary sidebar — the console IS
//      the sidebar.
//
// A module's console is defined by:
//   - matches(pathname): does the current route belong to this console?
//   - entry: URL to open when the user picks the module from admin mode
//   - sections: list of { path, label, icon, permission?, group? }
//
// For Finance (a single tabbed page), sections use ?section=xxx so the
// FinancePage can read the section from URL search params.

// ------------------------------------------------------------------
// CONSOLE DEFINITIONS
// ------------------------------------------------------------------
const CONSOLES = [
  {
    key: 'programmes',
    title: 'Programmes',
    subtitle: 'Aid delivery',
    icon: Award,
    matches: (p) =>
      p.startsWith('/admin/orphans') ||
      p.startsWith('/admin/wash') ||
      p.startsWith('/admin/igp') ||
      p.startsWith('/admin/coordinators'),
    entry: '/admin/orphans',
    sections: [
      { path: '/admin/orphans',      label: 'Orphan Care',  icon: Baby,      permission: PERMISSIONS.ORPHANS_VIEW },
      { path: '/admin/wash',         label: 'WASH',         icon: Droplets },
      { path: '/admin/igp',          label: 'IGP',          icon: Briefcase },
      { path: '/admin/coordinators', label: 'Coordinators', icon: UserCheck, permission: PERMISSIONS.ORPHANS_VIEW },
    ],
  },
  {
    key: 'fund-dev',
    title: 'Fund Development',
    subtitle: 'Grants & partners',
    icon: HeartHandshake,
    matches: (p) => p.startsWith('/admin/partners') || p.startsWith('/admin/proposals'),
    entry: '/admin/partners',
    sections: [
      { path: '/admin/partners',  label: 'Partners',  icon: HeartHandshake, permission: PERMISSIONS.PARTNERS_VIEW },
      { path: '/admin/proposals', label: 'Proposals', icon: FileText,       permission: PERMISSIONS.PROPOSALS_VIEW },
    ],
  },
  {
    key: 'operations',
    title: 'Operations',
    subtitle: 'Projects & compliance',
    icon: Briefcase,
    matches: (p) =>
      p.startsWith('/admin/operations') ||
      p.startsWith('/admin/projects') ||
      p.startsWith('/admin/approvals') ||
      p.startsWith('/admin/compliance'),
    entry: '/admin/projects',
    sections: [
      { path: '/admin/projects',                  label: 'Projects',            icon: FolderKanban,   permission: PERMISSIONS.PROJECTS_VIEW,               group: 'Delivery' },
      { path: '/admin/operations/activities',     label: 'Activities',          icon: Target,         permission: PERMISSIONS.OPERATIONS_VIEW_ACTIVITIES,  group: 'Delivery' },
      { path: '/admin/operations/tasks',          label: 'All Tasks',           icon: ClipboardCheck, permission: PERMISSIONS.OPERATIONS_VIEW_TASKS,       group: 'Work' },
      { path: '/admin/operations/my-tasks',       label: 'My Tasks',            icon: UserCheck,      group: 'Work' },
      { path: '/admin/operations/field-visits',   label: 'Field Visits',        icon: MapPin,         group: 'Field' },
      { path: '/admin/operations/movements',      label: 'Movement Register',   icon: MapPin,         group: 'Field' },
      { path: '/admin/operations/fuel-claims',    label: 'Fuel Claims',         icon: DollarSign,     group: 'Field' },
      { path: '/admin/operations/fuel-rates',     label: 'Fuel Rates',          icon: Settings,       group: 'Field' },
      { path: '/admin/approvals',                 label: 'Approvals',           icon: CheckCircle,    permission: PERMISSIONS.APPROVALS_VIEW,              group: 'Governance' },
      { path: '/admin/compliance',                label: 'Compliance',          icon: Shield,         permission: PERMISSIONS.COMPLIANCE_VIEW,             group: 'Governance' },
    ],
  },
  {
    key: 'finance',
    title: 'Finance',
    subtitle: 'Accounting & control',
    icon: DollarSign,
    matches: (p) => p.startsWith('/admin/finance'),
    entry: '/admin/finance',
    sections: [
      { path: '/admin/finance?section=dashboard',     label: 'Dashboard',         icon: LayoutDashboard, group: 'Overview',    permission: PERMISSIONS.FINANCE_VIEW },
      { path: '/admin/finance?section=accounts',      label: 'Chart of Accounts', icon: Building2,       group: 'Ledger',      permission: PERMISSIONS.FINANCE_VIEW },
      { path: '/admin/finance?section=journal',       label: 'Journal Entries',   icon: Edit,            group: 'Ledger',      permission: PERMISSIONS.FINANCE_VIEW },
      { path: '/admin/finance?section=grants',        label: 'Grant Receivables', icon: HandCoins,       group: 'Receivables', permission: PERMISSIONS.FINANCE_VIEW },
      { path: '/admin/finance?section=invoices',      label: 'Invoices',          icon: FileText,        group: 'Receivables', permission: PERMISSIONS.FINANCE_VIEW },
      { path: '/admin/finance?section=bills',         label: 'Bills & Payments',  icon: Receipt,         group: 'Payables',    permission: PERMISSIONS.FINANCE_VIEW },
      { path: '/admin/finance?section=bank',          label: 'Bank Accounts',     icon: Wallet,          group: 'Banking',     permission: PERMISSIONS.FINANCE_VIEW },
      { path: '/admin/finance?section=fixed-assets',  label: 'Fixed Assets',      icon: Package,         group: 'Assets',      permission: PERMISSIONS.FINANCE_VIEW },
      { path: '/admin/finance?section=reports',       label: 'Financial Reports', icon: BarChart3,       group: 'Reporting',   permission: PERMISSIONS.FINANCE_VIEW },
      { path: '/admin/finance/cash/accounts',         label: 'Cash Accounts',     icon: Wallet,          group: 'Cash',        permission: PERMISSIONS.CASH_ACCOUNTS_VIEW },
      { path: '/admin/finance/cash/replenishments',   label: 'Cash Replenishments', icon: HeartHandshake, group: 'Cash',       permission: PERMISSIONS.CASH_REPLENISHMENT_REQUEST },
    ],
  },
  {
    key: 'engagement',
    title: 'Public Engagement',
    subtitle: 'Campaigns & calls',
    icon: Megaphone,
    matches: (p) =>
      p.startsWith('/admin/campaigns') ||
      p.startsWith('/admin/job-postings') ||
      p.startsWith('/admin/vendor-calls'),
    entry: '/admin/campaigns',
    sections: [
      { path: '/admin/campaigns',    label: 'Campaigns',    icon: Megaphone,  permission: PERMISSIONS.CAMPAIGNS_VIEW },
      { path: '/admin/job-postings', label: 'Job Postings', icon: Briefcase,  permission: PERMISSIONS.JOB_POSTINGS_VIEW },
      { path: '/admin/vendor-calls', label: 'Vendor Calls', icon: Store,      permission: PERMISSIONS.VENDOR_CALLS_VIEW },
    ],
  },
  {
    key: 'procurement',
    title: 'Procurement',
    subtitle: 'RFQs & vendors',
    icon: ShoppingCart,
    matches: (p) => p.startsWith('/admin/procurement'),
    entry: '/admin/procurement/dashboard',
    sections: [
      { path: '/admin/procurement/dashboard', label: 'Dashboard', icon: BarChart,       permission: PERMISSIONS.PROCUREMENT_DASHBOARD_VIEW },
      { path: '/admin/procurement/inbox',     label: 'Inbox',     icon: ClipboardCheck, permission: PERMISSIONS.PROCUREMENT_REQUEST_VIEW },
      { path: '/admin/procurement/vendors',   label: 'Vendors',   icon: Store,          permission: PERMISSIONS.PROCUREMENT_VENDOR_VIEW },
    ],
  },
  {
    key: 'cbo',
    title: 'CBO Partners',
    subtitle: 'Community organisations',
    icon: Users2,
    matches: (p) => p.startsWith('/admin/cbo'),
    entry: '/admin/cbo',
    sections: [
      { path: '/admin/cbo?section=cbos',         label: 'CBO Partners',   icon: Building2,      permission: PERMISSIONS.CBO_VIEW, group: 'Directory' },
      { path: '/admin/cbo?section=volunteers',   label: 'Volunteers',     icon: Users,          permission: PERMISSIONS.CBO_VIEW, group: 'Directory' },
      { path: '/admin/cbo?section=activities',   label: 'Activities',     icon: Activity,       permission: PERMISSIONS.CBO_VIEW, group: 'Work' },
      { path: '/admin/cbo?section=duediligence', label: 'Due Diligence',  icon: ClipboardCheck, permission: PERMISSIONS.CBO_VIEW, group: 'Governance' },
      { path: '/admin/cbo?section=proposals',    label: 'CBO Proposals',  icon: FileText,       permission: PERMISSIONS.CBO_VIEW, group: 'Governance' },
      { path: '/admin/cbo?section=projects',     label: 'CBO Projects',   icon: Briefcase,      permission: PERMISSIONS.CBO_VIEW, group: 'Governance' },
    ],
  },
  {
    key: 'meal',
    title: 'MEAL',
    subtitle: 'Monitoring & learning',
    icon: BarChart,
    matches: (p) => p.startsWith('/admin/meal'),
    entry: '/admin/meal',
    sections: [
      { path: '/admin/meal?section=indicators',  label: 'Indicators',     icon: TargetIcon,     permission: PERMISSIONS.MEAL_VIEW },
      { path: '/admin/meal?section=evaluations', label: 'Evaluations',    icon: FileCheck,      permission: PERMISSIONS.MEAL_VIEW },
      { path: '/admin/meal?section=learning',    label: 'Learning',       icon: Lightbulb,      permission: PERMISSIONS.MEAL_VIEW },
      { path: '/admin/meal?section=complaints',  label: 'Accountability', icon: MessageSquare,  permission: PERMISSIONS.MEAL_VIEW },
    ],
  },
  {
    key: 'reports',
    title: 'Reports',
    subtitle: 'Analytics & exports',
    icon: FileBarChart,
    matches: (p) => p.startsWith('/admin/reports'),
    entry: '/admin/reports',
    sections: [
      { path: '/admin/reports?section=overview',   label: 'Overview',           icon: BarChart3,    permission: PERMISSIONS.REPORTS_VIEW },
      { path: '/admin/reports?section=catalog',    label: 'Report Catalog',     icon: FileBarChart, permission: PERMISSIONS.REPORTS_VIEW },
      { path: '/admin/reports?section=reports',    label: 'Generated Reports',  icon: FileText,     permission: PERMISSIONS.REPORTS_VIEW },
      { path: '/admin/reports?section=ai-reports', label: 'AI Reports',         icon: Zap,          permission: PERMISSIONS.REPORTS_VIEW },
      { path: '/admin/reports?section=scheduled',  label: 'Scheduled',          icon: Clock,        permission: PERMISSIONS.REPORTS_VIEW },
    ],
  },
  {
    key: 'settings',
    title: 'Settings',
    subtitle: 'Users, roles, system',
    icon: Settings,
    matches: (p) => p.startsWith('/admin/settings') || p.startsWith('/admin/system-settings'),
    entry: '/admin/settings',
    sections: [
      // /admin/settings (SettingsPage)
      { path: '/admin/settings?section=users',        label: 'User Management',        icon: Users,          permission: PERMISSIONS.SETTINGS_VIEW,   group: 'Access' },
      { path: '/admin/settings?section=roles',        label: 'Roles & Permissions',    icon: Shield,         permission: PERMISSIONS.SETTINGS_VIEW,   group: 'Access' },
      { path: '/admin/settings?section=system',       label: 'System Settings',        icon: Settings,       permission: PERMISSIONS.SETTINGS_VIEW,   group: 'Access' },
      // /admin/system-settings (SystemSettingsPage)
      { path: '/admin/system-settings?section=general',       label: 'General',           icon: Settings,   permission: PERMISSIONS.SETTINGS_MANAGE, group: 'Organization' },
      { path: '/admin/system-settings?section=departments',   label: 'Departments',       icon: Building2,  permission: PERMISSIONS.SETTINGS_MANAGE, group: 'Organization' },
      { path: '/admin/system-settings?section=positions',     label: 'Positions',         icon: Briefcase,  permission: PERMISSIONS.SETTINGS_MANAGE, group: 'Organization' },
      { path: '/admin/system-settings?section=ai',            label: 'AI Configuration',  icon: Sparkles,   permission: PERMISSIONS.SETTINGS_MANAGE, group: 'Integrations' },
      { path: '/admin/system-settings?section=notifications', label: 'Notifications',     icon: Bell,       permission: PERMISSIONS.SETTINGS_MANAGE, group: 'Integrations' },
      { path: '/admin/system-settings?section=integrations',  label: 'Integrations',      icon: Globe,      permission: PERMISSIONS.SETTINGS_MANAGE, group: 'Integrations' },
      { path: '/admin/system-settings?section=backup',        label: 'Backup & Recovery', icon: Database,   permission: PERMISSIONS.SETTINGS_MANAGE, group: 'Platform' },
      { path: '/admin/system-settings?section=appearance',    label: 'Appearance',        icon: Palette,    permission: PERMISSIONS.SETTINGS_MANAGE, group: 'Platform' },
      { path: '/admin/system-settings?section=security',      label: 'Security',          icon: Key,        permission: PERMISSIONS.SETTINGS_MANAGE, group: 'Platform' },
    ],
  },
  {
    key: 'hr',
    title: 'Human Resources',
    subtitle: 'Staff & payroll',
    icon: Users,
    matches: (p) => p.startsWith('/admin/hr') || p === '/staff-register',
    entry: '/admin/hr',
    sections: [
      // Sections inside HRPage (single route, driven by ?section=)
      { path: '/admin/hr?section=overview',         label: 'Staff Directory',   icon: Users,          permission: PERMISSIONS.HR_VIEW,              group: 'People' },
      { path: '/admin/hr?section=leave',            label: 'Leave Management',  icon: Award,          permission: PERMISSIONS.HR_VIEW,              group: 'People' },
      { path: '/admin/hr?section=appraisals',       label: 'Appraisals',        icon: Award,          permission: PERMISSIONS.HR_VIEW,              group: 'People' },
      { path: '/admin/hr?section=contracts',        label: 'Contracts',         icon: FileText,       permission: PERMISSIONS.HR_VIEW,              group: 'People' },

      { path: '/admin/hr?section=assetRegister',    label: 'Asset Register',    icon: Package,        permission: PERMISSIONS.HR_VIEW,              group: 'Assets & Requests' },
      { path: '/admin/hr?section=vehicleRequests',  label: 'Vehicle Requests',  icon: FolderKanban,   permission: PERMISSIONS.HR_VIEW,              group: 'Assets & Requests' },
      { path: '/admin/hr?section=accommodation',    label: 'Accommodation',     icon: Building2,      permission: PERMISSIONS.HR_VIEW,              group: 'Assets & Requests' },
      { path: '/admin/hr?section=expenses',         label: 'Expenses',          icon: Receipt,        permission: PERMISSIONS.HR_VIEW,              group: 'Assets & Requests' },

      // Separate top-level HR routes
      { path: '/admin/hr/attendance',       label: 'Attendance',      icon: Clock,          permission: PERMISSIONS.HR_VIEW_ATTENDANCE,   group: 'Time' },
      { path: '/admin/hr/weekly-hours',     label: 'Weekly Hours',    icon: Clock,          permission: PERMISSIONS.HR_VIEW,              group: 'Time' },

      { path: '/staff-register',            label: 'Register Staff',  icon: UserPlus,       permission: PERMISSIONS.HR_VIEW,              group: 'Onboarding' },
      { path: '/admin/hr/onboarding',       label: 'Onboarding',      icon: UserPlus,       permission: PERMISSIONS.HR_MANAGE_ONBOARDING, group: 'Onboarding' },

      { path: '/admin/hr/payroll',          label: 'Payroll',         icon: Wallet,         permission: PERMISSIONS.FINANCE_VIEW_PAYROLL, group: 'Money' },
      { path: '/admin/hr/salary-advances',  label: 'Salary Advances', icon: DollarSign,     permission: PERMISSIONS.HR_VIEW,              group: 'Money' },
      { path: '/admin/hr/staff-expenses',   label: 'Staff Expenses',  icon: ClipboardCheck, permission: PERMISSIONS.HR_VIEW,              group: 'Money' },
    ],
  },
];

// ------------------------------------------------------------------
// ADMIN MENU (shown when NOT inside any console)
// ------------------------------------------------------------------
// Console modules render as a single row that opens the module console.
const ADMIN_ITEMS = [
  { type: 'link',    path: '/admin/dashboard',    icon: LayoutDashboard, label: 'Dashboard',         permission: PERMISSIONS.DASHBOARD_VIEW },
  { type: 'link',    path: '/admin/my-dashboard', icon: Activity,        label: 'My Dashboard',      showOnlyWithoutPermission: PERMISSIONS.DASHBOARD_VIEW },
  { type: 'console', consoleKey: 'programmes' },
  { type: 'link',    path: '/admin/beneficiaries', icon: Users,   label: 'Beneficiaries', permission: PERMISSIONS.BENEFICIARIES_VIEW },
  { type: 'link',    path: '/admin/map',           icon: MapPin,  label: 'Beneficiary Map' },
  { type: 'console', consoleKey: 'fund-dev' },
  { type: 'console', consoleKey: 'operations' },
  { type: 'console', consoleKey: 'finance' },
  { type: 'console', consoleKey: 'engagement' },
  { type: 'console', consoleKey: 'procurement' },
  { type: 'console', consoleKey: 'hr' },
  { type: 'console', consoleKey: 'cbo' },
  { type: 'console', consoleKey: 'meal' },
  { type: 'link',    path: '/admin/social-media',  icon: Share2,       label: 'Social Media',   permission: PERMISSIONS.SOCIAL_MEDIA_VIEW },
  { type: 'link',    path: '/admin/announcements', icon: Megaphone,    label: 'Announcements' },
  { type: 'console', consoleKey: 'reports' },
  { type: 'console', consoleKey: 'settings' },
];

// ------------------------------------------------------------------
// COMPONENT
// ------------------------------------------------------------------
const Sidebar = ({ isOpen, closeSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission, currentUser } = useAuth();

  if (!currentUser) return null;

  const hasWildcard = Array.isArray(currentUser.permissions) &&
    currentUser.permissions.some(p => p.permissionKey === '*');

  const allow = (perm) => hasWildcard || !perm || hasPermission(perm);

  useEffect(() => { if (closeSidebar) closeSidebar(); }, [location.pathname]); // eslint-disable-line

  // Is the current route inside any console?
  const activeConsole = CONSOLES.find((c) => c.matches(location.pathname));

  // Section-active matcher — handles ?section= links AND plain path links.
  const isSectionActive = (section) => {
    if (section.path.includes('?section=')) {
      const [pathPart, queryPart] = section.path.split('?');
      if (location.pathname !== pathPart) return false;
      const target = new URLSearchParams(queryPart).get('section');
      const current = new URLSearchParams(location.search).get('section') || 'dashboard';
      return current === target;
    }
    return location.pathname === section.path;
  };

  // ------- Rendering helpers -------
  const rowActive   = 'bg-hs-navy-800 text-white border-l-[3px] border-orange-500 font-semibold';
  const rowInactive = 'text-hs-slate-200 hover:bg-hs-navy-800/70 hover:text-white border-l-[3px] border-transparent';

  const renderConsoleMode = () => {
    const allowedSections = activeConsole.sections.filter((s) => allow(s.permission));

    // Group sections by group name if any section defines one.
    const hasGroups = allowedSections.some((s) => s.group);
    const grouped = hasGroups
      ? allowedSections.reduce((acc, s) => {
          const g = s.group || 'General';
          (acc[g] = acc[g] || []).push(s);
          return acc;
        }, {})
      : { _: allowedSections };

    const HeaderIcon = activeConsole.icon;

    return (
      <>
        {/* Console header — module name + subtitle */}
        <div className="px-4 py-3 border-b border-hs-navy-800 shrink-0">
          <div className="flex items-center gap-2.5 mb-2">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-hs-slate-400 hover:text-white transition"
              title="Back to Admin"
            >
              <ArrowLeft size={11} />
              <span>Admin</span>
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-md bg-orange-500 flex items-center justify-center shrink-0">
              <HeaderIcon size={17} className="text-white" />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-[14px] font-display font-semibold text-white truncate">
                {activeConsole.title}
              </p>
              {activeConsole.subtitle && (
                <p className="text-[10.5px] text-hs-slate-400 truncate">{activeConsole.subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Sections */}
        <nav className="py-2 px-2 flex-1 overflow-y-auto space-y-3">
          {Object.entries(grouped).map(([groupName, items]) => (
            <div key={groupName}>
              {hasGroups && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-hs-slate-500">
                  {groupName}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((s) => {
                  const active = isSectionActive(s);
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.path}
                      onClick={() => navigate(s.path)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-r-md text-[13px] text-left transition ${
                        active ? rowActive : rowInactive
                      }`}
                    >
                      {Icon && (
                        <Icon size={15} className={active ? 'text-orange-400' : 'text-hs-slate-400'} />
                      )}
                      <span className="flex-1 truncate">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Back to Admin — bottom pill */}
        <div className="p-3 border-t border-hs-navy-800 shrink-0">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-[13px] font-semibold text-white bg-hs-navy-800 hover:bg-hs-navy-900 border border-hs-navy-800 transition"
          >
            <ArrowLeft size={15} />
            <span>Back to Admin</span>
          </button>
        </div>
      </>
    );
  };

  const renderAdminMode = () => {
    const items = ADMIN_ITEMS.map((item) => {
      if (item.type === 'console') {
        const c = CONSOLES.find((x) => x.key === item.consoleKey);
        if (!c) return null;
        const anyAllowed = c.sections.some((s) => allow(s.permission));
        if (!anyAllowed) return null;
        return { kind: 'console', console: c };
      }
      if (item.showOnlyWithoutPermission) {
        if (hasPermission(item.showOnlyWithoutPermission)) return null;
      }
      if (!allow(item.permission)) return null;
      return { kind: 'link', item };
    }).filter(Boolean);

    return (
      <>
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
          {items.map((row, i) => {
            if (row.kind === 'console') {
              const c = row.console;
              const Icon = c.icon;
              return (
                <button
                  key={c.key}
                  onClick={() => navigate(c.entry)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-r-md text-[13px] font-medium text-left transition ${rowInactive}`}
                >
                  <Icon size={16} className="text-hs-slate-400" />
                  <span className="flex-1">{c.title}</span>
                  <ChevronRight size={13} className="text-hs-slate-500" />
                </button>
              );
            }
            const it = row.item;
            const Icon = it.icon;
            return (
              <NavLink
                key={it.path}
                to={it.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-r-md text-[13px] font-medium transition ${
                    isActive ? rowActive : rowInactive
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} className={isActive ? 'text-orange-400' : 'text-hs-slate-400'} />
                    <span>{it.label}</span>
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
      </>
    );
  };

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
        {activeConsole ? renderConsoleMode() : renderAdminMode()}
      </aside>
    </>
  );
};

export default Sidebar;
