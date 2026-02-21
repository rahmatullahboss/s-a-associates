
"use client";

import { Link } from 'react-router-dom';

import { Facebook, Instagram } from "lucide-react";
import { useSiteSettings } from "@/lib/site-settings-context";

export default function Footer() {
  const settings = useSiteSettings();

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex flex-col items-center gap-3">
            <div className="bg-[#1E293B] rounded-xl p-2 w-12 h-12 flex items-center justify-center overflow-hidden">
                 <img 
                  src={settings.companyLogo || "/sa-logo.png"} 
                  alt={settings.companyName} 
                  className="object-contain w-full h-full scale-[2.5]"
                />
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">
                {settings.companyName}
            </span>
          </Link>
        </div>

        {/* Social Icons */}
        <div className="flex justify-center gap-4 mb-8">
          <Link to={settings.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 bg-gray-200 hover:bg-[#1877F2] hover:text-white rounded-full flex items-center justify-center transition-colors group"
            aria-label="Facebook"
          >
            <Facebook size={20} className="text-gray-600 group-hover:text-white" />
          </Link>
          <Link to="https://www.instagram.com/simplyafford.bd"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 bg-gray-200 hover:bg-[#E4405F] hover:text-white rounded-full flex items-center justify-center transition-colors group"
            aria-label="Instagram"
          >
            <Instagram size={20} className="text-gray-600 group-hover:text-white" />
          </Link>
        </div>
      </div>

        {/* Contact Info */}
        <div className="flex flex-col items-center justify-center gap-4 mb-8 text-center">
             <p className="text-gray-600">
                <span className="font-bold block text-gray-900 mb-1">Contact Us</span>
                {settings.companyPhone}<br/>
                {settings.companyEmail}
             </p>
             <p className="text-gray-600">
                <span className="font-bold block text-gray-900 mb-1">Location</span>
                {settings.companyAddress || "72/1 (Anondo Complex), Kochukhet Road, Mirpur-14, Dhaka, Bangladesh"}
             </p>
        </div>

        {/* Copyright Bar */}
        <div className="bg-gray-900 py-4 -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} {settings.companyName}. All rights reserved.
            </p>
          </div>
        </div>
    </footer>
  );
}
