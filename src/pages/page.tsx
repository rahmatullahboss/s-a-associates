import { HeroSection } from "@/components/sections/HeroSection";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { UniversityMarquee } from "@/components/sections/UniversityMarquee";
import { AdvantageSection } from "@/components/sections/AdvantageSection";
import { LeadershipSection } from "@/components/sections/LeadershipSection";
import { CountriesSection } from "@/components/sections/CountriesSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-sans transition-colors duration-300">
      <main>
        <HeroSection />
        <UniversityMarquee />
        <CountriesSection />
        <ProcessSection />
        <AdvantageSection />
        <LeadershipSection />
      </main>
    </div>
  );
}
