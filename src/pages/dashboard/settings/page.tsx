import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import SettingsForm from '@/components/dashboard/SettingsForm';
import AvailabilitySettings from '@/components/dashboard/AvailabilitySettings';
import { apiFetch } from '@/lib/api';
import type { SiteSettings } from '@/lib/site-settings.types';
import { DEFAULT_SITE_SETTINGS } from '@/lib/site-settings.types';

function AccountSecuritySection() {
  const [form, setForm] = useState({ currentPassword: '', newEmail: '', newPassword: '', confirmPassword: '' });
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!form.currentPassword) {
      setStatus({ type: 'error', message: 'Current password is required.' });
      return;
    }
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    if (!form.newEmail && !form.newPassword) {
      setStatus({ type: 'error', message: 'Please enter a new email or new password to update.' });
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/api/profile/credentials', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newEmail: form.newEmail || undefined,
          newPassword: form.newPassword || undefined,
        }),
      });
      setStatus({ type: 'success', message: 'Credentials updated successfully.' });
      setForm({ currentPassword: '', newEmail: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Update failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="w-5 h-5 text-gray-900" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Account Security</h2>
      </div>
      <p className="text-sm text-muted-foreground">Change your login email or password. You must confirm your current password to make changes.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Current Password <span className="text-red-500">*</span></label>
          <input
            type="password"
            value={form.currentPassword}
            onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
            placeholder="Enter your current password"
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">New Email</label>
            <input
              type="email"
              value={form.newEmail}
              onChange={e => setForm(f => ({ ...f, newEmail: e.target.value }))}
              placeholder="Leave blank to keep current"
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">New Password</label>
            <input
              type="password"
              value={form.newPassword}
              onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
              placeholder="Leave blank to keep current"
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1 md:col-start-2">
            <label className="text-sm font-medium">Confirm New Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              placeholder="Repeat new password"
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {status && (
          <p className={`text-sm font-medium ${status.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
            {status.message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Updating...' : 'Update Credentials'}
        </button>
      </form>
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'availability' | 'tracking' | 'security'>('general');

  useEffect(() => {
    // Check auth first
    apiFetch<{ authenticated: boolean; user: { role: string } }>('/api/auth/me')
      .then(auth => {
        if (!auth.authenticated) { 
          navigate('/admin/login'); 
          return;
        }
        if (auth.user.role === 'student') { 
          navigate('/dashboard'); 
          return;
        }
        // Load settings
        return apiFetch<{ settings: Partial<SiteSettings> }>('/api/settings');
      })
      .then(data => {
        if (data?.settings) {
          // Merge with defaults - DB values override defaults
          setSettings({ ...DEFAULT_SITE_SETTINGS, ...data.settings });
        }
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load settings');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-gray-900" /></div>;

  if (error) return <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 text-red-500">{error}</div>;

  const tabs = [
    { key: 'general', label: 'General' },
    { key: 'availability', label: '🗓 Availability' },
    { key: 'tracking', label: '📊 Tracking' },
    { key: 'security', label: 'Security' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-display font-black text-3xl text-slate-900 dark:text-white tracking-tight">Site Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Manage your website content, branding and availability configuration.</p>
      </div>

      {/* Premium Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 w-fit shadow-inner">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-slate-900 text-[#137fec] shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
          <div className="mb-6 pb-5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">General Settings</h2>
            <p className="text-slate-500 text-sm mt-0.5">Manage your brand, content and booking configuration.</p>
          </div>
          <SettingsForm initialSettings={settings} />
        </div>
      )}

      {/* Availability Tab */}
      {activeTab === 'availability' && (
        <AvailabilitySettings />
      )}

      {/* Tracking Tab */}
      {activeTab === 'tracking' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">📊 Tracking & Analytics Setup</h2>
            <p className="text-slate-500 text-sm mt-0.5">Facebook Pixel, Conversion API এবং Google Analytics সেটআপ করুন।</p>
          </div>

          {/* Bangla Tutorial */}
          <div className="p-6 sm:p-8 space-y-8">

            {/* Step 1 — Pixel ID */}
            <div className="rounded-2xl border border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-black flex items-center justify-center shrink-0">১</span>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Facebook Pixel ID কোথায় পাবেন?</h3>
              </div>
              <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-none ml-0">
                <li className="flex gap-2"><span className="text-blue-500 font-bold shrink-0">→</span> <span><a href="https://business.facebook.com/events_manager" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">business.facebook.com/events_manager</a> এ যান</span></li>
                <li className="flex gap-2"><span className="text-blue-500 font-bold shrink-0">→</span> <span>বাম দিকে আপনার <strong>Pixel</strong> এ ক্লিক করুন</span></li>
                <li className="flex gap-2"><span className="text-blue-500 font-bold shrink-0">→</span> <span>উপরে <strong>Settings</strong> ট্যাবে যান</span></li>
                <li className="flex gap-2"><span className="text-blue-500 font-bold shrink-0">→</span> <span><strong>"Pixel ID"</strong> দেখতে পাবেন — সেটি কপি করুন</span></li>
                <li className="flex gap-2"><span className="text-blue-500 font-bold shrink-0">→</span> <span>নিচের <strong>General Settings → Tracking & Analytics → Facebook Pixel ID</strong> ফিল্ডে পেস্ট করুন</span></li>
              </ol>
            </div>

            {/* Step 2 — CAPI Token */}
            <div className="rounded-2xl border border-purple-100 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-900/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-black flex items-center justify-center shrink-0">২</span>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Meta Conversions API (CAPI) Access Token</h3>
              </div>
              <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-none ml-0">
                <li className="flex gap-2"><span className="text-purple-500 font-bold shrink-0">→</span> <span>Events Manager এ আপনার Pixel এ যান</span></li>
                <li className="flex gap-2"><span className="text-purple-500 font-bold shrink-0">→</span> <span><strong>Settings</strong> ট্যাবে ক্লিক করুন</span></li>
                <li className="flex gap-2"><span className="text-purple-500 font-bold shrink-0">→</span> <span>নিচে স্ক্রল করলে <strong>"Conversions API"</strong> সেকশন পাবেন</span></li>
                <li className="flex gap-2"><span className="text-purple-500 font-bold shrink-0">→</span> <span><strong>"Generate access token"</strong> বাটনে ক্লিক করুন</span></li>
                <li className="flex gap-2"><span className="text-purple-500 font-bold shrink-0">→</span> <span>লম্বা token টি কপি করে <strong>General Settings → Meta Conversions API Access Token</strong> ফিল্ডে পেস্ট করুন 🔒</span></li>
              </ol>
              <div className="mt-4 bg-purple-100 dark:bg-purple-900/30 rounded-xl p-3 text-xs text-purple-700 dark:text-purple-300">
                💡 <strong>কেন দরকার?</strong> Facebook Pixel শুধু browser এ কাজ করে — ad blocker বা iOS privacy দিয়ে block হতে পারে। CAPI সরাসরি server থেকে Meta তে event পাঠায়, তাই কোনো conversion miss হয় না।
              </div>
            </div>

            {/* Step 3 — Test Event Code */}
            <div className="rounded-2xl border border-amber-100 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-900/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-amber-500 text-white text-sm font-black flex items-center justify-center shrink-0">৩</span>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Test Event Code দিয়ে Verify করুন (Optional কিন্তু Recommended)</h3>
              </div>
              <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-none ml-0">
                <li className="flex gap-2"><span className="text-amber-500 font-bold shrink-0">→</span> <span>Events Manager → আপনার Pixel → <strong>Test Events</strong> ট্যাবে যান</span></li>
                <li className="flex gap-2"><span className="text-amber-500 font-bold shrink-0">→</span> <span><strong>"Test server events"</strong> সেকশনে একটি code দেখবেন যেমন <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">TEST12345</code></span></li>
                <li className="flex gap-2"><span className="text-amber-500 font-bold shrink-0">→</span> <span>সেটি <strong>General Settings → Meta Test Event Code</strong> ফিল্ডে দিন এবং Save করুন</span></li>
                <li className="flex gap-2"><span className="text-amber-500 font-bold shrink-0">→</span> <span>এখন website এ গিয়ে Lead form বা Booking করুন — Events Manager এ real-time দেখাবে</span></li>
                <li className="flex gap-2"><span className="text-amber-500 font-bold shrink-0">→</span> <span>✅ Verified হলে Test Event Code ফিল্ড <strong>খালি করে Save</strong> করুন — production এ দরকার নেই</span></li>
              </ol>
            </div>

            {/* Step 4 — Microsoft Clarity */}
            <div className="rounded-2xl border border-cyan-100 dark:border-cyan-900 bg-cyan-50/50 dark:bg-cyan-900/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-cyan-600 text-white text-sm font-black flex items-center justify-center shrink-0">৪</span>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Microsoft Clarity — Session Recording & Heatmap</h3>
              </div>
              <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-none ml-0">
                <li className="flex gap-2"><span className="text-cyan-500 font-bold shrink-0">→</span> <span><a href="https://clarity.microsoft.com" target="_blank" rel="noopener noreferrer" className="text-cyan-600 underline font-semibold">clarity.microsoft.com</a> এ যান এবং Sign in করুন</span></li>
                <li className="flex gap-2"><span className="text-cyan-500 font-bold shrink-0">→</span> <span><strong>"New Project"</strong> ক্লিক করুন → আপনার website URL দিন</span></li>
                <li className="flex gap-2"><span className="text-cyan-500 font-bold shrink-0">→</span> <span>Project তৈরি হলে <strong>Settings → Overview</strong> এ যান</span></li>
                <li className="flex gap-2"><span className="text-cyan-500 font-bold shrink-0">→</span> <span><strong>"Project ID"</strong> কপি করুন — যেমন <code className="bg-cyan-100 dark:bg-cyan-900 px-1 rounded">abc123xyz</code></span></li>
                <li className="flex gap-2"><span className="text-cyan-500 font-bold shrink-0">→</span> <span>সেটি <strong>General Settings → Tracking → Microsoft Clarity Project ID</strong> ফিল্ডে পেস্ট করুন</span></li>
              </ol>
              <div className="mt-4 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl p-3 text-xs text-cyan-700 dark:text-cyan-300">
                💡 <strong>কেন দরকার?</strong> Clarity দিয়ে দেখতে পাবেন user রা কোথায় click করছে, কোথায় scroll করছে, কোথায় আটকে যাচ্ছে — সম্পূর্ণ free! Session recording এবং heatmap পাবেন।
              </div>
            </div>

            {/* Step 5 — Google Analytics */}
            <div className="rounded-2xl border border-green-100 dark:border-green-900 bg-green-50/50 dark:bg-green-900/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-green-600 text-white text-sm font-black flex items-center justify-center shrink-0">৫</span>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Google Analytics 4 (GA4) Measurement ID</h3>
              </div>
              <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-none ml-0">
                <li className="flex gap-2"><span className="text-green-500 font-bold shrink-0">→</span> <span><a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-green-600 underline font-semibold">analytics.google.com</a> এ যান</span></li>
                <li className="flex gap-2"><span className="text-green-500 font-bold shrink-0">→</span> <span>বাম নিচে <strong>Admin (⚙️)</strong> এ ক্লিক করুন</span></li>
                <li className="flex gap-2"><span className="text-green-500 font-bold shrink-0">→</span> <span><strong>Data Streams</strong> → আপনার website stream এ ক্লিক করুন</span></li>
                <li className="flex gap-2"><span className="text-green-500 font-bold shrink-0">→</span> <span>উপরে <strong>"Measurement ID"</strong> দেখবেন — যেমন <code className="bg-green-100 dark:bg-green-900 px-1 rounded">G-XXXXXXXXXX</code></span></li>
                <li className="flex gap-2"><span className="text-green-500 font-bold shrink-0">→</span> <span>সেটি <strong>General Settings → Google Analytics Measurement ID</strong> ফিল্ডে পেস্ট করুন</span></li>
              </ol>
            </div>

            {/* Step 5 — Events tracked */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-slate-700 text-white text-sm font-black flex items-center justify-center shrink-0">৬</span>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">কোন কোন Events Automatically Track হচ্ছে?</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { event: 'PageView', trigger: 'প্রতিটি page visit এ (শুধু public pages)', method: 'Pixel' },
                  { event: 'Lead', trigger: 'Lead form submit করলে', method: 'Pixel + CAPI ✅' },
                  { event: 'Contact', trigger: 'WhatsApp button click করলে', method: 'Pixel' },
                  { event: 'Schedule', trigger: 'Consultation book করলে', method: 'Pixel + CAPI ✅' },
                  { event: 'Lead', trigger: 'Consultation book করলে (ad optimization)', method: 'Pixel + CAPI ✅' },
                  { event: 'CompleteRegistration', trigger: 'Student signup করলে', method: 'Pixel + CAPI ✅' },
                ].map((e, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{e.event}</span>
                        <p className="text-xs text-slate-500 mt-0.5">{e.trigger}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${e.method.includes('CAPI') ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {e.method}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick link to General Settings */}
            <div className="text-center">
              <button
                onClick={() => setActiveTab('general')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#137fec] text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:brightness-110 transition-all"
              >
                ⚙️ General Settings এ যান → Tracking & Analytics
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
          <div className="mb-6 pb-5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Account Security</h2>
            <p className="text-slate-500 text-sm mt-0.5">Protect your admin account with a strong password.</p>
          </div>
          <AccountSecuritySection />
        </div>
      )}
    </div>
  );
}
