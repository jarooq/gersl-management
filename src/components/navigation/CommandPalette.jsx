import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Baby, Briefcase, DollarSign, Users, FileText, HeartHandshake,
  Shield, BarChart, Settings, Users2, Share2, FileBarChart, FolderKanban,
  Target, ClipboardCheck, CheckCircle, Clock, Award, MapPin, UserPlus,
  Megaphone, Store, UserCheck, Wallet, Activity, ShoppingCart, Droplets,
  Search, CornerDownLeft, ArrowUp, ArrowDown,
} from 'lucide-react';

const RECENT_KEY = 'gersl.commandPalette.recent';
const RECENT_MAX = 5;

const loadRecent = () => {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveRecent = (paths) => {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(paths.slice(0, RECENT_MAX))); }
  catch { /* localStorage unavailable — no-op */ }
};
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';

// Every jump-target in the app. Kept flat here (not tied to sidebar groups)
// so the palette can search across everything with one array.
const COMMANDS = [
  { path: '/admin/dashboard',               icon: LayoutDashboard, label: 'Dashboard',            group: 'Overview',   permission: PERMISSIONS.DASHBOARD_VIEW },
  { path: '/admin/my-dashboard',            icon: Activity,        label: 'My Dashboard',         group: 'Overview' },
  { path: '/admin/beneficiaries',           icon: Users,           label: 'Beneficiaries',        group: 'Programmes', permission: PERMISSIONS.BENEFICIARIES_VIEW },
  { path: '/admin/map',                     icon: MapPin,          label: 'Beneficiary Map',      group: 'Programmes' },
  { path: '/admin/orphans',                 icon: Baby,            label: 'Orphan Care',          group: 'Programmes', permission: PERMISSIONS.ORPHANS_VIEW },
  { path: '/admin/wash',                    icon: Droplets,        label: 'WASH',                 group: 'Programmes' },
  { path: '/admin/igp',                     icon: Briefcase,       label: 'IGP',                  group: 'Programmes' },
  { path: '/admin/coordinators',            icon: UserCheck,       label: 'Coordinators',         group: 'Programmes', permission: PERMISSIONS.ORPHANS_VIEW },
  { path: '/admin/partners',                icon: HeartHandshake,  label: 'Partners',             group: 'Fund Dev',   permission: PERMISSIONS.PARTNERS_VIEW },
  { path: '/admin/proposals',               icon: FileText,        label: 'Proposals',            group: 'Fund Dev',   permission: PERMISSIONS.PROPOSALS_VIEW },
  { path: '/admin/projects',                icon: FolderKanban,    label: 'Projects',             group: 'Operations', permission: PERMISSIONS.PROJECTS_VIEW },
  { path: '/admin/operations/activities',   icon: Target,          label: 'Activities',           group: 'Operations', permission: PERMISSIONS.OPERATIONS_VIEW_ACTIVITIES },
  { path: '/admin/operations/tasks',        icon: ClipboardCheck,  label: 'All Tasks',            group: 'Operations', permission: PERMISSIONS.OPERATIONS_VIEW_TASKS },
  { path: '/admin/operations/my-tasks',     icon: UserCheck,       label: 'My Tasks',             group: 'Operations' },
  { path: '/admin/operations/field-visits', icon: MapPin,          label: 'Field Visits',         group: 'Operations' },
  { path: '/admin/operations/movements',    icon: MapPin,          label: 'Movement Register',    group: 'Operations' },
  { path: '/admin/operations/fuel-claims',  icon: DollarSign,      label: 'Fuel Claims',          group: 'Operations' },
  { path: '/admin/approvals',               icon: CheckCircle,     label: 'Approvals',            group: 'Operations', permission: PERMISSIONS.APPROVALS_VIEW },
  { path: '/admin/compliance',              icon: Shield,          label: 'Compliance',           group: 'Operations', permission: PERMISSIONS.COMPLIANCE_VIEW },
  { path: '/admin/finance',                 icon: DollarSign,      label: 'Finance Console',      group: 'Finance',    permission: PERMISSIONS.FINANCE_VIEW },
  { path: '/admin/finance/cash/accounts',   icon: Wallet,          label: 'Cash Accounts',        group: 'Finance',    permission: PERMISSIONS.CASH_ACCOUNTS_VIEW },
  { path: '/admin/finance/cash/replenishments', icon: HeartHandshake, label: 'Cash Replenishments', group: 'Finance', permission: PERMISSIONS.CASH_REPLENISHMENT_REQUEST },
  { path: '/admin/campaigns',               icon: Megaphone,       label: 'Campaigns',            group: 'Engagement', permission: PERMISSIONS.CAMPAIGNS_VIEW },
  { path: '/admin/job-postings',            icon: Briefcase,       label: 'Job Postings',         group: 'Engagement', permission: PERMISSIONS.JOB_POSTINGS_VIEW },
  { path: '/admin/vendor-calls',            icon: Store,           label: 'Vendor Calls',         group: 'Engagement', permission: PERMISSIONS.VENDOR_CALLS_VIEW },
  { path: '/admin/procurement/dashboard',   icon: BarChart,        label: 'Procurement Dashboard',group: 'Procurement',permission: PERMISSIONS.PROCUREMENT_DASHBOARD_VIEW },
  { path: '/admin/procurement/inbox',       icon: ClipboardCheck,  label: 'Procurement Inbox',    group: 'Procurement',permission: PERMISSIONS.PROCUREMENT_REQUEST_VIEW },
  { path: '/admin/procurement/vendors',     icon: Store,           label: 'Vendors',              group: 'Procurement',permission: PERMISSIONS.PROCUREMENT_VENDOR_VIEW },
  { path: '/admin/hr',                      icon: Users,           label: 'HR Overview',          group: 'HR',         permission: PERMISSIONS.HR_VIEW },
  { path: '/admin/hr/attendance',           icon: Clock,           label: 'Attendance',           group: 'HR',         permission: PERMISSIONS.HR_VIEW_ATTENDANCE },
  { path: '/staff-register',                icon: UserPlus,        label: 'Register Staff',       group: 'HR',         permission: PERMISSIONS.HR_VIEW },
  { path: '/admin/hr/onboarding',           icon: UserPlus,        label: 'Onboarding',           group: 'HR',         permission: PERMISSIONS.HR_MANAGE_ONBOARDING },
  { path: '/admin/hr/weekly-hours',         icon: Clock,           label: 'Weekly Hours',         group: 'HR',         permission: PERMISSIONS.HR_VIEW },
  { path: '/admin/hr/payroll',              icon: Wallet,          label: 'Payroll',              group: 'HR',         permission: PERMISSIONS.FINANCE_VIEW_PAYROLL },
  { path: '/admin/hr/salary-advances',      icon: DollarSign,      label: 'Salary Advances',      group: 'HR',         permission: PERMISSIONS.HR_VIEW },
  { path: '/admin/hr/staff-expenses',       icon: ClipboardCheck,  label: 'Staff Expenses',       group: 'HR',         permission: PERMISSIONS.HR_VIEW },
  { path: '/admin/cbo',                     icon: Users2,          label: 'CBO Partners',         group: 'Other',      permission: PERMISSIONS.CBO_VIEW },
  { path: '/admin/meal',                    icon: BarChart,        label: 'MEAL',                 group: 'Other',      permission: PERMISSIONS.MEAL_VIEW },
  { path: '/admin/social-media',            icon: Share2,          label: 'Social Media',         group: 'Other',      permission: PERMISSIONS.SOCIAL_MEDIA_VIEW },
  { path: '/admin/announcements',           icon: Megaphone,       label: 'Announcements',        group: 'Other' },
  { path: '/admin/reports',                 icon: FileBarChart,    label: 'Reports',              group: 'Other',      permission: PERMISSIONS.REPORTS_VIEW },
  { path: '/admin/settings',                icon: Settings,        label: 'Settings',             group: 'Other',      permission: PERMISSIONS.SETTINGS_VIEW },
];

