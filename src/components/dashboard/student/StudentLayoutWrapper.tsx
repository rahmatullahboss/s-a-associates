'use client';

import { LayoutDashboard, FileText, FolderOpen, Settings, Headphones, LogOut, Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { API_BASE, apiFetch } from '@/lib/api';
import { BookConsultationModal } from '@/components/BookConsultationModal';

const navLinks = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: FileText, label: 'My Sessions', href: '/dashboard/bookings' },
  { icon: FolderOpen, label: 'Documents', href: '/dashboard/documents' },
  { icon: Settings, label: 'Profile', href: '/dashboard/profile' },
];

interface StudentLayoutWrapperProps {
  children: React.ReactNode;
  userName?: string;
}

export default function StudentLayoutWrapper({ children, userName }: StudentLayoutWrapperProps) {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name?: string; email?: string; phone?: string }>({});

  useEffect(() => {
    apiFetch<{ user?: { name: string; email: string }; profile?: { phone?: string } }>('/api/profile')
      .then(data => {
        setUserInfo({
          name: data.user?.name || userName,
          email: data.user?.email,
          phone: data.profile?.phone || undefined,
        });
      })
      .catch(() => {
        setUserInfo({ name: userName });
      });
  }, [userName]);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    navigate('/student/login');
  };

  const sidebarContent = (
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex flex-col gap-2 h-full">
      {/* Navigation Links */}
      <nav className="space-y-1">
        {navLinks.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                active
                  ? 'bg-violet-50 dark:bg-violet-900/10 text-primary border-l-4 border-primary'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 group'
              }`}
            >
              <link.icon size={20} className={active ? 'text-primary' : 'group-hover:text-primary transition-colors'} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Counselor Card */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="bg-gradient-to-br from-secondary to-indigo-900 rounded-2xl p-5 text-white relative overflow-hidden group hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-colors"></div>
          <div className="relative z-10 flex items-start mb-4">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Headphones size={20} />
            </div>
          </div>
          <h4 className="font-bold text-white relative z-10">Your Counselor</h4>
          <p className="text-xs text-indigo-200 mb-4 relative z-10">Schedule a free session with our experts.</p>
          <BookConsultationModal prefillUser={userInfo}>
            <button className="flex items-center justify-center gap-2 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-colors w-full">
              Free Counselling
            </button>
          </BookConsultationModal>
        </div>
      </div>

      {/* Logout */}
      <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all w-full"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="student-theme min-h-screen bg-gray-100 dark:bg-gray-950 font-sans">
      {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-[#1E293B] hover:bg-gray-100 rounded-lg"
        >
          <Menu size={22} />
        </button>
        <div className="bg-[#1E293B] rounded-lg px-3 py-1.5"><img src="/sa-logo.png" alt="S&A Associates" className="h-8 object-contain" /></div>
        <div className="w-8 h-8 bg-[#1E293B] rounded-full flex items-center justify-center text-white text-sm font-semibold">
          {userName?.charAt(0) || 'S'}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 h-screen w-72 bg-gray-100 dark:bg-gray-950 z-50 p-4 overflow-y-auto">
            <div className="flex justify-end mb-2">
              <button onClick={() => setMobileOpen(false)} className="p-1 text-gray-500 hover:text-gray-800 rounded-lg">
                <X size={20} />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Layout */}
      <main className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0 hidden lg:block">
            <div className="sticky top-8">
              {sidebarContent}
            </div>
          </aside>

          {/* Page Content */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
