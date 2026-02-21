'use client';

import { Link } from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  FileText,
  FolderOpen,
  LogOut,
  X,
  Menu,
} from 'lucide-react';
import { API_BASE } from '@/lib/api';

interface SidebarProps {
  role: string;
  userName?: string;
  isOpen: boolean;
  onClose: () => void;
}

const adminLinks = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'Students', href: '/dashboard/students' },
  { icon: FileText, label: 'Leads', href: '/dashboard/leads' },
  { icon: Calendar, label: 'Bookings', href: '/dashboard/bookings' },
  { icon: FolderOpen, label: 'Documents', href: '/dashboard/documents' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

const studentLinks = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Calendar, label: 'My Bookings', href: '/dashboard/bookings' },
  { icon: FileText, label: 'Documents', href: '/dashboard/documents' },
  { icon: Settings, label: 'Profile', href: '/dashboard/profile' },
];

export function Sidebar({ role, userName, isOpen, onClose }: SidebarProps) {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const isAdmin = role === 'admin' || role === 'agent';
  const links = isAdmin ? adminLinks : studentLinks;

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
      {/* Logo */}
      <div className="mb-2 flex flex-col items-center gap-2 pb-4 border-b border-gray-100 dark:border-gray-700">
        <Link to="/">
          <div className="bg-[#1E293B] rounded-xl p-2 w-12 h-12 flex items-center justify-center overflow-hidden">
            <img src="/sa-logo.png" alt="S&A Associates" className="object-contain w-full h-full scale-[2.5]" />
          </div>
        </Link>
        {userName && (
          <div className="text-center">
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{userName}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-secondary/10 text-gray-900 capitalize">
              {role}
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="space-y-1 flex-1">
        {links.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              to={link.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                active
                  ? 'bg-secondary/10 text-gray-900 border-l-4 border-secondary'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 group'
              }`}
            >
              <link.icon size={20} className={active ? 'text-gray-900' : 'group-hover:text-gray-900 transition-colors'} />
              {link.label}
            </Link>
          );
        })}
      </nav>

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
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 z-40 hidden lg:block bg-gray-100 dark:bg-gray-950 p-4">
        <div className="sticky top-4 h-[calc(100vh-2rem)]">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          <aside className="fixed left-0 top-0 h-screen w-72 bg-gray-100 dark:bg-gray-950 z-50 p-4 overflow-y-auto">
            <div className="flex justify-end mb-2">
              <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800 rounded-lg">
                <X size={20} />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

export function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 text-[#1E293B] hover:bg-gray-100 rounded-lg lg:hidden"
      aria-label="Open sidebar"
    >
      <Menu size={24} />
    </button>
  );
}
