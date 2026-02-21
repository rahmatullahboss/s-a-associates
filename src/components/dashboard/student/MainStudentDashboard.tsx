'use client';

import { 
  FileText, 
  FolderOpen, 
  Upload, 
  Plus, 
  Check, 
  Gavel, 
  Plane, 
  Info,
} from 'lucide-react';

import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getProfile } from '@/actions/profile';
import { apiFetch } from '@/lib/api';

export default function MainStudentDashboard() {
  const [user, setUser] = useState<{name: string, id: string} | null>(null);
  const [stats, setStats] = useState<{documents: number, applied: number, applications?: {id: number, university: string, course: string, status: string, date: string}[]}>({ documents: 0, applied: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Fetch user profile for name/ID
        const profile = await getProfile();
        if (profile?.user) {
          setUser({
            name: profile.user.name || 'Student',
            id: `SA-${profile.user.id.toString().padStart(3, '0')}`
          });
        }

        // Fetch dashboard stats (documents, applications)
        const data = await apiFetch<{ applications?: {id: number, university: string, course: string, status: string, date: string}[], stats?: { documentsUploaded: number, applicationsSubmitted: number } }>('/api/dashboard');
            setStats({
                documents: data.stats?.documentsUploaded || 0,
                applied: data.stats?.applicationsSubmitted || 0,
                applications: data.applications || []
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
            <p className="text-gray-500 dark:text-gray-400 mt-1">Here's what's happening with your study abroad applications.</p>
          </div>
          <div className="flex gap-3">
              <Link to="/dashboard/documents" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-secondary dark:text-gray-200 text-sm font-medium rounded-xl shadow-sm transition-all">
                <Upload size={18} />
                Upload Doc
              </Link>
              <Link to="/dashboard/applications/new" className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-violet-700 text-white text-sm font-medium rounded-xl shadow-sm shadow-primary/20 transition-all">
                <Plus size={18} />
                New Application
              </Link>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            {/* Application Status Card */}
            {stats.applications && stats.applications.length > 0 ? stats.applications.map((app, index) => (
              <div key={app.id || index} className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                  <div>
                    <h3 className="font-bold text-lg text-secondary dark:text-white">{app.university}</h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">{app.course} • {app.date}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                    app.status.toLowerCase().includes('review') 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      : app.status.toLowerCase().includes('accept')
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                  }`}>
                    {app.status.toUpperCase()}
                  </span>
                </div>
                <div className="p-8">
                  {/* Timeline Placeholder */}
                  <div className="relative flex justify-between items-center text-center">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 dark:bg-gray-800 -z-0 -translate-y-1/2 rounded-full"></div>
                    <div className="absolute top-1/2 left-0 w-1/4 h-1 bg-gradient-to-r from-primary to-accent -z-0 -translate-y-1/2 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
                    
                    {/* Status Points */}
                    <div className="relative z-10 flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 border-4 border-white dark:border-gray-900">
                        <Check size={14} strokeWidth={3} />
                      </div>
                      <span className="text-xs font-bold text-primary">Submitted</span>
                    </div>
                    <div className="relative z-10 flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-900 border-4 border-accent flex items-center justify-center shadow-lg shadow-accent/20">
                        <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>
                      </div>
                      <span className="text-xs font-bold text-secondary dark:text-white">Under Review</span>
                    </div>
                    <div className="relative z-10 flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center border-4 border-white dark:border-gray-900">
                        <Gavel size={14} />
                      </div>
                      <span className="text-xs font-medium text-gray-400">Decision</span>
                    </div>
                    <div className="relative z-10 flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center border-4 border-white dark:border-gray-900">
                        <Plane size={14} />
                      </div>
                      <span className="text-xs font-medium text-gray-400">Visa</span>
                    </div>
                  </div>
                  
                  {app.status.toLowerCase().includes('review') && (
                    <div className="mt-8 bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 flex items-start gap-4 border border-blue-100 dark:border-blue-900/30">
                      <Info className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" size={20} />
                      <div>
                        <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100">Latest Update</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          We are reviewing your application to {app.university} for the {app.course} program. This usually takes 5-7 business days.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 mb-4">
                  <FileText size={32} />
                </div>
                <h3 className="font-bold text-lg text-secondary dark:text-white mb-2">No Applications Yet</h3>
                <p className="text-gray-500 max-w-sm mb-6">You haven't submitted any applications. Click "New Application" to start your journey.</p>
                <Link to="/dashboard/applications/new" className="px-5 py-2.5 bg-primary hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2">
                  <Plus size={20} />
                  New Application
                </Link>
              </div>
            )}
          {/* Removed Recommended Universities Section */}
          </div>

          <div className="space-y-8">
            {/* Removed Action Required Section */}

            {/* Stats */}
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
                <h4 className="text-2xl font-bold text-secondary dark:text-white">{stats.applied}</h4>
                <p className="text-xs text-gray-500">Applied</p>
              </div>
            </div>

            {/* Removed Promo Card */}
          </div>
        </div>
    </div>
  );
}
