import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Users, FolderKanban, ClipboardCheck, FileText, HeartHandshake,
  DollarSign, Baby, Megaphone,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';

// HubSpot-style Quick Create button — a "+" pill in the top nav that
// opens a small dropdown of "New X" shortcuts. Each option navigates to
// the target page with ?action=new so the page can auto-open its create
// modal (each page opts in separately; no pressure).
//
// The list is permission-filtered so a user without CBO access doesn't
// see "New CBO Partner" etc.

const OPTIONS = [
  { label: 'Beneficiary', icon: Users,         path: '/admin/beneficiaries?action=new',                permission: PERMISSIONS.BENEFICIARIES_CREATE },
  { label: 'Orphan',      icon: Baby,          path: '/admin/orphans?action=new',                      permission: PERMISSIONS.ORPHANS_CREATE },
  { label: 'Project',     icon: FolderKanban,  path: '/admin/projects?action=new',                     permission: PERMISSIONS.PROJECTS_CREATE },
  { label: 'Task',        icon: ClipboardCheck,path: '/admin/operations/tasks?action=new',             permission: PERMISSIONS.OPERATIONS_CREATE_TASK },
  { label: 'Proposal',    icon: FileText,      path: '/admin/proposals?section=overview&action=new',   permission: PERMISSIONS.PROPOSALS_CREATE },
  { label: 'Partner',     icon: HeartHandshake,path: '/admin/partners?section=overview&action=new',    permission: PERMISSIONS.PARTNERS_CREATE },
  { label: 'Invoice',     icon: FileText,      path: '/admin/finance?section=invoices&action=new',     permission: PERMISSIONS.FINANCE_VIEW },
  { label: 'Expense',     icon: DollarSign,    path: '/admin/finance?section=bills&action=new',        permission: PERMISSIONS.FINANCE_CREATE_EXPENSE },
  { label: 'Campaign',    icon: Megaphone,     path: '/admin/campaigns?action=new',                    permission: PERMISSIONS.CAMPAIGNS_CREATE },
];

const QuickCreate = () => {
  const navigate = useNavigate();
  const { hasPermission, currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);

  const hasWildcard = currentUser && Array.isArray(currentUser.permissions) &&
    currentUser.permissions.some(p => p.permissionKey === '*');

  const allowed = OPTIONS.filter(o => hasWildcard || !o.permission || hasPermission(o.permission));

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (menuRef.current?.contains(e.target)) return;
      if (btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  if (!currentUser) return null;
  if (allowed.length === 0) return null;

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-semibold transition ${
          open
            ? 'bg-orange-600 text-white'
            : 'bg-orange-500 text-white hover:bg-orange-600'
        }`}
        aria-label="Quick create"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Plus size={16} />
        <span className="hidden sm:inline">Create</span>
      </button>

      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-hs-drawer border border-hs-slate-200 z-50 py-1 overflow-hidden"
          role="menu"
        >
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-hs-slate-500">
            Quick create
          </p>
          {allowed.map((o) => {
            const Icon = o.icon;
            return (
              <button
                key={o.label}
                onClick={() => go(o.path)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-hs-navy-700 hover:bg-orange-50 hover:text-orange-700 transition text-left"
                role="menuitem"
              >
                <Icon size={15} className="text-hs-slate-500" />
                <span>New {o.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuickCreate;
