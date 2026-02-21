import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Users, Mail, Phone, Calendar, Globe, BookOpen, Wallet } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  program: string;
  budget: string;
  countryInterest: string | null;
  source: string;
  createdAt: string;
}

export default function LeadsPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiFetch<{ leads: Lead[] }>('/api/dashboard/leads')
      .then(data => setLeads(data.leads || []))
      .catch(() => setError('Failed to load leads'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const filtered = leads.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.email.toLowerCase().includes(search.toLowerCase()) ||
    (l.countryInterest || '').toLowerCase().includes(search.toLowerCase()) ||
    l.program.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin h-8 w-8 text-gray-900" />
    </div>
  );

  if (error) return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 text-center text-red-500">{error}</div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white">Leads</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">All website form submissions and inquiries.</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl px-4 py-2 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-2 text-gray-900 dark:text-white font-bold text-xl">
          <Users className="w-5 h-5" />
          {leads.length}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3">
        <Users className="w-5 h-5 text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by name, email, country or program..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
        />
      </div>

      {/* Leads Table */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">No Leads Found</h3>
            <p className="text-gray-500 text-sm">No leads match your search.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map(lead => (
              <div key={lead.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-gray-900 dark:bg-gray-700 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{lead.name}</div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>
                        {lead.countryInterest && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{lead.countryInterest}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                    <Calendar className="w-3 h-3" />
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 ml-15 flex-wrap">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                    <BookOpen className="w-3 h-3" />{lead.program}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                    <Wallet className="w-3 h-3" />{lead.budget}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium capitalize">{lead.source}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
