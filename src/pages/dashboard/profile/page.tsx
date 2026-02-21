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
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 font-display text-[#1E293B]">My Profile</h1>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 font-display text-[#1E293B]">My Profile</h1>
            <p className="text-red-500">Failed to load profile. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2 font-display text-[#1E293B]">My Profile</h1>
        <p className="text-gray-500 mb-8">Manage your personal information and study preferences.</p>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <ProfileForm user={data.user} profile={data.profile} />
        </div>
      </div>
    </div>
  );
}
