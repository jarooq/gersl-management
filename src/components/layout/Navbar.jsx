import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, LogOut, Menu, X, Search, Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = ({ toggleSidebar }) => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const notifications = [
    { id: 1, type: 'info', message: 'New orphan visit scheduled', time: '5m ago' },
    { id: 2, type: 'success', message: 'Project milestone completed', time: '1h ago' },
    { id: 3, type: 'warning', message: 'Budget review pending', time: '2h ago' },
  ];

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="px-4 lg:px-6 py-3">
        <div className="flex justify-between items-center">
          {/* Left - Menu button + Logo and Title */}
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle Button for Mobile */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu size={24} className="text-gray-700" />
            </button>

            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg shadow-md">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">GERSL</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Management System</p>
            </div>
          </div>

          {/* Right - User actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} className="text-gray-600" />
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold animate-pulse">
                  3
                </span>
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden animate-slide-down">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                      >
                        <p className="text-sm text-gray-900">{notif.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-center">
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="hidden md:flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{currentUser?.name}</p>
                <p className="text-xs text-gray-500">{currentUser?.role}</p>
              </div>
              <div className="text-2xl bg-gradient-to-br from-blue-500 to-blue-600 w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                {currentUser?.avatar}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4 animate-slide-down">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl bg-gradient-to-br from-blue-500 to-blue-600 w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                {currentUser?.avatar}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{currentUser?.name}</p>
                <p className="text-xs text-gray-500">{currentUser?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
