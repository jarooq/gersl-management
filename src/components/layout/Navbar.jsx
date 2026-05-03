import React from 'react';
import { LogOut, Menu, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from '../notifications/NotificationBell';

// === GERSL Navbar v2 ===
// White bar, navy brand on the left, user/notifications on the right.
// Subtle bottom border separates it from page content.

const Navbar = ({ toggleSidebar, onCommandOpen }) => {
  const { currentUser, logout } = useAuth();

  const initials = (currentUser?.fullName || currentUser?.name || '?')
    .split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <header className="bg-white border-b border-ink-100 sticky top-0 z-40">
      <div className="px-4 lg:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left — burger + brand */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 -ml-2 rounded-md text-ink-700 hover:bg-ink-50"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <img src="/Logo.png" alt="Global Ehsan Relief" className="h-9 w-9 object-contain shrink-0" />
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-ink-900 truncate leading-tight">
                Global Ehsan Relief <span className="text-ink-500 font-normal">· Sri Lanka</span>
              </h1>
              <p className="text-[11px] text-ink-500 hidden sm:block leading-tight">Management System</p>
            </div>
          </div>
        </div>

        {/* Center — command palette hint (md+) */}
        {onCommandOpen && (
          <button
            onClick={onCommandOpen}
            className="hidden md:flex items-center gap-2 text-sm text-ink-500 bg-ink-50 hover:bg-ink-100 border border-ink-100 px-3 py-1.5 rounded-md transition w-72 max-w-xs"
          >
            <Search size={15} className="text-ink-400" />
            <span>Search anything…</span>
            <span className="ml-auto text-[10px] text-ink-400 font-mono border border-ink-200 rounded px-1.5 py-0.5 bg-white">⌘K</span>
          </button>
        )}

        {/* Right — notifications + user + logout */}
        <div className="flex items-center gap-2">
          <NotificationBell />

          {/* User chip */}
          <div className="hidden md:flex items-center gap-2.5 pl-3 ml-1 border-l border-ink-100">
            <div className="text-right hidden lg:block leading-tight">
              <p className="text-[13px] font-semibold text-ink-900">
                {currentUser?.fullName || currentUser?.name || '—'}
              </p>
              <p className="text-[11px] text-ink-500">{currentUser?.role}</p>
            </div>
            <div className="w-9 h-9 rounded-md bg-navy-900 text-white flex items-center justify-center text-sm font-semibold shadow-card">
              {initials}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-ink-700 hover:text-danger-700 hover:bg-danger-50 rounded-md transition"
            aria-label="Logout"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>

          {/* Mobile logout — icon only */}
          <button
            onClick={logout}
            className="md:hidden p-2 text-ink-700 hover:text-danger-700 hover:bg-danger-50 rounded-md"
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
