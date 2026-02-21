"use client";

import { useState, useTransition, useRef } from "react";
import { saveSiteSettingsAction, uploadCeoPhotoAction, uploadUniversityLogoAction } from "@/actions/settings";
import type { SiteSettings } from "@/lib/site-settings.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { UploadCloud, Loader2, CheckCircle, Trash2 } from "lucide-react";

export default function SettingsForm({ initialSettings }: { initialSettings: SiteSettings }) {
  const [form, setForm] = useState<SiteSettings>(initialSettings);
  const [message, setMessage] = useState<string>("");
  const [pending, startTransition] = useTransition();
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoMessage, setPhotoMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(initialSettings.ceoProfile?.photo || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // University Logos State
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
    setPhotoUploading(true);
    setPhotoMessage(null);

    const fd = new FormData();
    fd.append("file", file);

    const result = await uploadCeoPhotoAction(fd);
    setPhotoUploading(false);

    if (result.success && result.url) {
      setPhotoPreview(result.url);
      setForm((prev) => ({
        ...prev,
        ceoProfile: { ...prev.ceoProfile, name: prev.ceoProfile?.name ?? "", photo: result.url },
      }));
      setPhotoMessage({ type: "success", text: "Photo uploaded successfully!" });
    } else {
      setPhotoPreview(initialSettings.ceoProfile?.photo || "");
      setPhotoMessage({ type: "error", text: result.error ?? "Upload failed." });
    }
  }

  async function handleUniversityLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    const fd = new FormData();
    fd.append("file", file);

    const result = await uploadUniversityLogoAction(fd);
    setLogoUploading(false);

    if (result.success && result.url) {
      const newLogo = {
        id: Date.now().toString(),
        url: result.url,
        name: file.name.split('.')[0]
      };
      
      setForm(prev => ({
        ...prev,
        universityLogos: [...(prev.universityLogos || []), newLogo]
      }));
    } else {
      alert(result.error || "Failed to upload logo");
    }
  }

  const removeUniversityLogo = (id: string) => {
    setForm(prev => ({
      ...prev,
      universityLogos: prev.universityLogos?.filter(logo => logo.id !== id) || []
    }));
  };

  const onChange = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Helper for nested updates
  const onNestedChange = (parent: keyof SiteSettings, key: string, value: string) => {
    setForm((prev) => {
      const parentObj = (prev[parent] as Record<string, unknown>) || {};
      return {
        ...prev,
        [parent]: {
          ...parentObj,
          [key]: value,
        },
      };
    });
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      const result = await saveSiteSettingsAction(form);
      setMessage(result.success ? "Settings updated successfully." : result.error ?? "Update failed.");
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8 pb-10">
      
      {/* Brand Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Brand Identity</h3>
        <Separator />
        <div className="grid md:grid-cols-2 gap-4">
          <InputField label="Company Name" value={form.companyName} onChange={(v) => onChange("companyName", v)} />
          <InputField label="Company Email" value={form.companyEmail} onChange={(v) => onChange("companyEmail", v)} />
          <InputField label="Company Phone" value={form.companyPhone} onChange={(v) => onChange("companyPhone", v)} />
          <InputField label="WhatsApp Number" value={form.whatsappNumber} onChange={(v) => onChange("whatsappNumber", v)} />
          <InputField label="Primary Color (Hex)" value={form.primaryColor || ""} onChange={(v) => onChange("primaryColor", v)} placeholder="#000000" />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <InputField label="Logo URL" value={form.companyLogo || ""} onChange={(v) => onChange("companyLogo", v)} />
          <InputField label="Favicon URL" value={form.companyFavicon || ""} onChange={(v) => onChange("companyFavicon", v)} />
        </div>
      </section>

      {/* Hero Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Hero Section</h3>
        <Separator />
        <InputField label="Hero Headline" value={form.heroHeadline} onChange={(v) => onChange("heroHeadline", v)} />
        <div>
          <Label className="mb-2 block">Hero Subheadline</Label>
          <textarea
            value={form.heroSubheadline}
            onChange={(e) => onChange("heroSubheadline", e.target.value)}
            rows={3}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </section>

      {/* CEO Profile */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">CEO Profile</h3>
        <Separator />

        {/* Photo Upload */}
        <div className="space-y-2">
          <Label>CEO / MD Photo</Label>
          <div className="flex items-start gap-6">
            {/* Preview */}
            <div className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-muted flex items-center justify-center shrink-0">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="CEO Photo Preview"
                  className="object-cover object-top"
                />
              ) : (
                <span className="text-3xl font-bold text-muted-foreground">
                  {form.ceoProfile?.name?.charAt(0) || "?"}
                </span>
              )}
              {photoUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>

            {/* Upload area */}
            <div className="flex-1 space-y-2">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <UploadCloud className="w-7 h-7 text-gray-400 mb-1" />
                <p className="text-sm font-medium text-gray-600">Click to upload photo</p>
                <p className="text-xs text-gray-400 mt-0.5">JPG, PNG or WebP — max 5MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={photoUploading}
              />
              {photoMessage && (
                <p className={`text-xs flex items-center gap-1 ${photoMessage.type === "success" ? "text-green-600" : "text-red-500"}`}>
                  {photoMessage.type === "success" && <CheckCircle className="w-3.5 h-3.5" />}
                  {photoMessage.text}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <InputField label="Name" value={form.ceoProfile?.name || ""} onChange={(v) => onNestedChange("ceoProfile", "name", v)} />
          <InputField label="Title" value={form.ceoProfile?.bio?.split("\n")[0] || "Chief Executive Officer"} onChange={(v) => onNestedChange("ceoProfile", "bio", v)} placeholder="Chief Executive Officer" />
        </div>
        <div>
          <Label className="mb-2 block">Bio</Label>
          <textarea
            value={form.ceoProfile?.bio || ""}
            onChange={(e) => onNestedChange("ceoProfile", "bio", e.target.value)}
            rows={3}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </section>

      {/* Metrics */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Key Metrics</h3>
        <Separator />
        <div className="grid md:grid-cols-3 gap-4">
          <InputField label="Visa Success Rate" value={form.metrics?.visaSuccessRate || ""} onChange={(v) => onNestedChange("metrics", "visaSuccessRate", v)} placeholder="98%" />
          <InputField label="Universities Count" value={form.metrics?.universitiesCount || ""} onChange={(v) => onNestedChange("metrics", "universitiesCount", v)} placeholder="500+" />
          <InputField label="Students Count" value={form.metrics?.studentsCount || ""} onChange={(v) => onNestedChange("metrics", "studentsCount", v)} placeholder="1000+" />
        </div>
      </section>

      {/* Socials */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Social Media</h3>
        <Separator />
        <InputField label="Facebook URL" value={form.facebookUrl} onChange={(v) => onChange("facebookUrl", v)} />
      </section>

      {/* University Logos */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">University Logos</h3>
        <Separator />
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {form.universityLogos?.map((logo) => (
            <div key={logo.id} className="relative group aspect-video bg-gray-50 rounded-lg border flex items-center justify-center p-4">
              <div className="relative w-full h-full">
                <img
                  src={logo.url}
                  alt={logo.name || "University Logo"}
                  className="object-contain"
                />
              </div>
              <button
                type="button"
                onClick={() => removeUniversityLogo(logo.id)}
                className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Upload Button */}
          <div 
            onClick={() => logoInputRef.current?.click()}
            className="aspect-video border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
          >
            {logoUploading ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            ) : (
              <>
                <UploadCloud className="w-6 h-6 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500 font-medium">Add Logo</span>
              </>
            )}
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleUniversityLogoUpload}
            disabled={logoUploading}
          />
        </div>
      </section>

      {/* Booking Settings */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Booking Settings</h3>
        <Separator />
        <InputField
          label="Default Google Meet Link"
          value={form.defaultMeetLink || ""}
          onChange={(v) => onChange("defaultMeetLink", v)}
          placeholder="https://meet.google.com/xxx-xxxx-xxx"
        />
      </section>

      <div className="sticky bottom-0 bg-background pt-4 pb-4 border-t">
        <Button
          type="submit"
          disabled={pending}
          className="w-full md:w-auto"
        >
          {pending ? "Saving..." : "Save All Settings"}
        </Button>
        {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}
      </div>
    </form>
  );
}

function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void, placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
