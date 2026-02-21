import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, Calendar, Clock, User, Mail, Phone, Video, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Booking {
  id: number;
  name: string;
  email: string;
  phone: string;
  date: string;
  timeSlot: string;
  status: string;
  meetLink: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BookingEvent {
  id: number;
  status: string;
  createdAt: string;
  note: string | null;
}

interface User {
  name: string;
  role: string;
}

export default function BookingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<{ authenticated: boolean; user: User }>('/api/auth/me'),
      apiFetch<{ booking: Booking; events: BookingEvent[] }>(`/api/dashboard/bookings/${id}`)
    ])
      .then(([authData, bookingData]) => {
        if (!authData.authenticated) {
          navigate('/student/login');
          return;
        }
        setUser(authData.user);
        setBooking(bookingData.booking);
        setEvents(bookingData.events || []);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load booking');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleStatusChange = async (newStatus: string) => {
    if (!booking || !confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) return;
    
    setUpdating(true);
    try {
      const result = await apiFetch<{ success: boolean; booking: Booking; events: BookingEvent[] }>(`/api/dashboard/bookings/${booking.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      
      if (result.success) {
        setBooking(result.booking);
        setEvents(result.events || []);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update booking');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'agent';

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;
  if (error || !booking) return <div className="p-8 text-red-500">{error || 'Booking not found'}</div>;

  return (
    <div>
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-30 border-b border-gray-100">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard/bookings" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className="text-2xl font-bold text-[#1E293B] font-display">Booking Details</h1>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(booking.status)}`}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
        </div>
      </header>

      <main className="p-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-[#1E293B] mb-4">Client Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Name</div>
                    <div className="font-medium text-[#1E293B]">{booking.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="font-medium text-[#1E293B]">{booking.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Phone</div>
                    <div className="font-medium text-[#1E293B]">{booking.phone}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-[#1E293B] mb-4">Session Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Date</div>
                    <div className="font-medium text-[#1E293B]">{new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Time Slot</div>
                    <div className="font-medium text-[#1E293B]">{booking.timeSlot}</div>
                  </div>
                </div>
              </div>

              {booking.meetLink && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Video className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-700">Google Meet Link</span>
                  </div>
                  <a 
                    href={booking.meetLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {booking.meetLink}
                  </a>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-[#1E293B] mb-4">Timeline</h2>
              <div className="space-y-4">
                {events.map((event, index) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-500' : 'bg-gray-300'}`} />
                      {index < events.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1" />}
                    </div>
                    <div className="pb-4">
                      <div className="font-medium text-[#1E293B] capitalize">{event.status.replace('_', ' ')}</div>
                      <div className="text-sm text-gray-500">{new Date(event.createdAt).toLocaleString()}</div>
                      {event.note && <div className="text-sm text-gray-600 mt-1">{event.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {isAdmin && booking.status !== 'cancelled' && booking.status !== 'completed' && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-bold text-[#1E293B] mb-4">Actions</h2>
                <div className="space-y-2">
                  {booking.status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange('confirmed')}
                      disabled={updating}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {updating ? 'Processing...' : 'Confirm Booking'}
                    </button>
                  )}
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusChange('completed')}
                      disabled={updating}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {updating ? 'Processing...' : 'Mark Completed'}
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusChange('cancelled')}
                    disabled={updating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    {updating ? 'Processing...' : 'Cancel Booking'}
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-[#1E293B] mb-4">Booking Info</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Booking ID</span>
                  <span className="font-medium text-[#1E293B]">#{booking.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="font-medium text-[#1E293B]">{new Date(booking.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="font-medium text-[#1E293B]">{new Date(booking.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
