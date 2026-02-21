"use client";

import { useLocation } from 'react-router-dom';
import Navbar from "./Navbar";
import Footer from "./Footer";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";
import { SiteSettingsProvider } from "@/lib/site-settings-context";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = useLocation().pathname;

  // Hide navbar and footer on dashboard and login pages
  const hideLayout = pathname?.startsWith("/dashboard") ||
                     pathname?.startsWith("/student/login") ||
                     pathname?.startsWith("/student/signup") ||
                     pathname?.startsWith("/admin/login");

  return (
    <SiteSettingsProvider>
      {!hideLayout && <Navbar />}
      <main className={hideLayout ? "" : "min-h-screen"}>{children}</main>
      {!hideLayout && (
        <>
          <Footer />
          <FloatingWhatsAppButton />
        </>
      )}
    </SiteSettingsProvider>
  );
}
