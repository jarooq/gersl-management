import React from 'react';
import { LogOut, Menu, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from '../notifications/NotificationBell';

// === GERSL Navbar v3 — HubSpot console top bar ===
// White bar, hs-navy body text, orange accents, ⌘K search hint at center.

const Navbar = ({ toggleSidebar, onCommandOpen }) => {
  const { currentUser, logout } = useAuth();

  const initials = (currentUser?.fullName || currentUser?.name || '?')
    .split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <header className="bg-white border-b border-hs-slate-200 sticky top-0 z-40">
      <div className="px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 -ml-2 rounded-md text-hs-navy-700 hover:bg-hs-slate-100"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
        </div>

        {onCommandOpen && (
          <button
            onClick={onCommandOpen}
            className="hidden md:flex items-center gap-2 text-sm text-hs-slate-500 bg-hs-slate-50 hover:bg-hs-slate-100 border border-hs-slate-200 px-3 py-1.5 rounded-md transition w-80 max-w-md"
          >
            <Search size={15} className="text-hs-slate-400" />
            <span>Search anything…</span>
            <span className="ml-auto text-[10px] text-hs-slate-500 font-mono border border-hs-slate-200 rounded px-1.5 py-0.5 bg-white">⌘K</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          <NotificationBell />

          <div className="hidden md:flex items-center gap-2.5 pl-3 ml-1 border-l border-hs-slate-200">
            <div className="text-right hidden lg:block leading-tight">
              <p className="text-[13px] font-semibold text-hs-navy-800">
                {currentUser?.fullName || currentUser?.name || '—'}
              </p>
              <p className="text-[11px] text-hs-slate-500">{currentUser?.role}</p>
            </div>
            <div className="w-9 h-9 rounded-md bg-orange-500 text-white flex items-center justify-center text-sm font-semibold shadow-hs-card">
              {initials}
            </div>
          </div>

          <button
            onClick={logout}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-hs-navy-700 hover:text-hs-red-600 hover:bg-hs-red-50 rounded-md transition"
            aria-label="Logout"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>

          <button
            onClick={logout}
            className="md:hidden p-2 text-hs-navy-700 hover:text-hs-red-600 hover:bg-hs-red-50 rounded-md"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
