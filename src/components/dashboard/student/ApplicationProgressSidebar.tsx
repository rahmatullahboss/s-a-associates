'use client';

import { User, UploadCloud, CheckCircle, MessagesSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSiteSettings } from '@/lib/site-settings-context';

function WhatsAppLink() {
  const settings = useSiteSettings();
  const cleanNumber = settings.whatsappNumber.replace(/[\s+\-()]/g, '');

  return (
    <a
      href={cleanNumber ? `https://wa.me/${cleanNumber}` : '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-xl transition-all relative z-10 font-semibold text-sm"
    >
      <MessagesSquare size={18} className="text-green-400" />
      <span>Chat on WhatsApp</span>
    </a>
  );
}

interface StepProps {
  icon: React.ElementType;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  isLast?: boolean;
}

const Step = ({ icon: Icon, title, status, isLast }: StepProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'bg-white dark:bg-gray-900 text-green-500 border-green-500';
      case 'in-progress': return 'bg-primary text-white border-primary shadow-lg shadow-primary/30';
      default: return 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500';
    }
  };

  const getTextColor = () => {
    switch (status) {
      case 'completed': return 'text-green-600 dark:text-green-400 font-medium';
      case 'in-progress': return 'text-secondary dark:text-white font-bold';
      default: return 'text-gray-500 dark:text-gray-400 font-medium';
    }
  };

  const getSubTextColor = () => {
    switch (status) {
      case 'in-progress': return 'text-primary font-medium';
      default: return 'text-gray-400 dark:text-gray-500';
    }
  };

  return (
    <div className={cn("relative pl-10", !isLast && "pb-8")}>
      {!isLast && (
        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 -translate-x-1/2" />
      )}
      <div className={cn(
        "absolute left-0 top-0 h-8 w-8 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-300",
        getStatusColor()
      )}>
        <Icon size={14} />
      </div>
      <div>
        <h4 className={cn("text-sm transition-colors", getTextColor())}>{title}</h4>
        <p className={cn("text-xs mt-1 transition-colors", getSubTextColor())}>
          {status === 'in-progress' ? 'In Progress' : status === 'completed' ? 'Completed' : 'Pending'}
        </p>
      </div>
    </div>
  );
};

export default function ApplicationProgressSidebar() {
  return (
    <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-5">
      {/* Progress Card */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="font-bold text-lg text-secondary dark:text-white mb-6">Application Progress</h3>
        <div className="relative space-y-0">
          <Step 
            icon={User} 
            title="Personal Information" 
            status="in-progress" 
          />
          <Step 
            icon={UploadCloud} 
            title="Document Upload" 
            status="pending" 
          />
          <Step 
            icon={CheckCircle} 
            title="Review & Submit" 
            status="pending" 
            isLast
          />
        </div>
      </div>

      {/* Need Assistance Card */}
      <div className="bg-gradient-to-br from-secondary to-primary rounded-3xl shadow-lg p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <h3 className="font-bold text-lg mb-2 relative z-10">Need Assistance?</h3>
        <p className="text-sm text-white/70 mb-5 relative z-10">
          Our counselors are online and ready to help you with your application.
        </p>
        <WhatsAppLink />
      </div>
    </aside>
  );
}
