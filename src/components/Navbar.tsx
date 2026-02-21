"use client";

import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';

import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ChevronDown,
  User,
  GraduationCap,
  Shield,
} from "lucide-react";
import { LeadFormModal } from "@/components/layout/LeadFormModal";
import { useSiteSettings } from "@/lib/site-settings-context";
import { apiFetch } from "@/lib/api";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#services", label: "Services" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const settings = useSiteSettings();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    apiFetch<{ authenticated: boolean; user: { name: string, role: string } }>('/api/auth/me')
      .then((authData) => {
        if (authData.authenticated && authData.user) setUser(authData.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm' : 'bg-transparent'}`}>
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 transition-all duration-300">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
             <div className="relative w-12 h-12">
                     <img
                    src={settings.companyLogo || "/logo.jpg"}
                    alt={settings.companyName}
                    className="object-contain"
                  />
             </div>
             <span className="font-bold text-xl text-primary dark:text-white tracking-tight">
                {settings.companyName}
             </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
              >
                {link.label}
              </Link>
            ))}

            {/* Book Consultation Button */}
            <div className="ml-4">
              <LeadFormModal>
                <button className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-full font-medium transition-all duration-200 shadow-lg shadow-primary/25">
                  Book Consultation
                </button>
              </LeadFormModal>
            </div>

            {/* Login Dropdown */}
            <div className="relative ml-2">
              {user ? (
                <Link to="/dashboard"
                  className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-900 px-5 py-2.5 rounded-full font-medium transition-all duration-200 border border-blue-100"
                >
                    <div className="bg-gray-300 rounded-full p-0.5">
                      <User size={16} className="text-white" />
                    </div>
                  <span className="text-sm">Dashboard</span>
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => setIsLoginDropdownOpen(!isLoginDropdownOpen)}
                    className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-900 px-5 py-2.5 rounded-full font-medium transition-all duration-200 border border-blue-100"
                  >
                      <div className="bg-gray-300 rounded-full p-0.5">
                        <User size={16} className="text-white" />
                      </div>
                    <span className="text-sm">Login</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 text-gray-500 ${isLoginDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {isLoginDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden origin-top-right z-50"
                      >
                        <Link to="/student/login"
                          className="flex items-center px-4 py-2.5 text-gray-600 hover:bg-blue-50 hover:text-[#F26522] transition-colors text-sm"
                          onClick={() => setIsLoginDropdownOpen(false)}
                        >
                          <GraduationCap size={16} className="mr-3" />
                          Student
                        </Link>
                        <Link to="/admin/login"
                          className="flex items-center px-4 py-2.5 text-gray-600 hover:bg-blue-50 hover:text-[#F26522] transition-colors text-sm"
                          onClick={() => setIsLoginDropdownOpen(false)}
                        >
                          <Shield size={16} className="mr-3" />
                          Admin
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden bg-white border-b border-gray-100"
            >
              <div className="py-2 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="block text-gray-600 hover:text-[#F26522] font-medium py-3 px-4 transition-colors hover:bg-gray-50 rounded-lg mx-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}

                <div className="p-4 flex flex-col gap-2">
                  {user ? (
                    <Link to="/dashboard"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-[#1E293B] text-white rounded-lg font-medium"
                         onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Go to Dashboard
                    </Link>
                  ) : (
                    <>
                        <Link to="/student/login"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-[#1E293B] text-white rounded-lg font-medium"
                             onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Student Login
                        </Link>
                        <Link to="/admin/login"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium"
                             onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Admin Login
                        </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
