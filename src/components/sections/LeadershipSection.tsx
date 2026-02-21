"use client";


import { useSiteSettings } from "@/lib/site-settings-context";

export function LeadershipSection() {
  const settings = useSiteSettings();

  const ceoName = settings.ceoProfile?.name || "Md. Sazid Hossain";
  const ceoPhoto = settings.ceoProfile?.photo || null;
  const ceoTitle = "Chief Executive Officer";
  const visaRate = settings.metrics?.visaSuccessRate || "98%";

  return (
    <section className="py-24 relative overflow-hidden bg-primary text-white">
      {/* Background Pattern */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
          <pattern
            height="40"
            id="grid"
            patternUnits="userSpaceOnUse"
            width="40"
          >
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"></path>
          </pattern>
          <rect fill="url(#grid)" height="100%" width="100%"></rect>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="relative order-2 lg:order-1">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px w-12 bg-secondary"></div>
                <span className="text-secondary font-bold tracking-widest uppercase text-sm">
                  Leadership
                </span>
              </div>
              <h2 className="font-display font-bold text-4xl lg:text-5xl mb-8 leading-tight">
                &quot;We don&apos;t just process applications; we architect futures.&quot;
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-8 font-light">
                At S&A Associates, my vision is to bridge the gap between
                ambitious students and global opportunities. We are committed to
                transparency, integrity, and excellence in every student&apos;s
                journey from their home country to their dream destination.
              </p>
              <div className="flex items-center gap-6 pt-6 border-t border-white/10">
                <div>
                  <h3 className="text-2xl font-bold font-display text-white">
                    {ceoName}
                  </h3>
                  <p className="text-secondary font-medium mt-1">
                    {ceoTitle}
                  </p>
                </div>
                <div className="h-12 w-px bg-white/10"></div>
                <div>
                  <h3 className="text-2xl font-bold font-display text-white">
                    {visaRate}
                  </h3>
                  <p className="text-secondary font-medium mt-1">
                    Visa Success Ratio
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative w-[350px] h-[450px] lg:w-[400px] lg:h-[500px]">
              <div className="absolute inset-0 border-2 border-secondary rounded-br-[4rem] rounded-tl-[4rem] translate-x-6 translate-y-6"></div>
              <div className="absolute inset-0 bg-gray-800 rounded-br-[4rem] rounded-tl-[4rem] overflow-hidden shadow-2xl">
                {ceoPhoto ? (
                  <img
                    src={ceoPhoto}
                    alt={`${ceoName} - CEO`}
                    className="object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/30">
                    <span className="text-white/50 text-7xl font-bold select-none">
                      {ceoName.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent opacity-60"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
