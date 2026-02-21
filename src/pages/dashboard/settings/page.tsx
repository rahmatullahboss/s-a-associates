import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import SettingsForm from '@/components/dashboard/SettingsForm';
import { apiFetch } from '@/lib/api';
import type { SiteSettings } from '@/lib/site-settings.types';

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

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;

  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Site Settings</h1>
      <SettingsForm initialSettings={settings!} />
    </div>
  );
}
