"use client";

import { useState } from "react";
import { Sidebar, SidebarToggle } from "@/components/dashboard/Sidebar";
import StudentLayoutWrapper from "@/components/dashboard/student/StudentLayoutWrapper";

interface DashboardLayoutClientProps {
  user: { name: string; role: string };
  children: React.ReactNode;
}

export default function DashboardLayoutClient({
  user,
  children,
}: DashboardLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isStudent = user.role === "student";

  // Students get their own consistent light sidebar layout
  if (isStudent) {
    return (
      <StudentLayoutWrapper userName={user.name}>
        {children}
      </StudentLayoutWrapper>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 font-sans">
      <Sidebar
        role={user.role}
        userName={user.name}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile Header for admin/agent */}
      <div className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <SidebarToggle onClick={() => setSidebarOpen(true)} />
            <div className="bg-[#1E293B] rounded-lg px-3 py-1.5"><img src="/sa-logo.png" alt="S&A Associates" className="h-8 object-contain" /></div>
          </div>
          <div className="w-8 h-8 bg-[#1E293B] rounded-full flex items-center justify-center text-gray-900 text-sm font-semibold">
            {user.name?.charAt(0) || "U"}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
