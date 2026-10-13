import { HeroSection } from "@/components/HeroSection";
import { LandingDiscovery } from "@/components/user/LandingDiscovery";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#080b10] text-zinc-100">
      <HeroSection />
      <div className="relative z-10 pt-4 pb-16">
        <LandingDiscovery />
      </div>
    </main>
  );
}

