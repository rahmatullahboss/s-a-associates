"use client";

import { motion } from "framer-motion";
import { ClipboardList, GraduationCap, Plane, FileCheck } from "lucide-react";

export function ProcessSection() {
  const steps = [
    {
      id: "01",
      title: "Free Assessment",
      description:
        "We evaluate your academic profile and career goals to recommend the best countries and universities.",
      icon: ClipboardList,
    },
    {
      id: "02",
      title: "University Shortlisting",
      description:
        "Our experts curate a list of universities that match your profile, budget, and future aspirations.",
      icon: GraduationCap,
    },
    {
      id: "03",
      title: "Visa Support",
      description:
        "Comprehensive guidance on documentation, interview preparation, and application submission.",
      icon: FileCheck,
    },
    {
      id: "04",
      title: "Departure & Arrival",
      description:
        "From pre-departure briefings to accommodation assistance, we ensure you settle in smoothly.",
      icon: Plane,
    },
  ];

  return (
    <section className="py-24 bg-surface-light dark:bg-background-dark relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-20">
          <span className="text-secondary font-bold tracking-widest uppercase text-sm">
            Our Process
          </span>
          <h2 className="mt-3 font-display font-bold text-4xl md:text-5xl text-primary dark:text-white">
            Path to <span className="text-secondary italic">Success</span>
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            We&apos;ve broken down your complex journey into simple, manageable
            milestones tailored for your success.
          </p>
        </div>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-px bg-gray-200 dark:bg-gray-700"></div>
          
          <div className="space-y-24">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative flex items-center justify-between group ${
                  index % 2 === 0 ? "" : "flex-row-reverse"
                }`}
              >
                {/* Text Content */}
                <div
                  className={`w-5/12 ${
                    index % 2 === 0 ? "text-right pr-8" : "text-left pl-8"
                  }`}
                >
                  <h3 className="text-2xl font-display font-bold text-primary dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Center Circle */}
                <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10">
                  <div className="w-12 h-12 bg-white dark:bg-surface-dark rounded-full border-4 border-gray-200 dark:border-gray-600 group-hover:border-secondary transition-colors duration-500 step-circle flex items-center justify-center shadow-lg">
                    <span className="font-bold text-gray-400 group-hover:text-secondary transition-colors duration-500 text-lg">
                      {step.id}
                    </span>
                  </div>
                </div>

                {/* Icon Card */}
                <div
                  className={`w-5/12 ${
                    index % 2 === 0 ? "pl-8" : "pr-8 text-right"
                  }`}
                >
                  <div
                    className={`bg-white dark:bg-surface-dark p-4 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 transform group-hover:scale-105 transition-transform duration-300 inline-block ${
                      index % 2 === 0 ? "" : "text-left"
                    }`}
                  >
                    <step.icon
                      size={40}
                      className="text-primary dark:text-white mb-2"
                      strokeWidth={1.5}
                    />
                    <div className="h-1 w-12 bg-primary/30 dark:bg-white/30 rounded-full"></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
