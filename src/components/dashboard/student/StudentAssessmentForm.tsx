'use client';

import { User, CloudUpload, FileText, ArrowRight, X, Loader2, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '@/actions/profile';

export default function StudentAssessmentForm() {
    const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    budgetRange: 'Select Budget Range',
    preferredProgram: '',
    address: '',
    countryInterest: ''
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getProfile();
        if (data?.user) {
            setFormData(prev => ({
                ...prev,
                name: data.user.name,
                email: data.user.email,
                phone: data.profile?.phone || '',
                budgetRange: data.profile?.budgetRange || 'Select Budget Range',
                preferredProgram: data.profile?.preferredProgram || '',
                address: data.profile?.address || '',
                countryInterest: data.profile?.countryInterest || ''
            }));
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateProfile({
        name: formData.name,
        phone: formData.phone,
        budgetRange: formData.budgetRange === 'Select Budget Range' ? '' : formData.budgetRange,
        preferredProgram: formData.preferredProgram,
        address: formData.address,
        countryInterest: formData.countryInterest
      });

      if (res.success) {
        alert("Profile saved successfully!");
        window.location.reload();
      } else {
        alert("Failed to save profile: " + res.error);
      }
    } catch (error) {
       console.error(error);
       alert("An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setUploading(true);
      
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("name", selectedFile.name);
      fd.append("type", "Transcript");

      try {
        // await uploadDocument(...)
        setUploadSuccess(true);
      } catch {
        alert("Upload failed");
        setFile(null);
      } finally {
        setUploading(false);
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>;
  }

  const inputClass = "w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-gray-400 dark:placeholder:text-gray-500 py-3 px-4 transition-colors";
  const labelClass = "text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 sm:px-8 py-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="font-bold text-xl sm:text-2xl text-secondary dark:text-white">Student Assessment</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Complete all fields accurately for the best assessment.</p>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Step 1 of 2</span>
          <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
            <div className="w-1/2 h-full bg-primary rounded-full"></div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-10">
        {/* Personal Information */}
        <section>
          <h2 className="text-lg font-bold text-secondary dark:text-white mb-6 flex items-center gap-2">
            <User className="text-primary" size={20} />
            Personal Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className={labelClass}>Full Name</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name" 
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Email Address</label>
              <input 
                type="email" 
                value={formData.email}
                readOnly
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed py-3 px-4"
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. +8801XXXXXXXXX"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Budget Range (বাজেট)</label>
              <select
                name="budgetRange"
                value={formData.budgetRange}
                onChange={handleChange}
                className={inputClass}
              >
                <option>Select Budget Range</option>
                <option value="<12lakh">&#2547;12 লাখের কম</option>
                <option value="12-25lakh">&#2547;12 - &#2547;25 লাখ</option>
                <option value="25-35lakh">&#2547;25 - &#2547;35 লাখ</option>
                <option value=">35lakh">&#2547;35 লাখের বেশি</option>
              </select>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <label className={labelClass}>Preferred Program / Course</label>
              <input 
                type="text" 
                name="preferredProgram"
                value={formData.preferredProgram}
                onChange={handleChange}
                placeholder="e.g. Bachelor of Computer Science" 
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <div className="border-t border-gray-100 dark:border-gray-700"></div>

        {/* Documents */}
        <section>
          <h2 className="text-lg font-bold text-secondary dark:text-white mb-6 flex items-center gap-2">
            <CloudUpload className="text-primary" size={20} />
            Documents
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-gray-700">
            <div>
              <label className={`${labelClass} mb-3 block`}>Upload Transcripts &amp; Certificates</label>
              
              {!file ? (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center hover:border-primary dark:hover:border-primary hover:bg-secondary/5 dark:hover:bg-secondary/10 transition-all cursor-pointer group bg-white dark:bg-gray-800 relative">
                  <input 
                    type="file" 
                    onChange={handleFileUpload} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="bg-secondary/10 dark:bg-secondary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    {uploading ? <Loader2 className="animate-spin text-primary" /> : <CloudUpload className="text-primary" size={28} />}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                    <span className="text-primary hover:underline">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Any file (max. 10MB)</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg text-red-600 dark:text-red-400 mr-3 flex-shrink-0">
                      <FileText size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    {uploadSuccess ? (
                      <CheckCircle className="text-green-500 flex-shrink-0 ml-2" size={20} />
                    ) : (
                      <button type="button" onClick={() => { setFile(null); setUploadSuccess(false); }} className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2 transition-colors">
                        <X size={20} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
          <button type="button" className="w-full sm:w-auto px-6 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition-colors">
            Save Draft
          </button>
          <button 
            type="submit" 
            disabled={saving}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                Next Step
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
