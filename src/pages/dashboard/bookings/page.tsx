import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Search, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Booking {
  id: number;
  name: string;
  email: string;
  phone: string;
  date: string;
  timeSlot: string;
  status: string;
}

interface Stats {
  pending?: number;
  confirmed?: number;
  [key: string]: number | undefined;
}

interface User {
  name: string;
  role: string;
  [key: string]: unknown;
}

export default function BookingsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{bookings: Booking[], stats: Stats, user: User} | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      apiFetch<{ authenticated: boolean; user: User }>('/api/auth/me'),
      apiFetch<{ bookings: Booking[]; stats: Stats }>('/api/dashboard/bookings')
    ]).then(([authData, bookingsData]) => {
      if (!authData.authenticated) {
        navigate('/student/login');
        return;
      }
      setData({ user: authData.user, bookings: bookingsData.bookings || [], stats: bookingsData.stats || {} });
      setLoading(false);
    }).catch(e => {
        console.error(e);
        setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  if (!data) return <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 text-center text-red-500">Error loading data.</div>;

  const { user, bookings: allBookings, stats: statusCounts } = data;
  const isAdmin = user?.role === 'admin' || user?.role === 'agent';

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

  // Student view
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display font-bold text-3xl text-secondary dark:text-white">My Sessions</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Track your free counselling sessions and their status.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm text-center">
            <div className="text-2xl font-bold text-secondary dark:text-white">{allBookings.length}</div>
            <div className="text-xs text-gray-500 mt-1">Total Bookings</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-yellow-100 dark:border-gray-700 shadow-sm text-center">
            <div className="text-2xl font-bold text-yellow-600">{statusCounts?.pending || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Pending</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-green-100 dark:border-gray-700 shadow-sm text-center">
            <div className="text-2xl font-bold text-green-600">{statusCounts?.confirmed || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Confirmed</div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-secondary dark:text-white font-display">All Bookings</h3>
          </div>
          {allBookings.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 mb-4">
                <Calendar size={32} />
              </div>
              <h3 className="font-bold text-lg text-secondary dark:text-white mb-2">No Sessions Yet</h3>
              <p className="text-gray-500 max-w-sm">You haven't booked any free counselling sessions yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {allBookings.map((booking: Booking) => (
                <div key={booking.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-primary flex-shrink-0">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <div className="font-semibold text-secondary dark:text-white">{booking.date}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{booking.timeSlot}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status || 'pending')}`}>
                      {(booking.status || 'pending').replace('_', ' ')}
                    </span>
                    <Link
                      to={`/dashboard/bookings/${booking.id}`}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin view
  return (
    <div>
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-30 border-b border-gray-100 hidden lg:block">
        <div className="flex items-center justify-between px-8 py-4">
          <h1 className="text-2xl font-bold text-[#1E293B] font-display">All Bookings</h1>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#1E293B] rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="hidden md:block">
              <p className="font-medium text-[#1E293B]">{user?.name}</p>
              <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-8">
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-[#1E293B]">{allBookings.length}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-700">{statusCounts?.pending || 0}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200">
            <div className="text-2xl font-bold text-green-700">{statusCounts?.confirmed || 0}</div>
            <div className="text-sm text-gray-500">Confirmed</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#1E293B] font-display">Bookings</h3>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">
                <Search size={16} /> Search
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">Date & Time</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allBookings.map((booking: Booking) => (
                  <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-[#1E293B]">{booking.name}</div>
                      <div className="text-sm text-gray-500">{booking.email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{booking.phone}</td>
                    <td className="px-6 py-4">
                      <div className="text-[#1E293B]">{booking.date}</div>
                      <div className="text-sm text-gray-500">{booking.timeSlot}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(booking.status || 'pending')}`}>
                        {(booking.status || 'pending').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/dashboard/bookings/${booking.id}`} className="text-secondary hover:underline">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
                {allBookings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No bookings found.</p>
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
