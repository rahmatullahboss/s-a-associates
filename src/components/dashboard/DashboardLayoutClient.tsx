'use client';

import { useState } from 'react';
import { Sidebar, SidebarToggle } from '@/components/dashboard/Sidebar';

interface DashboardLayoutClientProps {
  user: { name: string; role: string };
  children: React.ReactNode;
}

export default function DashboardLayoutClient({ user, children }: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar
        role={user.role}
        userName={user.name}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <SidebarToggle onClick={() => setSidebarOpen(true)} />
            <span className="font-bold text-[#1E293B]">S&A Associates</span>
          </div>
          <div className="w-8 h-8 bg-[#1E293B] rounded-full flex items-center justify-center text-secondary text-sm font-semibold">
            {user.name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={user.role === 'student' ? "" : "lg:ml-64"}>
        {children}
      </div>
    </>
  );
}
