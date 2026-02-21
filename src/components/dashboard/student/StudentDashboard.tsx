'use client';

import { useState, useEffect } from 'react';
import StudentAssessmentForm from '@/components/dashboard/student/StudentAssessmentForm';
import MainStudentDashboard from '@/components/dashboard/student/MainStudentDashboard';
import { getProfile } from '@/actions/profile';
import { Loader2 } from 'lucide-react';

export default function StudentDashboard() {
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkProfile() {
      try {
        const data = await getProfile();
        // Simple check: if phone and program are set, consider it "complete" enough for dashboard
        // In real app, you might check a specific status field
        if (data?.profile?.phone && data?.profile?.preferredProgram) {
            setProfileComplete(true);
        } else {
            setProfileComplete(false);
        }
      } catch (error) {
        console.error("Failed to check profile", error);
        setProfileComplete(false);
      } finally {
        setLoading(false);
      }
    }
    checkProfile();
  }, []);

  if (loading) {
    return (
        <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
            <Loader2 className="animate-spin text-primary" size={32} />
        </div>
    );
  }

  return (
    <div className="student-theme min-h-screen bg-gray-100 dark:bg-gray-950 font-sans">
      <main className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {profileComplete ? (
            <MainStudentDashboard />
        ) : (
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 justify-center">
               <div className="flex-1 max-w-4xl">
                 <StudentAssessmentForm />
               </div>
            </div>
        )}
      </main>
    </div>
  );
}
