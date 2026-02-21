import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, FileText, CheckCircle, XCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { DocumentUploadModal } from '@/components/dashboard/DocumentUploadModal';

interface Document {
  id: number;
  studentId: number;
  studentName: string;
  type: string;
  fileName: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
}

interface User {
  name: string;
  role: string;
  id: number;
}

interface StudentDocument {
  id: number;
  type: string;
  fileName: string | null;
  fileUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string | null;
}

const REQUIRED_DOCS = [
  'SSC Result',
  'HSC Result', 
  'Transcript',
  'BSc Result'
];

export default function DocumentsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [studentDocs, setStudentDocs] = useState<StudentDocument[]>([]);
  const [allDocs, setAllDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ authenticated: boolean; user: User }>('/api/auth/me')
      .then(data => {
        if (!data.authenticated) {
          navigate('/student/login');
          return null;
        }
        setUser(data.user);
        return { user: data.user, docs: apiFetch<{ documents: Document[] | StudentDocument[] }>('/api/dashboard/documents') };
      })
      .then(result => {
        if (!result) return;
        const { user: currentUser, docs } = result;
        return docs.then(docData => ({ currentUser, docData }));
      })
      .then(result => {
        if (!result) return;
        const { currentUser, docData } = result;
        if (currentUser.role === 'student') {
          setStudentDocs(docData.documents as StudentDocument[]);
        } else {
          setAllDocs(docData.documents as Document[]);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [navigate]);

  const isAdmin = user?.role === 'admin' || user?.role === 'agent';

  const getStudentDocStatus = (docType: string) => {
    const doc = studentDocs.find(d => d.type === docType);
    if (!doc || !doc.fileUrl) return 'missing';
    return doc.status;
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;

  if (isAdmin) {
    const groupedDocs = allDocs.reduce((acc, doc) => {
      const key = doc.studentId;
      if (!acc[key]) acc[key] = { studentId: doc.studentId, studentName: doc.studentName, documents: [] };
      acc[key].documents.push(doc);
      return acc;
    }, {} as Record<number, { studentId: number; studentName: string; documents: Document[] }>);

    return (
      <div>
        <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-30 border-b border-gray-100 hidden lg:block">
          <div className="flex items-center justify-between px-8 py-4">
            <h1 className="text-2xl font-bold text-[#1E293B] font-display">Documents</h1>
          </div>
        </header>

        <main className="p-8">
          {Object.keys(groupedDocs).length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No documents uploaded yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.values(groupedDocs).map(group => (
                <div key={group.studentId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                    <h3 className="font-bold text-[#1E293B]">{group.studentName}</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {REQUIRED_DOCS.map(docType => {
                        const doc = group.documents.find(d => d.type === docType);
                        return (
                          <div key={docType} className="p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-[#1E293B]">{docType}</span>
                              {doc?.status === 'approved' ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : doc?.status === 'rejected' ? (
                                <XCircle className="w-5 h-5 text-red-500" />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-yellow-100" />
                              )}
                            </div>
                            {doc ? (
                              <a 
                                href={doc.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {doc.fileName}
                              </a>
                            ) : (
                              <span className="text-sm text-gray-400">Not uploaded</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div>
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-30 border-b border-gray-100 hidden lg:block">
        <div className="flex items-center justify-between px-8 py-4">
            <h1 className="text-2xl font-bold text-[#1E293B] font-display">My Documents</h1>
            <DocumentUploadModal>
              <button className="px-4 py-2 bg-[#1E293B] text-white rounded-lg hover:bg-[#0F172A]">
                Upload Document
              </button>
            </DocumentUploadModal>
        </div>
      </header>

      <main className="p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-[#1E293B] mb-4">Required Documents</h2>
          <p className="text-gray-500 mb-6">Please upload the following documents for your application process.</p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {REQUIRED_DOCS.map(docType => {
              const status = getStudentDocStatus(docType);
              return (
                <div key={docType} className={`p-4 rounded-lg border ${
                  status === 'approved' ? 'border-green-200 bg-green-50' :
                  status === 'rejected' ? 'border-red-200 bg-red-50' :
                  status === 'missing' ? 'border-gray-200 bg-gray-50' : 'border-yellow-200 bg-yellow-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-[#1E293B]">{docType}</span>
                    {status === 'approved' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : status === 'rejected' ? (
                      <XCircle className="w-5 h-5 text-red-600" />
                    ) : status === 'missing' ? (
                      <span className="text-xs text-gray-400">Missing</span>
                    ) : (
                      <span className="text-xs text-yellow-600">Pending Review</span>
                    )}
                  </div>
                  {status !== 'missing' && (
                    <div className="text-sm text-gray-500">
                      {studentDocs.find(d => d.type === docType)?.uploadedAt 
                        ? `Uploaded ${new Date(studentDocs.find(d => d.type === docType)!.uploadedAt!).toLocaleDateString()}`
                        : 'Uploaded'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Please upload PDF or image files (JPG, PNG). Maximum file size is 10MB.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
