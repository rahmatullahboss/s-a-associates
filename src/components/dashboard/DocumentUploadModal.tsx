"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud } from "lucide-react";
import imageCompression from 'browser-image-compression';
import { API_BASE } from "@/lib/api";

export function DocumentUploadModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const file = formData.get("file") as File;

    if (file && file.type.startsWith("image/")) {
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: "image/webp" as const,
        };
        const compressedFile = await imageCompression(file, options);
        const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
        const newFile = new File([compressedFile], newFileName, { type: "image/webp" });
        formData.set("file", newFile);
      } catch (error) {
        console.error("Compression failed:", error);
      }
    }
    
    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error('Upload failed');
      }
      
      setOpen(false);
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      setError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-gray-100 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Document Name</Label>
            <Input id="name" name="name" required placeholder="e.g. Transcript" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">Document Type</Label>
            <Input id="type" name="type" required placeholder="e.g. Passport, Transcript, Certificate..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="file">File (PDF or Image)</Label>
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer relative">
                <UploadCloud className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Click to select or drag file here</p>
                <p className="text-xs text-gray-400 mt-1">Images will be compressed to WebP</p>
                <Input 
                    id="file" 
                    name="file" 
                    type="file" 
                    required 
                    accept=".pdf,.jpg,.jpeg,.png,.webp" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-[#1E293B] hover:bg-[#0F172A] text-white mt-2">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Upload Document"}
          </Button>
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
}
