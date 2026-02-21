"use client";

import { Brain, Handshake, TrendingUp } from "lucide-react"; // Replaced custom icons with Lucide
import { MagneticCard } from "@/components/ui/MagneticCard";

export function AdvantageSection() {
  const advantages = [
    {
      title: "Tailored Strategy",
      description:
        "Every student is unique. We build a customized roadmap for your education based on your specific academic background and career ambitions.",
      icon: Brain,
    },
    {
      title: "Ethical Counseling",
      description:
        "Transparency is our core value. No hidden fees, no false promises. Just honest, expert advice to help you make informed decisions.",
      icon: Handshake,
    },
    {
      title: "Post-Arrival Care",
      description:
        "Our relationship doesn't end at the airport. We provide ongoing support network access even after you've reached your destination.",
      icon: TrendingUp,
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-white dark:bg-surface-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-3xl md:text-5xl text-primary dark:text-white mb-6">
            The S&A Advantage
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
            We don&apos;t just process applications; we build relationships and
            architect futures.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {advantages.map((item, index) => (
            <MagneticCard
              key={index}
              className="bg-surface-light dark:bg-background-dark p-8 rounded-2xl border border-gray-100 dark:border-gray-700 relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-[100px] -mr-8 -mt-8 transition-all group-hover:bg-secondary/10"></div>
              <div className="w-14 h-14 bg-primary text-secondary rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <item.icon size={32} />
              </div>
              <h3 className="font-display font-bold text-xl text-primary dark:text-white mb-3">
                {item.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                {item.description}
              </p>
            </MagneticCard>
          ))}
        </div>
      </div>
    </section>
  );
}
