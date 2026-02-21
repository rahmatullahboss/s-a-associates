import { useEffect, useState } from 'react';
import { getProfile } from '@/actions/profile';
import ProfileForm from '@/components/dashboard/ProfileForm';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface ProfileData {
  id: number;
  userId: number;
  phone: string | null;
  address: string | null;
  preferredProgram: string | null;
  budgetRange: string | null;
  countryInterest: string | null;
  profileCompletion: number | null;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ user: UserData; profile: ProfileData | null } | null>(null);

  useEffect(() => {
    getProfile().then((result) => {
      setData(result as { user: UserData; profile: ProfileData | null });
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
        <p className="text-red-500">Failed to load profile. Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-3xl text-secondary dark:text-white">My Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your personal information and study preferences.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
        <ProfileForm user={data.user} profile={data.profile} />
      </div>
    </div>
  );
}
