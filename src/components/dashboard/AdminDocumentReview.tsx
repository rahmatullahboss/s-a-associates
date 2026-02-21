'use client';

import { useState, useMemo, useTransition } from 'react';
import {
  Search,
  FileText,
  Image,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  File,
  ChevronLeft,
} from 'lucide-react';

type StatusFilter = 'all' | 'Pending' | 'Verified' | 'Rejected';

interface Document {
  id: number;
  name: string;
  type: string | null;
  mimeType: string | null;
  size: number | null;
  url: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  reviewNote: string | null;
  createdAt: string | null;
  reviewedAt: string | null;
}

interface StudentWithDocuments {
  userId: number;
  name: string;
  email: string;
  documents: Document[];
  totalDocs: number;
  verifiedDocs: number;
  pendingDocs: number;
  rejectedDocs: number;
}

interface Props {
  students: StudentWithDocuments[];
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return <File size={20} className="text-gray-400" />;
  if (mimeType === 'application/pdf') return <FileText size={20} className="text-red-500" />;
  if (mimeType.startsWith('image/')) return <Image size={20} className="text-blue-500" />;
  return <File size={20} className="text-gray-400" />;
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusBadge({ status }: { status: string | null }) {
  switch (status) {
    case 'Verified':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
          <CheckCircle size={12} /> Verified
        </span>
      );
    case 'Rejected':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
          <XCircle size={12} /> Rejected
        </span>
      );
    case 'Pending':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
          <Clock size={12} /> Pending
        </span>
      );
  }
}

function StudentStatusDot({ student }: { student: StudentWithDocuments }) {
  if (student.rejectedDocs > 0) return <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />;
  if (student.pendingDocs > 0) return <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />;
  if (student.verifiedDocs === student.totalDocs && student.totalDocs > 0) return <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />;
  return <span className="w-2.5 h-2.5 rounded-full bg-gray-300 flex-shrink-0" />;
}