const CommandPalette = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, currentUser } = useAuth();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const [recentPaths, setRecentPaths] = useState(loadRecent);

  // Track visited routes across the app — writes to localStorage so recent
  // items survive a full refresh. Not scoped per-user; if that ever matters,
  // key the localStorage entry off currentUser.id.
  useEffect(() => {
    setRecentPaths((prev) => {
      const next = [location.pathname + location.search, ...prev.filter((p) => p !== location.pathname + location.search)];
      saveRecent(next);
      return next.slice(0, RECENT_MAX);
    });
  }, [location.pathname, location.search]);

  const hasWildcard = currentUser && Array.isArray(currentUser.permissions) &&
    currentUser.permissions.some(p => p.permissionKey === '*');

  const items = useMemo(() => {
    const allowed = COMMANDS.filter(c => hasWildcard || !c.permission || hasPermission(c.permission));

    // Empty query: recent items at top, then everything else — recent get a
    // synthetic "Recent" group to render under.
    if (!query.trim()) {
      const recentSet = new Set(recentPaths);
      const recentItems = recentPaths
        .map((p) => allowed.find((c) => c.path === p))
        .filter(Boolean)
        .map((c) => ({ ...c, group: 'Recent' }));
      const rest = allowed.filter((c) => !recentSet.has(c.path));
      return [...recentItems, ...rest];
    }

    const q = query.toLowerCase();
    return allowed
      .map(c => {
        const label = c.label.toLowerCase();
        const group = (c.group || '').toLowerCase();
        let score = 0;
        if (label.startsWith(q)) score += 4;
        else if (label.includes(q)) score += 2;
        if (group.includes(q)) score += 1;
        return { c, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.c);
  }, [query, hasWildcard, hasPermission, recentPaths]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [isOpen]);

  useEffect(() => { setCursor(0); }, [query]);

  const commit = (item) => {
    if (!item) return;
    navigate(item.path);
    onClose();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      commit(items[cursor]);
    }
  };

  if (!isOpen) return null;

  // Group results by their group name for a nicer readout.
  const grouped = items.reduce((acc, c) => {
    (acc[c.group || 'Other'] = acc[c.group || 'Other'] || []).push(c);
    return acc;
  }, {});

  let flatIndex = -1;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4" onClick={onClose}>
      <div className="fixed inset-0 bg-hs-navy-900/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl bg-white rounded-xl shadow-hs-drawer border border-hs-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-hs-slate-200">
          <Search size={16} className="text-hs-slate-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to a page…"
            className="flex-1 text-sm text-hs-navy-800 placeholder:text-hs-slate-400 focus:outline-none bg-transparent"
          />
          <kbd className="text-[10px] text-hs-slate-500 font-mono border border-hs-slate-200 rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        <div className="max-h-96 overflow-y-auto py-1">
          {items.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-hs-slate-500">
              No matches for "{query}"
            </p>
          )}
          {Object.entries(grouped).map(([group, list]) => (
            <div key={group} className="py-1">
              <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-hs-slate-500">
                {group}
              </p>
              {list.map((c) => {
                flatIndex += 1;
                const active = flatIndex === cursor;
                const Icon = c.icon;
                return (
                  <button
                    key={c.path}
                    onClick={() => commit(c)}
                    onMouseEnter={() => setCursor(flatIndex)}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left transition ${
                      active
                        ? 'bg-orange-50 text-orange-700'
                        : 'text-hs-navy-700 hover:bg-hs-slate-50'
                    }`}
                  >
                    <Icon size={15} className={active ? 'text-orange-600' : 'text-hs-slate-500'} />
                    <span className="flex-1 truncate">{c.label}</span>
                    {active && <CornerDownLeft size={13} className="text-orange-500" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-hs-slate-200 flex items-center justify-between text-[11px] text-hs-slate-500 bg-hs-slate-50">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><ArrowUp size={11} /><ArrowDown size={11} />navigate</span>
            <span className="flex items-center gap-1"><CornerDownLeft size={11} />open</span>
          </div>
          <span>{items.length} result{items.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
