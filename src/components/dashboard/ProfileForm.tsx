"use client";

import { useState } from "react";
import { updateProfile } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface ProfileFormProps {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  profile: {
    id: number;
    userId: number;
    phone: string | null;
    address: string | null;
    preferredProgram: string | null;
    budgetRange: string | null;
    countryInterest: string | null;
    profileCompletion: number | null;
  } | null;
}

export default function ProfileForm({ user, profile }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      preferredProgram: formData.get("preferredProgram") as string,
      budgetRange: formData.get("budgetRange") as string,
      countryInterest: formData.get("countryInterest") as string,
    };

    try {
      const result = await updateProfile(data);
      if (result.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        window.location.reload(); // Replacing Next.js router.refresh()
      } else {
        setMessage({ type: "error", text: result.error || "Failed to update profile" });
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-2xl">
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p>{message.text}</p>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Personal Information</h3>
        
        <div className="grid gap-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" name="name" defaultValue={user.name} required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user.email} disabled className="bg-gray-100 cursor-not-allowed" />
          <p className="text-xs text-gray-500">Email cannot be changed.</p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" name="phone" defaultValue={profile?.phone || ""} placeholder="e.g. +8801XXXXXXXXX" />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" defaultValue={profile?.address || ""} placeholder="Your full address" />
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Study Preferences</h3>
        
        <div className="grid gap-2">
          <Label htmlFor="preferredProgram">Preferred Program</Label>
          <div className="relative">
             <select 
                id="preferredProgram"
                name="preferredProgram" 
                defaultValue={profile?.preferredProgram || ""}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
              >
                <option value="" disabled>Select program</option>
                <option value="Foundation">Foundation</option>
                <option value="Diploma">Diploma</option>
                <option value="Bachelor">Bachelor</option>
                <option value="Masters">Masters</option>
                <option value="PhD">PhD</option>
              </select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="budgetRange">Budget Range</Label>
          <div className="relative">
              <select 
                id="budgetRange"
                name="budgetRange" 
                defaultValue={profile?.budgetRange || ""}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
              >
                <option value="" disabled>Select budget</option>
                <option value="<12lakh">&#2547;12 লাখের কম</option>
                <option value="12-25lakh">&#2547;12 - &#2547;25 লাখ</option>
                <option value="25-35lakh">&#2547;25 - &#2547;35 লাখ</option>
                <option value=">35lakh">&#2547;35 লাখের বেশি</option>
              </select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="countryInterest">Interested Country</Label>
          <div className="relative">
              <select 
                id="countryInterest"
                name="countryInterest" 
                defaultValue={profile?.countryInterest || ""}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
              >
                <option value="" disabled>Select country</option>
                <option value="Malaysia">Malaysia</option>
                <option value="UK">UK</option>
                <option value="Australia">Australia</option>
                <option value="New Zealand">New Zealand</option>
                <option value="South Korea">South Korea</option>
                <option value="Other">Other</option>
              </select>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-[#1E293B] hover:bg-[#0F172A] text-white">
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
