import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Users, Mail, Phone, Calendar } from 'lucide-react';
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

  useEffect(() => {
    apiFetch<{ leads: Lead[] }>('/api/dashboard/leads')
      .then(data => {
        setLeads(data.leads || []);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load leads');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;

  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div>
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-30 border-b border-gray-100 hidden lg:block">
        <div className="flex items-center justify-between px-8 py-4">
          <h1 className="text-2xl font-bold text-[#1E293B] font-display">Leads</h1>
        </div>
      </header>

      <main className="p-8">
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#1E293B]">{leads.length}</div>
                <div className="text-sm text-gray-500">Total Leads</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">Program</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">Budget</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">Country</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-[#1E293B]">{lead.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {lead.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {lead.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{lead.program}</td>
                    <td className="px-6 py-4 text-gray-600">{lead.budget}</td>
                    <td className="px-6 py-4 text-gray-600">{lead.countryInterest || '-'}</td>
                    <td className="px-6 py-4 text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      <Users size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No leads found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
