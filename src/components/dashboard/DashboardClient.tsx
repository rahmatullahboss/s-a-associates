'use client';

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle,
  FileText,
  Loader2
} from 'lucide-react';
import StudentDashboard from './student/StudentDashboard';
import { apiFetch } from '@/lib/api';

interface DashboardData {
  role: string;
  userName: string;
  recentBookings: { id: string; name: string; date: string; timeSlot: string; status?: string }[];
  queueBookings: unknown[];
  stats: {
    total: number;
    pending: number;
    completed: number;
    confirmed: number;
    documentsUploaded: number;
  };
}

export default function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    apiFetch<DashboardData>('/api/dashboard')
      .then((responseData) => {
        setData(responseData);
      })
      .catch(() => {
        setData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'assigned': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-gray-500">
        Failed to load dashboard data.
      </div>
    );
  }

  const role = data.role;
  const isAdmin = role === 'admin' || role === 'agent';

  const adminStats = [
    { label: 'Total Bookings', value: data.stats.total, icon: Calendar, color: 'bg-blue-100 text-blue-600' },
    { label: 'Pending Queue', value: data.stats.pending, icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Confirmed', value: data.stats.confirmed, icon: CheckCircle, color: 'bg-green-100 text-green-600' },
    { label: 'Completed', value: data.stats.completed, icon: CheckCircle, color: 'bg-emerald-100 text-emerald-600' },
  ];

  const studentStats = [
    { label: 'My Bookings', value: data.stats.total, icon: Calendar, color: 'bg-blue-100 text-blue-600' },
    { label: 'Pending', value: data.stats.pending, icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Documents Uploaded', value: data.stats.documentsUploaded, icon: FileText, color: 'bg-purple-100 text-purple-600' },
  ];

  const stats = isAdmin ? adminStats : studentStats;

  // Use the new Student Dashboard design for students
  if (!isAdmin) {
    return <StudentDashboard  />;
  }

  return (
    <div>
      {/* Top Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-30 border-b border-gray-100 hidden lg:block">
        <div className="flex items-center justify-between px-8 py-4">
          <h1 className="text-2xl font-bold text-[#1E293B] font-display">Dashboard</h1>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#1E293B] rounded-full flex items-center justify-center text-secondary font-semibold border border-white/20">
              {data.userName?.charAt(0) || 'U'}
            </div>
          </div>
        </div>
      </header>

      <main className="p-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#1E293B] to-[#334155] rounded-2xl p-6 mb-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <GraduationCap size={120} />
          </div>
          <h2 className="text-2xl font-bold mb-2 font-display">
            Welcome back{data.userName ? `, ${data.userName}` : ''}!
          </h2>
          <p className="text-white/80">
            Manage bookings, students, and leads from your dashboard.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
                <stat.icon size={24} />
              </div>
              <h3 className="text-3xl font-bold text-[#1E293B]">{stat.value}</h3>
              <p className="text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#1E293B] font-display">
              Recent Bookings
            </h3>
            <Link to="/dashboard/bookings" className="text-sm text-secondary hover:underline">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">Time</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentBookings.slice(0, 5).map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-[#1E293B]">{booking.name}</td>
                    <td className="px-6 py-4 text-gray-500">{booking.date}</td>
                    <td className="px-6 py-4 text-gray-500">{booking.timeSlot}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status || 'pending')}`}>
                        {(booking.status || 'pending').replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.recentBookings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
