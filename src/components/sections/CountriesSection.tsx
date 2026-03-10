"use client";

import { motion } from "framer-motion";
import { Link } from 'react-router-dom';
import { ArrowRight } from "lucide-react";

const countries = [
  {
    name: "Malaysia",
    flag: "🇲🇾",
    highlight: "Most Popular",
    tagline: "Affordable & World-Class Education",
    details: ["Top universities like APU, UTM, UM", "Low cost of living", "Easy student visa process", "Multicultural environment"],
    color: "from-[#1E293B] to-[#334155]",
    badge: "bg-yellow-400 text-yellow-900",
  },
  {
    name: "United Kingdom",
    flag: "🇬🇧",
    highlight: "Prestigious",
    tagline: "Home of World's Top Universities",
    details: ["Oxford, Cambridge, Imperial", "Post-study work visa (2 years)", "Globally recognised degrees", "Rich academic heritage"],
    color: "from-red-700 to-red-900",
    badge: "bg-blue-100 text-blue-900",
  },
  {
    name: "Australia",
    flag: "🇦🇺",
    highlight: "Work-Friendly",
    tagline: "Study, Work & Settle",
    details: ["Top QS ranked universities", "485 Graduate visa available", "Part-time work allowed (48 hrs/fortnight)", "Safe & multicultural"],
    color: "from-yellow-500 to-orange-600",
    badge: "bg-green-100 text-green-900",
  },
  {
    name: "New Zealand",
    flag: "🇳🇿",
    highlight: "Peaceful",
    tagline: "Quality Life & Education",
    details: ["World-class research institutions", "Safe & clean environment", "Post-study work visa", "Stunning natural beauty"],
    color: "from-teal-600 to-teal-800",
    badge: "bg-teal-100 text-teal-900",
  },
  {
    name: "South Korea",
    flag: "🇰🇷",
    highlight: "Tech Hub",
    tagline: "Innovation Meets Tradition",
    details: ["Top tech & engineering programs", "Government scholarships (KGSP)", "High-tech campus facilities", "Vibrant student culture"],
    color: "from-indigo-600 to-indigo-900",
    badge: "bg-indigo-100 text-indigo-900",
  },
  {
    name: "Ireland",
    flag: "🇮🇪",
    highlight: "Emerging Hub",
    tagline: "Europe's Fast-Growing Study Destination",
    details: ["Home to top-ranked universities like UCD & Trinity", "EU & global tech company headquarters", "Post-study stay-back visa (2 years)", "English-speaking, welcoming culture"],
    color: "from-green-600 to-green-800",
    badge: "bg-green-100 text-green-900",
  },
];

export function CountriesSection() {
  return (
    <section className="py-24 bg-surface-light dark:bg-background-dark overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-secondary font-bold tracking-widest uppercase text-sm">
            Study Destinations
          </span>
          <h2 className="mt-3 font-display font-bold text-4xl md:text-5xl text-primary dark:text-white">
            Where Do You Want to <span className="text-secondary italic">Study?</span>
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
            We provide expert guidance for students applying to top institutions worldwide.
          </p>
        </div>

        {/* Countries Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {countries.map((country, index) => (
            <motion.div
              key={country.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
            >
              {/* Top color bar */}
              <div className={`h-2 w-full bg-gradient-to-r ${country.color}`} />

              <div className="p-6">
                {/* Flag + Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-5xl">{country.flag}</span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${country.badge}`}>
                    {country.highlight}
                  </span>
                </div>

                {/* Name + Tagline */}
                <h3 className="text-xl font-bold text-primary dark:text-white mb-1">
                  {country.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {country.tagline}
                </p>

                {/* Details */}
                <ul className="space-y-2 mb-6">
                  {country.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="text-secondary mt-0.5">✓</span>
                      {detail}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link to="/contact"
                  className="flex items-center gap-1 text-sm font-semibold text-primary dark:text-secondary hover:gap-2 transition-all"
                >
                  Get Free Counseling <ArrowRight size={15} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
