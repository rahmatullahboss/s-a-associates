import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, FileText, CheckCircle, XCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { DocumentUploadModal } from '@/components/dashboard/DocumentUploadModal';
import AdminDocumentReview from '@/components/dashboard/AdminDocumentReview';

interface AdminDoc {
  id: number;
  studentId: number;
  studentName: string;
  type: string | null;
  fileName: string;
  fileUrl: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  mimeType?: string | null;
  size?: number | null;
  reviewNote?: string | null;
}

interface User {
  name: string;
  role: string;
  id: number;
}

interface StudentDocument {
  id: number;
  type: string;
  name: string;
  url: string | null;
  status: 'Pending' | 'Verified' | 'Rejected';
  createdAt: string | null;
}

export default function DocumentsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [studentDocs, setStudentDocs] = useState<StudentDocument[]>([]);
  const [allDocs, setAllDocs] = useState<AdminDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ authenticated: boolean; user: User }>('/api/auth/me')
      .then(data => {
        if (!data.authenticated) { navigate('/student/login'); return null; }
        setUser(data.user);
        return apiFetch<{ documents: AdminDoc[] | StudentDocument[] }>('/api/dashboard/documents')
          .then(docData => ({ user: data.user, docData }));
      })
      .then(result => {
        if (!result) return;
        const { user: u, docData } = result;
        if (u.role === 'student') {
          setStudentDocs(docData.documents as StudentDocument[]);
        } else {
          setAllDocs(docData.documents as AdminDoc[]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [navigate]);

  const isAdmin = user?.role === 'admin' || user?.role === 'agent';

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin h-8 w-8 text-secondary" />
    </div>
  );

  // Admin View — use AdminDocumentReview component
  if (isAdmin) {
    // Group docs by student
    const grouped = allDocs.reduce((acc, doc) => {
      const key = doc.studentId;
      if (!acc[key]) {
        acc[key] = {
          userId: doc.studentId,
          name: doc.studentName,
          email: '',
          documents: [],
          totalDocs: 0,
          verifiedDocs: 0,
          pendingDocs: 0,
          rejectedDocs: 0,
        };
      }
      acc[key].documents.push({
        id: doc.id,
        name: doc.fileName,
        type: doc.type,
        mimeType: doc.mimeType || null,
        size: doc.size || null,
        url: doc.fileUrl,
        status: doc.status,
        reviewNote: doc.reviewNote || null,
        createdAt: doc.createdAt,
        reviewedAt: doc.reviewedAt,
      });
      acc[key].totalDocs++;
      if (doc.status === 'Verified') acc[key].verifiedDocs++;
      if (doc.status === 'Pending') acc[key].pendingDocs++;
      if (doc.status === 'Rejected') acc[key].rejectedDocs++;
      return acc;
    }, {} as Record<number, { userId: number; name: string; email: string; documents: { id: number; name: string; type: string | null; mimeType: string | null; size: number | null; url: string; status: 'Pending' | 'Verified' | 'Rejected'; reviewNote: string | null; createdAt: string; reviewedAt: string | null }[]; totalDocs: number; verifiedDocs: number; pendingDocs: number; rejectedDocs: number }>);

    const students = Object.values(grouped);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white">Documents</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Review and approve student documents.</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden" style={{ height: 'calc(100vh - 12rem)' }}>
          {students.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FileText size={48} className="mb-3 opacity-40" />
              <p className="text-sm">No documents uploaded yet.</p>
            </div>
          ) : (
            <AdminDocumentReview students={students} />
          )}
        </div>
      </div>
    );
  }

  // Student View
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-secondary dark:text-white">My Documents</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Upload and manage your documents as advised by your counselor.</p>
        </div>
        <DocumentUploadModal>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-violet-700 text-white text-sm font-medium rounded-xl shadow-sm shadow-primary/20 transition-all">
            <FileText size={18} /> Upload Document
          </button>
        </DocumentUploadModal>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-secondary dark:text-white font-display">Uploaded Documents</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Documents you have uploaded so far.</p>
          </div>
          <span className="text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
            {studentDocs.length} file{studentDocs.length !== 1 ? 's' : ''}
          </span>
        </div>

        {studentDocs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <FileText size={32} />
            </div>
            <h3 className="font-bold text-lg text-secondary dark:text-white mb-2">No Documents Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
              Your counselor will guide you on which documents to upload.
            </p>
            <DocumentUploadModal>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-violet-700 text-white text-sm font-medium rounded-xl shadow-sm shadow-primary/20 transition-all">
                <FileText size={18} /> Upload First Document
              </button>
            </DocumentUploadModal>
          </div>
        ) : (
          <div className="p-6 grid md:grid-cols-2 gap-4">
            {studentDocs.map(doc => (
              <div key={doc.id} className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                doc.status === 'Verified' ? 'border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800' :
                doc.status === 'Rejected' ? 'border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800' :
                'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-800'
              }`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    doc.status === 'Verified' ? 'bg-green-100 text-green-600' :
                    doc.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-secondary dark:text-white text-sm truncate">{doc.type || doc.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{doc.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {doc.url && (
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-medium">View</a>
                  )}
                  {doc.status === 'Verified' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : doc.status === 'Rejected' ? (
                    <XCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <span className="text-xs font-medium text-yellow-600">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
