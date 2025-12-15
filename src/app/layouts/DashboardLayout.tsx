import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../shared/components/layout/Sidebar';
import { AppHeader } from '../../shared/components/layout/AppHeader';

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-h-screen flex-1 flex-col md:ml-64">
          <AppHeader onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
          <main className="flex-1 px-4 pb-8 pt-4 md:px-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
