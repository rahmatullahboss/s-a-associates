"use client";

import { motion } from "framer-motion";
import { CalendarCheck, Clock, FileText, CheckCircle, Globe } from "lucide-react";
import { BookConsultationModal } from "@/components/BookConsultationModal";
import { useSiteSettings } from "@/lib/site-settings-context";

export function HeroSection() {
  const settings = useSiteSettings();

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
            {/* Trust Item 1 */}
            <div className="flex gap-4 items-start group">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center text-accent group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Transparent Timelines</h3>
                <p className="text-sm text-gray-500 leading-snug">Real-time tracking of every application milestone.</p>
              </div>
            </div>
            {/* Trust Item 2 */}
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
          {/* Decorative background blur */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-3xl transform translate-x-1/4 -translate-y-1/4"></div>

          {/* Interactive Globe Container */}
          <div className="relative w-full max-w-lg aspect-square">
            {/* Globe Sphere Visualization (CSS + SVG) */}
            <div className="absolute inset-0 rounded-full globe-gradient shadow-2xl border border-white/50 dark:border-white/5 overflow-hidden">
              {/* Map Texture/SVG Pattern */}
              <svg className="w-full h-full opacity-30 dark:opacity-20 text-slate-400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <pattern height="20" id="grid" patternUnits="userSpaceOnUse" width="20">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"></path>
                </pattern>
                <rect fill="url(#grid)" height="100%" width="100%"></rect>
                {/* Abstract Continents */}
                <path className="text-slate-200 dark:text-slate-600" d="M40,60 Q60,40 90,60 T140,50 T180,80 V120 Q160,150 120,130 T60,140 T40,60" fill="currentColor"></path>
              </svg>

              {/* Animated Path */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
                <defs>
                  <linearGradient id="pathGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#1E293B" stopOpacity="0"></stop>
                    <stop offset="50%" stopColor="#1E293B"></stop>
                    <stop offset="100%" stopColor="#F26522"></stop>
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur result="coloredBlur" stdDeviation="2.5"></feGaussianBlur>
                    <feMerge>
                      <feMergeNode in="coloredBlur"></feMergeNode>
                      <feMergeNode in="SourceGraphic"></feMergeNode>
                    </feMerge>
                  </filter>
                </defs>
                {/* Path from Origin (India approx) to Destination (USA approx) */}
                <path className="path-dash" d="M 300 250 Q 200 250 100 150" fill="none" filter="url(#glow)" stroke="url(#pathGradient)" strokeLinecap="round" strokeWidth="3"></path>
                {/* Origin Dot */}
                <circle className="animate-pulse" cx="300" cy="250" fill="#1E293B" r="4">
                  <animate attributeName="r" dur="2s" repeatCount="indefinite" values="4;8;4"></animate>
                  <animate attributeName="opacity" dur="2s" repeatCount="indefinite" values="1;0.5;1"></animate>
                </circle>
                {/* Destination Dot */}
                <circle className="shadow-lg" cx="100" cy="150" fill="#F26522" r="6" stroke="white" strokeWidth="2"></circle>
              </svg>


            </div>

            {/* Destination Toggles Overlay */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-xl border border-white/50 dark:border-gray-700 flex gap-1 z-20">
                {[
                  { name: "Malaysia", active: true },
                  { name: "USA", active: false },
                  { name: "UK", active: false },
                  { name: "Australia", active: false, hiddenOnMobile: true }
                ].map((dest) => (
                  <button 
                    key={dest.name}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2
                      ${dest.active 
                        ? "bg-primary text-white shadow-md font-semibold" 
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300"
                      }
                      ${dest.hiddenOnMobile ? "hidden sm:flex" : "flex"}
                    `}
                  >
                    {dest.active && <Globe className="w-4 h-4" />}
                    {dest.name}
                  </button>
                ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
