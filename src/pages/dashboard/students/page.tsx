import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Users, Search, ChevronRight, Mail, Phone, Globe } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  preferredProgram: string | null;
  countryInterest: string | null;
  profileCompletion: number | null;
  createdAt: string;
}

export default function StudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiFetch<{ authenticated: boolean; user: { role: string } }>('/api/auth/me').then(auth => {
      if (!auth.authenticated) { navigate('/admin/login'); return; }
      if (auth.user.role === 'student') { navigate('/dashboard'); return; }
      return apiFetch<{ students: Student[] }>('/api/dashboard/students');
    }).then(data => {
      if (data) setStudents(data.students);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [navigate]);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.countryInterest || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin h-8 w-8 text-gray-900" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white">Students</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and view all registered students.</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl px-4 py-2 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-2 text-gray-900 dark:text-white font-bold text-xl">
          <Users className="w-5 h-5 text-gray-900 dark:text-white" />
          {students.length}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by name, email or country..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
        />
      </div>

      {/* Students List */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">No Students Found</h3>
            <p className="text-gray-500 text-sm">No students match your search.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map(student => (
              <Link
                key={student.id}
                to={`/dashboard/students/${student.id}`}
                className="flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-secondary dark:bg-gray-700 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{student.name}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{student.email}</span>
                      {student.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{student.phone}</span>}
                      {student.countryInterest && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{student.countryInterest}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {student.profileCompletion !== null && (
                    <div className="hidden sm:flex flex-col items-end gap-1">
                      <span className="text-xs text-gray-500">Profile</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-secondary rounded-full"
                            style={{ width: `${student.profileCompletion}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-900 dark:text-white">{student.profileCompletion}%</span>
                      </div>
                    </div>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
