"use client";

import { useEffect, useRef, useState } from "react";

const universities = [
  { name: "Universiti Malaya", short: "UM", logo: "/images/universities/um.png" },
  { name: "UTM Malaysia", short: "UTM", logo: "/images/universities/utm.png" },
  { name: "Asia Pacific University", short: "APU", logo: null },
  { name: "Taylor's University", short: "TU", logo: "/images/universities/taylors.png" },
  { name: "Sunway University", short: "SU", logo: "/images/universities/sunway.jpg" },
  { name: "HELP University", short: "HELP", logo: "/images/universities/help.svg" },
  { name: "Univ. of Cyberjaya", short: "UC", logo: "/images/universities/cyberjaya.png" },
  { name: "INTI International", short: "INTI", logo: "/images/universities/inti.png" },
  { name: "University of Oxford", short: "Oxford", logo: "/images/universities/oxford.png" },
  { name: "University of Cambridge", short: "Cam", logo: "/images/universities/cambridge.png" },
  { name: "Imperial College London", short: "ICL", logo: "/images/universities/imperial.png" },
  { name: "Univ. of Melbourne", short: "UoM", logo: "/images/universities/melbourne.svg" },
  { name: "Australian National Univ.", short: "ANU", logo: "/images/universities/anu.svg" },
  { name: "Univ. of Auckland", short: "UoA", logo: "/images/universities/auckland.png" },
  { name: "Seoul National Univ.", short: "SNU", logo: "/images/universities/snu.png" },
  { name: "Trinity College Dublin", short: "TCD", logo: "/images/universities/trinity.png" },
  { name: "Univ. College Dublin", short: "UCD", logo: null },
];

const shortColors: Record<string, string> = {
  UM: "text-blue-800", UTM: "text-red-700", APU: "text-purple-700",
  TU: "text-amber-700", SU: "text-orange-600", HELP: "text-green-700",
  UC: "text-teal-700", INTI: "text-rose-700", Oxford: "text-blue-900",
  Cam: "text-blue-900", ICL: "text-blue-800", UoM: "text-blue-700",
  ANU: "text-yellow-700", UoA: "text-sky-700", SNU: "text-indigo-800",
  TCD: "text-emerald-800", UCD: "text-indigo-700",
};

function LogoItem({ uni }: { uni: typeof universities[0] }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="flex items-center justify-center mx-10 min-w-[120px] h-14 shrink-0">
      {uni.logo && !imgError ? (
        <img
          src={uni.logo}
          alt={uni.name}
          className="max-h-12 max-w-[120px] w-auto object-contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={`text-2xl font-black tracking-tight ${shortColors[uni.short] ?? "text-gray-700"}`}>
          {uni.short}
        </span>
      )}
    </div>
  );
}

export function UniversityMarquee() {
  const trackRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const rafRef = useRef<number>(0);
  const speed = 1.2; // px per frame

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const animate = () => {
      posRef.current += speed;
      const halfWidth = track.scrollWidth / 2;
      if (posRef.current >= halfWidth) {
        posRef.current = 0;
      }
      track.style.transform = `translateX(-${posRef.current}px)`;
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Duplicate for seamless loop
  const items = [...universities, ...universities];

  return (
    <section className="py-16 bg-white dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-10 text-center">
        <span className="text-secondary font-bold tracking-widest uppercase text-sm">
          Trusted Partners
        </span>
        <h2 className="mt-2 font-display font-bold text-3xl md:text-4xl text-primary dark:text-white">
          Partner Universities <span className="text-secondary italic">Worldwide</span>
        </h2>
      </div>

      <div className="relative overflow-hidden">
        {/* Left fade */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white dark:from-gray-900 to-transparent z-10 pointer-events-none" />
        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white dark:from-gray-900 to-transparent z-10 pointer-events-none" />

        <div ref={trackRef} className="flex items-center will-change-transform">
          {items.map((uni, i) => (
            <LogoItem key={`${uni.short}-${i}`} uni={uni} />
          ))}
        </div>
      </div>
    </section>
  );
}
