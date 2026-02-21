import { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import DashboardLayoutClient from "@/components/dashboard/DashboardLayoutClient";
import { apiFetch } from '@/lib/api';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; role: string; id: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ authenticated: boolean; user: { name: string; role: string; id: number } }>('/api/auth/me')
      .then(data => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          navigate('/student/login');
        }
      })
      .catch((err) => {
        console.error("Auth check failed", err);
        navigate('/student/login');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <DashboardLayoutClient user={{ name: user.name, role: user.role }}>
      <Outlet />
    </DashboardLayoutClient>
  );
}