export default function AdminDocumentReview({ students: initialStudents }: Props) {
  const [students, setStudents] = useState(initialStudents);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewingDocId, setReviewingDocId] = useState<number | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [isPending, startTransition] = useTransition();

  const filteredStudents = useMemo(() => {
    let result = students;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((s) => {
        if (statusFilter === 'Pending') return s.pendingDocs > 0;
        if (statusFilter === 'Verified') return s.verifiedDocs > 0;
        if (statusFilter === 'Rejected') return s.rejectedDocs > 0;
        return true;
      });
    }

    return result;
  }, [students, searchQuery, statusFilter]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.userId === selectedStudentId) ?? null,
    [students, selectedStudentId]
  );

  const reviewingDoc = useMemo(
    () => selectedStudent?.documents.find((d) => d.id === reviewingDocId) ?? null,
    [selectedStudent, reviewingDocId]
  );

  function handleReview(status: 'Verified' | 'Rejected') {
    if (!reviewingDocId) return;
    startTransition(async () => {
      try {
        setStudents((prev) =>
          prev.map((s) => {
            if (s.userId !== selectedStudentId) return s;
            const updatedDocs = s.documents.map((d) =>
              d.id === reviewingDocId ? {                ...d, 
 
                status, 
                reviewNote: reviewNote || null, 
                reviewedAt: new Date().toISOString() 
              } : d
            );
            return {
              ...s,
              documents: updatedDocs,
              totalDocs: updatedDocs.length,
              verifiedDocs: updatedDocs.filter((d) => d.status === 'Verified').length,
              pendingDocs: updatedDocs.filter((d) => d.status === 'Pending').length,
              rejectedDocs: updatedDocs.filter((d) => d.status === 'Rejected').length,
            };
          })
        );
        setReviewNote('');
        setReviewingDocId(null);
      } catch {
        alert('Failed to review document. Please try again.');
      }
    });
  }

  const filterTabs: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Verified', value: 'Verified' },
    { label: 'Rejected', value: 'Rejected' },
  ];

  // Mobile: show list, detail, or review depending on state
  const showMobileList = !selectedStudentId;
  const showMobileDetail = selectedStudentId && !reviewingDocId;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-0 bg-gray-50">
      {/* ─── Left Panel: Student Queue ─── */}
      <div
        className={`${
          showMobileList ? 'flex' : 'hidden'
        } lg:flex flex-col w-full lg:w-80 xl:w-96 border-r border-gray-200 bg-white flex-shrink-0`}
      >
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-[#1E293B] mb-3">Students</h2>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F26522]/30 focus:border-[#F26522]"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                  statusFilter === tab.value
                    ? 'bg-[#1E293B] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto">
          {filteredStudents.length === 0 && (
            <div className="p-6 text-center text-gray-400 text-sm">No students found.</div>
          )}
          {filteredStudents.map((student) => (
            <button
              key={student.userId}
              onClick={() => {
                setSelectedStudentId(student.userId);
                setReviewingDocId(null);
                setReviewNote('');
              }}
              className={`w-full text-left p-4 border-b border-gray-100 transition-colors hover:bg-gray-50 ${
                selectedStudentId === student.userId
                  ? 'bg-[#F26522]/5 border-l-2 border-l-[#F26522]'
                  : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-[#1E293B] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#1E293B] truncate">{student.name}</span>
                    <StudentStatusDot student={student} />
                  </div>
                  <p className="text-xs text-gray-400 truncate">{student.email}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{
                          width: student.totalDocs > 0
                            ? `${(student.verifiedDocs / student.totalDocs) * 100}%`
                            : '0%',
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {student.verifiedDocs}/{student.totalDocs}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Center Panel: Document Workspace ─── */}
      <div
        className={`${
          showMobileDetail ? 'flex' : selectedStudentId ? 'hidden lg:flex' : 'hidden lg:flex'
        } ${showMobileList ? 'hidden lg:flex' : ''} flex-col flex-1 min-w-0`}
      >
        {!selectedStudent ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <FileText size={48} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">Select a student to view their documents</p>
            </div>
          </div>
        ) : (
          <>
            {/* Student Header */}
            <div className="p-4 lg:p-6 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedStudentId(null);
                    setReviewingDocId(null);
                  }}
                  className="lg:hidden p-1 rounded hover:bg-gray-100"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-full bg-[#1E293B] text-white flex items-center justify-center text-base font-bold">
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-[#1E293B] truncate">{selectedStudent.name}</h3>
                  <p className="text-sm text-gray-400">{selectedStudent.email}</p>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {selectedStudent.verifiedDocs} of {selectedStudent.totalDocs} verified
                  </span>
                  {selectedStudent.pendingDocs > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 animate-pulse">
                      <Clock size={10} /> In Review
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Document List */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3">
              {selectedStudent.documents.length === 0 && (
                <div className="text-center text-gray-400 py-12 text-sm">
                  No documents uploaded yet.
                </div>
              )}
              {selectedStudent.documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`bg-white rounded-xl border p-4 transition-colors ${
                    reviewingDocId === doc.id
                      ? 'border-[#F26522]/30 ring-1 ring-[#F26522]/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* File Icon */}
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      {getFileIcon(doc.mimeType)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[#1E293B] truncate">{doc.name}</span>
                        {doc.type && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-[#1E293B]/10 text-[#1E293B]">
                            {doc.type}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400">{formatFileSize(doc.size)}</span>
                        <span className="text-xs text-gray-400">
                          {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </div>

                    {/* Status + Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={doc.status} />
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#1E293B] transition-colors"
                        title="View document"
                      >
                        <Eye size={16} />
                      </a>
                      {doc.status === 'Pending' && (
                        <button
                          onClick={() => {
                            setReviewingDocId(doc.id);
                            setReviewNote('');
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#F26522] text-white hover:bg-[#F26522]/90 transition-colors"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Review Note (if already reviewed) */}
                  {doc.reviewNote && doc.status !== 'Pending' && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Review note:</span> {doc.reviewNote}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ─── Right Panel: Decision + Summary ─── */}
      <div
        className={`${
          reviewingDocId ? 'flex' : 'hidden lg:flex'
        } flex-col w-full lg:w-80 xl:w-96 border-l border-gray-200 bg-white flex-shrink-0`}
      >
        {selectedStudent ? (
          <div className="flex-1 overflow-y-auto">
            {/* Document Summary */}
            <div className="p-4 lg:p-5 border-b border-gray-200">
              <h3 className="text-sm font-bold text-[#1E293B] mb-3">Document Summary</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-[#1E293B]">{selectedStudent.totalDocs}</div>
                  <div className="text-xs text-gray-400">Total</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-green-600">{selectedStudent.verifiedDocs}</div>
                  <div className="text-xs text-gray-400">Verified</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-amber-600">{selectedStudent.pendingDocs}</div>
                  <div className="text-xs text-gray-400">Pending</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-red-600">{selectedStudent.rejectedDocs}</div>
                  <div className="text-xs text-gray-400">Rejected</div>
                </div>
              </div>
            </div>

            {/* Review Panel */}
            {reviewingDoc ? (
              <div className="p-4 lg:p-5">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => setReviewingDocId(null)}
                    className="lg:hidden p-1 rounded hover:bg-gray-100"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <h3 className="text-sm font-bold text-[#1E293B]">Review Document</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4 truncate">{reviewingDoc.name}</p>

                {/* Note */}
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Internal Note</label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Add a note (optional)..."
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#F26522]/30 focus:border-[#F26522] resize-none mb-4"
                />

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReview('Verified')}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-lg bg-[#1E293B] text-white hover:bg-[#1E293B]/90 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle size={16} />
                    {isPending ? 'Saving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReview('Rejected')}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-lg border-2 border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    {isPending ? 'Saving...' : 'Reject'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 lg:p-5">
                <div className="text-center text-gray-400 py-8">
                  <FileText size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Click &quot;Review&quot; on a pending document to start reviewing</p>
                </div>
              </div>
            )}

            {/* Activity Log */}
            {selectedStudent && (
              <div className="p-4 lg:p-5 border-t border-gray-200">
                <h3 className="text-sm font-bold text-[#1E293B] mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {selectedStudent.documents
                    .filter((d) => d.reviewedAt)
                    .sort((a, b) => {
                      const aTime = a.reviewedAt ? new Date(a.reviewedAt).getTime() : 0;
                      const bTime = b.reviewedAt ? new Date(b.reviewedAt).getTime() : 0;
                      return bTime - aTime;
                    })
                    .slice(0, 5)
                    .map((doc) => (
                      <div key={doc.id} className="flex items-start gap-2 text-xs">
                        {doc.status === 'Verified' ? (
                          <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                          <span className="font-medium text-[#1E293B]">{doc.name}</span>{' '}
                          <span className="text-gray-400">
                            {doc.status === 'Verified' ? 'approved' : 'rejected'}
                          </span>
                          <div className="text-gray-400">
                            {doc.reviewedAt ? new Date(doc.reviewedAt).toLocaleDateString() : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  {selectedStudent.documents.filter((d) => d.reviewedAt).length === 0 && (
                    <p className="text-xs text-gray-400">No review activity yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-sm">Select a student to see their summary</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
