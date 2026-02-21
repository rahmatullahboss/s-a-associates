"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

export function LeadFormModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [user, setUser] = useState<{ name: string; email: string; phone?: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await apiFetch<{ authenticated: boolean; user: { name: string; email: string; phone?: string; } }>("/api/auth/me");
        if (data.authenticated) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    };
    fetchUser();
  }, []);

  function handleOpenChange(val: boolean) {
    setOpen(val);
    if (!val) {
      setTimeout(() => { setSubmitted(false); setError(""); }, 300);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      program: formData.get("program") as string,
      budget: formData.get("budget") as string,
      countryInterest: formData.get("country") as string,
    };
    console.log(data);

    try {
      await apiFetch("/api/leads", {
        method: "POST",
        body: JSON.stringify({ ...data, source: "website_lead" }),
      });
      setSubmitted(true);
    } catch (error) {
      console.error(error);
      setError("Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-gray-100 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle>Book a Free Consultation</DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Request Submitted!</h3>
            <p className="text-gray-500 text-sm">Thank you! Our team will contact you within 24 hours.</p>
            <Button className="mt-2 bg-primary text-white" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
        <form onSubmit={onSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" required placeholder="John Doe" defaultValue={user?.name} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="john@example.com" defaultValue={user?.email} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" name="phone" type="tel" required placeholder="e.g. +8801XXXXXXXXX" defaultValue={user?.phone} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="program">Preferred Program</Label>
            <div className="relative">
              <select 
                name="program" 
                required
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
              >
                <option value="" disabled selected>Select program</option>
                <option value="Foundation">Foundation</option>
                <option value="Diploma">Diploma</option>
                <option value="Bachelor">Bachelor</option>
                <option value="Masters">Masters</option>
                <option value="PhD">PhD</option>
              </select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="budget">Budget Range</Label>
            <div className="relative">
              <select 
                name="budget" 
                required
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
              >
                <option value="" disabled selected>Select budget</option>
                <option value="<12lakh">&#2547;12 লাখের কম</option>
                <option value="12-25lakh">&#2547;12 - &#2547;25 লাখ</option>
                <option value="25-35lakh">&#2547;25 - &#2547;35 লাখ</option>
                <option value=">35lakh">&#2547;35 লাখের বেশি</option>
              </select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="country">Interested Country (Optional)</Label>
            <div className="relative">
              <select 
                name="country" 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
              >
                <option value="" disabled selected>Select country</option>
                <option value="Malaysia">Malaysia</option>
                <option value="UK">UK</option>
                <option value="Australia">Australia</option>
                <option value="New Zealand">New Zealand</option>
                <option value="South Korea">South Korea</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full bg-primary text-white hover:bg-primary/90 mt-2">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : "Submit Request"}
          </Button>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
