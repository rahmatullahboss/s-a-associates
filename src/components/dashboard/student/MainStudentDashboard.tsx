'use client';

import { 
  FileText, 
  FolderOpen, 
  Upload, 
} from 'lucide-react';

import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getProfile } from '@/actions/profile';
import { apiFetch } from '@/lib/api';

export default function MainStudentDashboard() {
  const [user, setUser] = useState<{name: string, id: string} | null>(null);
  const [stats, setStats] = useState<{documents: number, bookings: number}>({ documents: 0, bookings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const profile = await getProfile();
        if (profile?.user) {
          setUser({
            name: profile.user.name || 'Student',
            id: `SA-${profile.user.id.toString().padStart(3, '0')}`
          });
        }

        const data = await apiFetch<{ stats?: { documentsUploaded: number, total: number } }>('/api/dashboard');
        setStats({
            documents: data.stats?.documentsUploaded || 0,
            bookings: data.stats?.total || 0
        });
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-8">
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-3xl text-secondary dark:text-white">Welcome back, {user?.name.split(' ')[0]}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Here's your document status and booking overview.</p>
          </div>
          <div className="flex gap-3">
              <Link to="/dashboard/documents" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-secondary dark:text-gray-200 text-sm font-medium rounded-xl shadow-sm transition-all">
                <Upload size={18} />
                Upload Doc
              </Link>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
              <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 mb-4">
                  <FileText size={32} />
                </div>
                <h3 className="font-bold text-lg text-secondary dark:text-white mb-2">No Bookings Yet</h3>
                <p className="text-gray-500 max-w-sm">Book a free counseling session to get started with your study abroad journey.</p>
              </div>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-violet-50 to-white dark:from-gray-800 dark:to-gray-900 p-4 rounded-2xl border border-violet-100 dark:border-gray-700 text-center">
                <div className="w-10 h-10 mx-auto bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center text-primary mb-2">
                  <FolderOpen size={20} />
                </div>
                <h4 className="text-2xl font-bold text-secondary dark:text-white">{stats.documents}</h4>
                <p className="text-xs text-gray-500">Documents</p>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-white dark:from-gray-800 dark:to-gray-900 p-4 rounded-2xl border border-pink-100 dark:border-gray-700 text-center">
                <div className="w-10 h-10 mx-auto bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center text-accent mb-2">
                  <FileText size={20} />
                </div>
                <h4 className="text-2xl font-bold text-secondary dark:text-white">{stats.bookings}</h4>
                <p className="text-xs text-gray-500">Bookings</p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
