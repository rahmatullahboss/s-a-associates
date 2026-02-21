'use client';

import { Link } from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  FileText,
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
  { icon: Users, label: 'Leads', href: '/dashboard/leads' },
  { icon: Calendar, label: 'Bookings', href: '/dashboard/bookings' },
  { icon: FileText, label: 'Documents', href: '/dashboard/documents' },
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <Link to="/">
          <div className="bg-secondary text-[#1E293B] px-4 py-2 rounded-lg font-bold text-center shadow-sm hover:opacity-90 transition-opacity cursor-pointer">
            S&A Associates
          </div>
        </Link>
        {userName && (
          <div className="mt-4 text-center">
            <p className="text-white font-medium truncate">{userName}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-secondary/20 text-secondary capitalize">
              {role}
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <li key={link.href}>
                <Link to={link.href}
                  onClick={onClose}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    active
                      ? 'bg-secondary text-[#1E293B] shadow-md'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <link.icon size={20} />
                  <span>{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-white/10 rounded-lg w-full transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-[#1E293B] z-40 hidden lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
          />
          {/* Slide-in Sidebar */}
          <aside className="fixed left-0 top-0 h-screen w-64 bg-[#1E293B] z-50 transform transition-transform duration-300 ease-in-out translate-x-0">
            <div className="absolute top-4 right-4">
              <button
                onClick={onClose}
                className="p-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10"
              >
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
