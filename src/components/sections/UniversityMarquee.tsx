"use client";


import { motion } from "framer-motion";

const universities = [
  // World-Class Universities
  {
    name: "Harvard University",
    logo: "/images/universities/harvard.png"
  },
  {
    name: "University of Oxford",
    logo: "/images/universities/oxford.png"
  },
  {
    name: "University of Cambridge",
    logo: "/images/universities/cambridge.png"
  },
  {
    name: "MIT",
    logo: "/images/universities/mit.png"
  },
  {
    name: "Stanford University",
    logo: "/images/universities/stanford.png"
  },
  // Top Malaysian Universities
  {
    name: "Universiti Malaya (UM)",
    logo: "/images/universities/um.png"
  },
  {
    name: "Universiti Teknologi Malaysia (UTM)",
    logo: "/images/universities/utm.png"
  },
  {
    name: "University of Cyberjaya",
    logo: "/images/universities/cyberjaya.png"
  },
  {
    name: "Taylor's University",
    logo: "/images/universities/taylors.png"
  },
  {
    name: "Asia Pacific University (APU)",
    logo: "/images/universities/apu.png"
  }
];

export function UniversityMarquee() {
  return (
    <section className="py-10 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 text-center">
         <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            Trusted by World-Class Institutions
         </p>
      </div>
      
      <div className="relative flex overflow-hidden group">
        <motion.div
          className="flex gap-12 sm:gap-24 items-center whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 30, 
          }}
        >
          {/* Repeat the logos twice to create a seamless loop */}
          {[...universities, ...universities].map((uni, index) => (
            <div 
                key={`${uni.name}-${index}`} 
                className="relative w-32 h-16 sm:w-40 sm:h-20 flex-shrink-0 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100 cursor-pointer"
            >
              <img
                src={uni.logo}
                alt={uni.name}
                className="object-contain"
                sizes="(max-width: 768px) 128px, 160px"
              />
            </div>
          ))}
        </motion.div>

         {/* Gradient Masks */}
        <div className="absolute top-0 left-0 w-20 sm:w-32 h-full bg-gradient-to-r from-white dark:from-slate-900 to-transparent z-10"></div>
        <div className="absolute top-0 right-0 w-20 sm:w-32 h-full bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10"></div>
      </div>
    </section>
  );
}
