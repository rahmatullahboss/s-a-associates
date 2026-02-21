import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, Calendar, Clock, User, Mail, Phone, Video, CheckCircle, XCircle, ArrowLeft, FileText } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Booking {
  id: number;
  name: string;
  email: string;
  phone: string;
  date: string;
  timeSlot: string;
  status: string;
  meetingLink: string | null;
  agentNote: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BookingEvent {
  id: number;
  eventType: string;
  toStatus: string | null;
  createdAt: string;
}

interface UserInfo {
  name: string;
  role: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed: 'bg-green-100 text-green-700 border-green-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

export default function BookingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [meetLink, setMeetLink] = useState('');
  const [agentNote, setAgentNote] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch<{ authenticated: boolean; user: UserInfo }>('/api/auth/me'),
      apiFetch<{ booking: Booking; events: BookingEvent[] }>(`/api/dashboard/bookings/${id}`)
    ])
      .then(([authData, bookingData]) => {
        if (!authData.authenticated) { navigate('/student/login'); return; }
        setUser(authData.user);
        setBooking(bookingData.booking);
        setEvents(bookingData.events || []);
        setMeetLink(bookingData.booking.meetingLink || '');
        setAgentNote(bookingData.booking.agentNote || '');
      })
      .catch(() => setError('Failed to load booking'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleAction = async (newStatus: string) => {
    if (!booking) return;
    setUpdating(true);
    try {
      const result = await apiFetch<{ success: boolean; booking: Booking; events: BookingEvent[] }>(
        `/api/dashboard/bookings/${booking.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: newStatus, meetLink, agentNote })
        }
      );
      if (result.success) {
        setBooking(result.booking);
        setEvents(result.events || []);
      }
    } catch {
      alert('Failed to update booking');
    } finally {
      setUpdating(false);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'agent';
  const isStudent = user?.role === 'student';

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin h-8 w-8 text-primary" />
    </div>
  );

  if (error || !booking) return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 text-center text-red-500">
      {error || 'Booking not found'}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/bookings"
            className="p-2 hover:bg-white rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-secondary dark:text-white" />
          </Link>
          <div>
            <h1 className="font-display font-bold text-3xl text-secondary dark:text-white">
              Session Details
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Booking #{booking.id}</p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${statusColors[booking.status] || 'bg-gray-100 text-gray-700'}`}>
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Info + Timeline */}
        <div className="lg:col-span-2 space-y-6">

          {/* Client Info */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="font-bold text-lg text-secondary dark:text-white mb-4">Client Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: User, label: 'Name', value: booking.name, color: 'bg-violet-50 text-violet-600' },
                { icon: Mail, label: 'Email', value: booking.email, color: 'bg-violet-50 text-violet-600' },
                { icon: Phone, label: 'Phone', value: booking.phone, color: 'bg-violet-50 text-violet-600' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{label}</div>
                    <div className="font-medium text-secondary dark:text-white">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Session Details */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="font-bold text-lg text-secondary dark:text-white mb-4">Session Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Date</div>
                  <div className="font-medium text-secondary dark:text-white">
                    {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Time Slot</div>
                  <div className="font-medium text-secondary dark:text-white">{booking.timeSlot}</div>
                </div>
              </div>
            </div>

            {/* Meet Link — shown to student if confirmed */}
            {booking.meetingLink && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-700">
                <div className="flex items-center gap-2 mb-2">
                  <Video className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-700 dark:text-green-400">Google Meet Link</span>
                </div>
                <a
                  href={booking.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all text-sm"
                >
                  {booking.meetingLink}
                </a>
              </div>
            )}

            {booking.agentNote && isStudent && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-700 dark:text-blue-400 text-sm">Note from Counsellor</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{booking.agentNote}</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="font-bold text-lg text-secondary dark:text-white mb-4">Timeline</h2>
            {events.length === 0 ? (
              <p className="text-gray-500 text-sm">No events yet.</p>
            ) : (
              <div className="space-y-4">
                {events.map((event, index) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full mt-1 ${index === 0 ? 'bg-primary' : 'bg-gray-300'}`} />
                      {index < events.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                    </div>
                    <div className="pb-4">
                      <div className="font-medium text-secondary dark:text-white capitalize">
                        {event.toStatus ? `Status → ${event.toStatus}` : event.eventType.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-gray-500">{new Date(event.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="space-y-6">

          {/* Admin Actions */}
          {isAdmin && booking.status !== 'cancelled' && booking.status !== 'completed' && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="font-bold text-lg text-secondary dark:text-white mb-4">Actions</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Meet Link</Label>
                  <Input
                    value={meetLink}
                    onChange={e => setMeetLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Note for Student</Label>
                  <textarea
                    value={agentNote}
                    onChange={e => setAgentNote(e.target.value)}
                    placeholder="Any message for the student..."
                    className="w-full border border-input rounded-xl px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-2 pt-2">
                  {booking.status === 'pending' && (
                    <button
                      onClick={() => handleAction('confirmed')}
                      disabled={updating}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 font-medium text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {updating ? 'Processing...' : 'Confirm & Save'}
                    </button>
                  )}
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleAction('completed')}
                      disabled={updating}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 font-medium text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {updating ? 'Processing...' : 'Mark Completed'}
                    </button>
                  )}
                  <button
                    onClick={() => handleAction('cancelled')}
                    disabled={updating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 font-medium text-sm"
                  >
                    <XCircle className="w-4 h-4" />
                    {updating ? 'Processing...' : 'Cancel Session'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Booking Info */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="font-bold text-lg text-secondary dark:text-white mb-4">Booking Info</h2>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Booking ID', value: `#${booking.id}` },
                { label: 'Created', value: new Date(booking.createdAt).toLocaleDateString() },
                { label: 'Last Updated', value: new Date(booking.updatedAt).toLocaleDateString() },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-secondary dark:text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
