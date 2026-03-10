"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, Clock, FileText, CheckCircle } from "lucide-react";
import { BookConsultationModal } from "@/components/BookConsultationModal";
import { useSiteSettings } from "@/lib/site-settings-context";
import { InteractiveWorldMap, DESTINATIONS, type Destination } from "./InteractiveWorldMap";

export function HeroSection() {
  const settings = useSiteSettings();
  const [selectedDest, setSelectedDest] = useState<Destination>(DESTINATIONS[0]);

  return (
    <section className="relative w-full overflow-hidden bg-background-light dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20 flex flex-col lg:flex-row gap-12 lg:gap-20 min-h-[calc(100vh-80px)]">

        {/* Left Column: Content */}
        <div className="flex-1 flex flex-col justify-center z-10 lg:w-[55%]">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent w-fit mb-8 border border-accent/20"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">100% Free Counseling & Application Processing</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-6"
          >
            {settings.heroHeadline}
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-500 dark:text-gray-400 font-normal leading-relaxed max-w-xl mb-10"
          >
            {settings.heroSubheadline}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4 mb-16"
          >
            <BookConsultationModal>
              <button className="h-12 px-8 bg-secondary hover:bg-secondary/90 text-primary text-base font-bold rounded-xl shadow-xl shadow-secondary/25 transition-all transform hover:-translate-y-1 flex items-center gap-2 group">
                <CalendarCheck className="w-5 h-5" />
                Book a Free Counseling Call
              </button>
            </BookConsultationModal>
          </motion.div>

          {/* Trust Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-gray-100 dark:border-gray-800"
          >
            <div className="flex gap-4 items-start group">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center text-accent group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Transparent Timelines</h3>
                <p className="text-sm text-gray-500 leading-snug">Real-time tracking of every application milestone.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start group">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center text-accent group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Document & SOP Support</h3>
                <p className="text-sm text-gray-500 leading-snug">Expert editing and verification for your success.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Interactive Globe Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex-1 relative flex items-center justify-center lg:justify-end lg:w-[45%] h-[500px] lg:h-auto"
        >
          {/* Decorative background blur — same as original */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-3xl transform translate-x-1/4 -translate-y-1/4 pointer-events-none" />

          {/* Globe Container — same as original: max-w-lg, aspect-square */}
          <div className="relative w-full max-w-lg aspect-square">

            {/* Globe Sphere — globe-gradient class from CSS, rounded-full, overflow-hidden */}
            <div className="absolute inset-0 rounded-full globe-gradient shadow-2xl border border-white/50 dark:border-white/5 overflow-hidden">

              {/* Real interactive world map fills the globe */}
              <div className="absolute inset-0">
                <InteractiveWorldMap
                  selected={selectedDest}
                  onSelect={setSelectedDest}
                />
              </div>

              {/* Subtle grid overlay — same as original */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none opacity-10 dark:opacity-5 text-slate-400"
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
              >
                <pattern id="globeGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#globeGrid)" />
              </svg>

              {/* Glossy shine — same as original feel */}
              <div
                className="absolute top-0 left-0 w-3/5 h-2/5 rounded-full pointer-events-none opacity-25"
                style={{
                  background: "radial-gradient(ellipse at 38% 32%, rgba(255,255,255,0.95), transparent 65%)",
                }}
              />
            </div>

            {/* Destination Toggles — same position as original: -bottom-6 */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-xl border border-white/50 dark:border-gray-700 flex gap-1 z-20">
              {DESTINATIONS.map((dest) => {
                const isActive = dest.isoCode === selectedDest.isoCode;
                return (
                  <button
                    key={dest.name}
                    onClick={() => setSelectedDest(dest)}
                    className={`
                      px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5
                      ${isActive
                        ? "text-white shadow-md font-semibold scale-105"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300"
                      }
                    `}
                    style={isActive ? { backgroundColor: dest.color } : {}}
                  >
                    <span className="text-base leading-none">{dest.flag}</span>
                    <span className="hidden sm:inline">{dest.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}
