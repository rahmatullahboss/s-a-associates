"use client";

import { useState, useTransition, useRef } from "react";
import { saveSiteSettingsAction, uploadCeoPhotoAction, uploadUniversityLogoAction } from "@/actions/settings";
import type { SiteSettings } from "@/lib/site-settings.types";
import imageCompression from 'browser-image-compression';
import {
  UploadCloud, Loader2, CheckCircle, Trash2,
  Building2, LayoutTemplate, User, BarChart3,
  CalendarCheck, GraduationCap, Link, Save, X, BarChart2
} from "lucide-react";

export default function SettingsForm({ initialSettings }: { initialSettings: SiteSettings }) {
  const [form, setForm] = useState<SiteSettings>(initialSettings);
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>(initialSettings.ceoProfile?.photo || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const markDirty = (key: string) => setDirtyFields(prev => new Set(prev).add(key));

  function onChange<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    markDirty(key);
  }

  function onNestedChange(parent: keyof SiteSettings, key: string, value: string) {
    setForm((prev) => {
      const parentObj = (prev[parent] as Record<string, unknown>) || {};
      return { ...prev, [parent]: { ...parentObj, [key]: value } };
    });
    markDirty(parent);
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    if (dirtyFields.size === 0) { setMessage({ type: "error", text: "No changes to save." }); return; }
    const changedData: Partial<SiteSettings> = {};
    dirtyFields.forEach(key => {
      const k = key as keyof SiteSettings;
      if (k in form) (changedData as Record<string, unknown>)[k] = form[k];
    });
    startTransition(async () => {
      const result = await saveSiteSettingsAction(changedData as SiteSettings);
      setMessage(result.success
        ? { type: "success", text: "Settings saved successfully!" }
        : { type: "error", text: result.error ?? "Update failed." }
      );
      if (result.success) setDirtyFields(new Set());
      setTimeout(() => setMessage(null), 4000);
    });
  };

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhotoUploading(true);
      const compressed = new File(
        [await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 800, useWebWorker: true, fileType: "image/webp" })],
        file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: "image/webp" }
      );
      setPhotoPreview(URL.createObjectURL(compressed));
      const fd = new FormData(); fd.append("file", compressed);
      const result = await uploadCeoPhotoAction(fd);
      if (result.success && result.url) {
        setPhotoPreview(result.url);
        setForm(prev => ({ ...prev, ceoProfile: { ...prev.ceoProfile, name: prev.ceoProfile?.name ?? "", photo: result.url } }));
        markDirty("ceoProfile");
      } else {
        setPhotoPreview(initialSettings.ceoProfile?.photo || "");
      }
    } catch { setPhotoPreview(initialSettings.ceoProfile?.photo || ""); }
    finally { setPhotoUploading(false); }
  }

  async function handleUniversityLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLogoUploading(true);
      const compressed = new File(
        [await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 600, useWebWorker: true, fileType: "image/webp" })],
        file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: "image/webp" }
      );
      const fd = new FormData(); fd.append("file", compressed);
      const result = await uploadUniversityLogoAction(fd);
      if (result.success && result.url) {
        const newLogo = { id: Date.now().toString(), url: result.url, name: file.name.split('.')[0] };
        setForm(prev => ({ ...prev, universityLogos: [...(prev.universityLogos || []), newLogo] }));
        markDirty("universityLogos");
      }
    } catch { /* silent */ }
    finally { setLogoUploading(false); }
  }

  const removeUniversityLogo = (id: string) => {
    setForm(prev => ({ ...prev, universityLogos: prev.universityLogos?.filter(l => l.id !== id) || [] }));
    markDirty("universityLogos");
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-[#137fec]/20 focus:border-[#137fec] outline-none transition-all text-sm";
  const labelCls = "text-sm font-semibold text-slate-700 dark:text-slate-300";

  return (
    <form onSubmit={onSubmit}>

      {/* ── 1. Brand Identity ── */}
      <Section icon={<Building2 className="w-4 h-4 text-[#137fec]" />} title="Brand Identity" alt>
        <div className="grid md:grid-cols-2 gap-5">
          <Field label="Company Name">
            <input className={inputCls} value={form.companyName} onChange={e => onChange("companyName", e.target.value)} />
          </Field>
          <Field label="Business Email">
            <input className={inputCls} type="email" value={form.companyEmail} onChange={e => onChange("companyEmail", e.target.value)} />
          </Field>
          <Field label="Phone Number">
            <input className={inputCls} value={form.companyPhone} onChange={e => onChange("companyPhone", e.target.value)} />
          </Field>
          <Field label="WhatsApp Number">
            <input className={inputCls} value={form.whatsappNumber} onChange={e => onChange("whatsappNumber", e.target.value)} />
          </Field>
          <Field label="Primary Color (Hex)">
            <div className="flex gap-2">
              <div className="flex items-center gap-3 flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div className="w-6 h-6 rounded-md shadow-sm border border-white/50" style={{ backgroundColor: form.primaryColor || "#137fec" }} />
                <span className="text-sm font-medium">{form.primaryColor || "#137fec"}</span>
              </div>
              <input
                type="color"
                value={form.primaryColor || "#137fec"}
                onChange={e => onChange("primaryColor", e.target.value)}
                className="w-12 h-12 rounded-xl border border-slate-200 cursor-pointer bg-transparent p-1"
                title="Pick brand color"
              />
            </div>
          </Field>
          <Field label="Facebook URL">
            <input className={inputCls} value={form.facebookUrl} onChange={e => onChange("facebookUrl", e.target.value)} />
          </Field>
          <Field label="Logo URL">
            <input className={inputCls} value={form.companyLogo || ""} onChange={e => onChange("companyLogo", e.target.value)} />
          </Field>
          <Field label="Favicon URL">
            <input className={inputCls} value={form.companyFavicon || ""} onChange={e => onChange("companyFavicon", e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* ── 2. Hero Section ── */}
      <Section icon={<LayoutTemplate className="w-4 h-4 text-[#137fec]" />} title="Hero Section Content">
        <div className="space-y-5">
          <Field label="Headline">
            <input className={inputCls} value={form.heroHeadline} onChange={e => onChange("heroHeadline", e.target.value)} />
          </Field>
          <Field label="Subheadline">
            <textarea
              rows={3}
              value={form.heroSubheadline}
              onChange={e => onChange("heroSubheadline", e.target.value)}
              className={inputCls + " resize-none"}
            />
          </Field>
        </div>
      </Section>

      {/* ── 3. CEO Profile ── */}
      <Section icon={<User className="w-4 h-4 text-[#137fec]" />} title="CEO Profile" alt>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Photo Upload */}
          <div className="w-full md:w-44 shrink-0">
            <label className={labelCls + " mb-2 block"}>Profile Photo</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center cursor-pointer hover:border-[#137fec] hover:bg-blue-50/50 transition-all group overflow-hidden relative"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="CEO" className="absolute inset-0 w-full h-full object-cover object-top" />
              ) : (
                <span className="text-4xl font-black text-slate-300">{form.ceoProfile?.name?.charAt(0) || "?"}</span>
              )}
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {photoUploading
                  ? <Loader2 className="w-7 h-7 text-white animate-spin" />
                  : <><UploadCloud className="w-6 h-6 text-white mb-1" /><span className="text-[10px] font-bold text-white uppercase tracking-wider">Change Photo</span></>
                }
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoUpload} disabled={photoUploading} />
          </div>

          <div className="flex-1 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="CEO Name">
                <input className={inputCls} value={form.ceoProfile?.name || ""} onChange={e => onNestedChange("ceoProfile", "name", e.target.value)} />
              </Field>
              <Field label="Designation">
                <input className={inputCls} placeholder="Chief Executive Officer" value={form.ceoProfile?.bio?.split("\n")[0] || ""} onChange={e => onNestedChange("ceoProfile", "bio", e.target.value)} />
              </Field>
            </div>
            <Field label="Short Bio">
              <textarea
                rows={4}
                value={form.ceoProfile?.bio || ""}
                onChange={e => onNestedChange("ceoProfile", "bio", e.target.value)}
                className={inputCls + " resize-none"}
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── 4. Key Metrics ── */}
      <Section icon={<BarChart3 className="w-4 h-4 text-[#137fec]" />} title="Key Metrics (Stats)">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { label: "Visa Success Rate", key: "visaSuccessRate", placeholder: "98%", icon: "✅" },
            { label: "Partner Universities", key: "universitiesCount", placeholder: "500+", icon: "🏛️" },
            { label: "Students Placed", key: "studentsCount", placeholder: "1000+", icon: "👥" },
          ].map(m => (
            <div key={m.key} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{m.label}</span>
                <span className="text-lg">{m.icon}</span>
              </div>
              <input
                className="text-2xl font-black w-full bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-slate-900 dark:text-white"
                value={(form.metrics as Record<string, string>)?.[m.key] || ""}
                placeholder={m.placeholder}
                onChange={e => onNestedChange("metrics", m.key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </Section>

      {/* ── 5. Booking Settings ── */}
      <Section icon={<CalendarCheck className="w-4 h-4 text-[#137fec]" />} title="Booking Settings" alt>
        <div className="space-y-5">
          <Field label="Google Meet / Zoom Personal Link">
            <div className="relative">
              <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className={inputCls + " pl-11"}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                value={form.defaultMeetLink || ""}
                onChange={e => onChange("defaultMeetLink", e.target.value)}
              />
            </div>
          </Field>
          <div className="grid md:grid-cols-3 gap-5">
            <Field label="Session Duration">
              <select
                className={inputCls}
                value={form.slotDuration ?? 60}
                onChange={e => onChange("slotDuration", Number(e.target.value) as SiteSettings["slotDuration"])}
              >
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
                <option value={90}>90 Minutes</option>
              </select>
            </Field>
            <Field label="Buffer Time">
              <select
                className={inputCls}
                value={form.bufferTime ?? 0}
                onChange={e => onChange("bufferTime", Number(e.target.value) as SiteSettings["bufferTime"])}
              >
                <option value={0}>No Buffer</option>
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
              </select>
            </Field>
            <Field label="Max Daily Bookings">
              <input
                type="number" min={1} max={50}
                className={inputCls}
                value={form.maxBookingsPerDay ?? 8}
                onChange={e => onChange("maxBookingsPerDay", Number(e.target.value) as SiteSettings["maxBookingsPerDay"])}
              />
            </Field>
          </div>
          <Field label="Advance Booking Days" className="max-w-xs">
            <input
              type="number" min={1} max={90}
              className={inputCls}
              value={form.advanceBookingDays ?? 14}
              onChange={e => onChange("advanceBookingDays", Number(e.target.value) as SiteSettings["advanceBookingDays"])}
            />
          </Field>
        </div>
      </Section>

      {/* ── 6. University Logos ── */}
      <Section icon={<GraduationCap className="w-4 h-4 text-[#137fec]" />} title="Partner University Logos">
        <p className="text-xs text-slate-400 mb-4 font-medium">Allowed: PNG, JPG, SVG, WebP (Auto-compressed)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {form.universityLogos?.map((logo) => (
            <div key={logo.id} className="aspect-video rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center p-3 relative group">
              <img src={logo.url} alt={logo.name || "University Logo"} className="max-h-full max-w-full object-contain grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
              <button
                type="button"
                onClick={() => removeUniversityLogo(logo.id)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg hover:bg-red-600"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className="aspect-video rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 hover:border-[#137fec] transition-all flex flex-col items-center justify-center gap-1 group"
          >
            {logoUploading
              ? <Loader2 className="w-5 h-5 text-[#137fec] animate-spin" />
              : <><UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-[#137fec] transition-colors" /><span className="text-[10px] font-bold text-slate-500 group-hover:text-[#137fec] uppercase tracking-wider">Add Logo</span></>
            }
          </button>
          <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleUniversityLogoUpload} disabled={logoUploading} />
        </div>
      </Section>

      {/* ── 7. Tracking & Analytics ── */}
      <Section icon={<BarChart2 className="w-4 h-4 text-[#137fec]" />} title="Tracking & Analytics" alt>
        <div className="space-y-5">
          <p className="text-xs text-slate-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3">
            💡 <strong>Dual Tracking:</strong> Facebook Pixel fires in the browser, Conversion API (CAPI) fires from the server — together they maximize attribution accuracy even with ad blockers or iOS privacy restrictions.
          </p>

          {/* Facebook Pixel */}
          <div className="grid md:grid-cols-2 gap-5">
            <Field label="Facebook Pixel ID">
              <input
                className={inputCls}
                placeholder="e.g. 1234567890123456"
                value={form.facebookPixelId || ""}
                onChange={e => onChange("facebookPixelId", e.target.value)}
              />
            </Field>
            <Field label="Meta Test Event Code">
              <input
                className={inputCls}
                placeholder="e.g. TEST12345 (remove after testing)"
                value={form.metaTestEventCode || ""}
                onChange={e => onChange("metaTestEventCode", e.target.value)}
              />
            </Field>
          </div>

          {/* CAPI Access Token */}
          <Field label="Meta Conversions API Access Token">
            <input
              className={inputCls}
              type="password"
              placeholder="Paste your CAPI Access Token from Meta Events Manager"
              value={form.metaAccessToken || ""}
              onChange={e => onChange("metaAccessToken", e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1">
              Get this from <strong>Meta Events Manager → Your Pixel → Settings → Conversions API → Generate Access Token</strong>
            </p>
          </Field>

          {/* Microsoft Clarity */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Microsoft Clarity Project ID</label>
            <input className={inputCls} type="text" placeholder="abc123xyz" value={form.clarityProjectId || ""} onChange={e => onChange("clarityProjectId", e.target.value)} />
            <p className="text-xs text-slate-400 mt-1">Session recording — <a href="https://clarity.microsoft.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">clarity.microsoft.com</a> থেকে পাবেন</p>
          </div>

          {/* Google Analytics */}
          <Field label="Google Analytics Measurement ID" className="max-w-sm">
            <input
              className={inputCls}
              placeholder="e.g. G-XXXXXXXXXX"
              value={form.googleAnalyticsId || ""}
              onChange={e => onChange("googleAnalyticsId", e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1">
              Found in GA4 → Admin → Data Streams → your stream → Measurement ID
            </p>
          </Field>

          {/* Status indicators */}
          <div className="grid md:grid-cols-3 gap-3 pt-1">
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${form.facebookPixelId ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              <span>{form.facebookPixelId ? '✅' : '⭕'}</span> Facebook Pixel
            </div>
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${form.metaAccessToken ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              <span>{form.metaAccessToken ? '✅' : '⭕'}</span> CAPI (Server)
            </div>
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${form.googleAnalyticsId ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              <span>{form.googleAnalyticsId ? '✅' : '⭕'}</span> Google Analytics
            </div>
          </div>
        </div>
      </Section>

      {/* ── Sticky Save Footer ── */}
      <div className="sticky bottom-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 -mx-6 sm:-mx-8 px-6 sm:px-8 py-4 mt-0 flex items-center justify-between z-20">
        <div className="flex items-center gap-2 text-slate-500">
          {message ? (
            <span className={`flex items-center gap-2 text-sm font-semibold ${message.type === "success" ? "text-green-600" : "text-red-500"}`}>
              {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
              {message.text}
            </span>
          ) : (
            dirtyFields.size > 0 && <span className="text-xs text-amber-500 font-medium">⚠ Unsaved changes</span>
          )}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-[#137fec] text-white font-bold shadow-lg shadow-blue-200 hover:brightness-110 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {pending ? "Saving..." : "Save All Settings"}
        </button>
      </div>
    </form>
  );
}

function Section({ icon, title, alt, children }: { icon: React.ReactNode; title: string; alt?: boolean; children: React.ReactNode }) {
  return (
    <section className={`p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 last:border-0 ${alt ? "bg-slate-50/40 dark:bg-slate-800/10" : ""}`}>
      <div className="flex items-center gap-2 mb-6">
        {icon}
        <h4 className="text-base font-bold text-slate-900 dark:text-white">{title}</h4>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-2 ${className || ""}`}>
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      {children}
    </div>
  );
}
