import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import SettingsForm from '@/components/dashboard/SettingsForm';
import { apiFetch } from '@/lib/api';
import type { SiteSettings } from '@/lib/site-settings.types';

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
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ settings: SiteSettings }>('/api/settings')
      .then(data => {
        setSettings(data.settings);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load settings');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-gray-900" /></div>;

  if (error) return <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white">Site Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your website content, branding and configuration.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
        <SettingsForm initialSettings={settings!} />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
        <AccountSecuritySection />
      </div>
    </div>
  );
}
