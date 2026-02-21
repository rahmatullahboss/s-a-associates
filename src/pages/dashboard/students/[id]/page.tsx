import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, User, Mail, Phone, Globe, BookOpen, FolderOpen, Calendar } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  preferredProgram: string | null;
  countryInterest: string | null;
  budgetRange: string | null;
  address: string | null;
  profileCompletion: number | null;
  createdAt: string;
}

interface Booking {
  id: number;
  date: string;
  timeSlot: string;
  status: string;
  meetingLink: string | null;
}

interface Document {
  id: number;
  name: string;
  type: string | null;
  status: string | null;
  createdAt: string;
}

interface Application {
  id: number;
  university: string;
  course: string;
  status: string;
  date: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  Approved: 'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Rejected: 'bg-red-100 text-red-700',
};

export default function StudentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ authenticated: boolean; user: { role: string } }>('/api/auth/me').then(auth => {
      if (!auth.authenticated) { navigate('/admin/login'); return; }
      if (auth.user.role === 'student') { navigate('/dashboard'); return; }
      return apiFetch<{ student: Student; bookings: Booking[]; documents: Document[]; applications: Application[] }>(
        `/api/dashboard/students/${id}`
      );
    }).then(data => {
      if (data) {
        setStudent(data.student);
        setBookings(data.bookings || []);
        setDocs(data.documents || []);
        setApps(data.applications || []);
      }
    }).catch(() => setError('Failed to load student'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin h-8 w-8 text-gray-900" />
    </div>
  );

  if (error || !student) return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 text-center text-red-500">
      {error || 'Student not found'}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/dashboard/students" className="p-2 hover:bg-white rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-900 dark:text-white" />
        </Link>
        <div>
          <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white">{student.name}</h1>
          <p className="text-gray-500 text-sm mt-0.5">Student ID #{student.id}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Profile */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center text-white font-bold text-3xl mb-3">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="font-bold text-xl text-gray-900 dark:text-white">{student.name}</h2>
              <p className="text-gray-500 text-sm">{student.email}</p>
              {student.profileCompletion !== null && (
                <div className="w-full mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Profile Completion</span>
                    <span className="font-medium text-gray-900 dark:text-white">{student.profileCompletion}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${student.profileCompletion}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {[
                { icon: Mail, label: 'Email', value: student.email },
                { icon: Phone, label: 'Phone', value: student.phone },
                { icon: Globe, label: 'Country Interest', value: student.countryInterest },
                { icon: BookOpen, label: 'Preferred Program', value: student.preferredProgram },
                { icon: User, label: 'Budget Range', value: student.budgetRange },
              ].filter(i => i.value).map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 shrink-0">
                    <Icon className="w-3.5 h-3.5 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{label}</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Sessions', value: bookings.length, icon: Calendar, color: 'bg-violet-50 text-violet-600' },
              { label: 'Documents', value: docs.length, icon: FolderOpen, color: 'bg-blue-50 text-blue-600' },
              { label: 'Applications', value: apps.length, icon: BookOpen, color: 'bg-emerald-50 text-emerald-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 text-center">
                <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center mx-auto mb-1`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="font-bold text-xl text-gray-900 dark:text-white">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Bookings, Docs, Apps */}
        <div className="lg:col-span-2 space-y-6">

          {/* Sessions */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Sessions</h2>
            {bookings.length === 0 ? (
              <p className="text-gray-500 text-sm">No sessions yet.</p>
            ) : (
              <div className="space-y-3">
                {bookings.map(b => (
                  <Link
                    key={b.id}
                    to={`/dashboard/bookings/${b.id}`}
                    className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{b.date} — {b.timeSlot}</div>
                        {b.meetingLink && <div className="text-xs text-blue-500 mt-0.5">Meet link attached</div>}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[b.status] || 'bg-gray-100 text-gray-600'}`}>
                      {b.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Documents</h2>
            {docs.length === 0 ? (
              <p className="text-gray-500 text-sm">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {docs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                      <FolderOpen className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</div>
                        {doc.type && <div className="text-xs text-gray-500">{doc.type}</div>}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[doc.status || ''] || 'bg-gray-100 text-gray-600'}`}>
                      {doc.status || 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Applications */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Applications</h2>
            {apps.length === 0 ? (
              <p className="text-gray-500 text-sm">No applications yet.</p>
            ) : (
              <div className="space-y-3">
                {apps.map(app => (
                  <div key={app.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{app.university}</div>
                      <div className="text-xs text-gray-500">{app.course} — {app.date}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[app.status] || 'bg-gray-100 text-gray-600'}`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
