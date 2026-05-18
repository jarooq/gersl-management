import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ErrorBoundary from '../common/ErrorBoundary';

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-ink-50 text-ink-900">
      <div className="flex h-screen overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar toggleSidebar={() => setIsSidebarOpen((v) => !v)} />
          <main className="flex-1 overflow-y-auto">
            {/* Per-page ErrorBoundary — keyed on the route so a crash on one
                page is isolated and the boundary resets on navigation,
                leaving the navbar/sidebar shell intact. */}
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
