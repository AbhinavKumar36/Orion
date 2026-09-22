import React, { useEffect } from 'react';
import Navigation from '../components/landing/Navigation';
import HeroSection from '../components/landing/HeroSection';
import ThreatSurface from '../components/landing/ThreatSurface';
import IntelligencePipeline from '../components/landing/IntelligencePipeline';
import PlatformSurfaces from '../components/landing/PlatformSurfaces';
import AttackConstellation from '../components/landing/AttackConstellation';
import ExplainableThreat from '../components/landing/ExplainableThreat';
import FinalCTA from '../components/landing/FinalCTA';
import OrionGlobeScene from '../components/landing/3d/OrionGlobeScene';

export default function LandingPage() {
  // Ensure we start at top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-[#05050A] text-white selection:bg-cyan-500/30 font-sans overflow-x-hidden">
      <Navigation />
      
      {/* Fixed 3D Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <OrionGlobeScene />
      </div>

      {/* Scrollable DOM Content */}
      <main className="relative z-10">
        <HeroSection />
        <ThreatSurface />
        <IntelligencePipeline />
        <PlatformSurfaces />
        <AttackConstellation />
        <ExplainableThreat />
        <FinalCTA />
      </main>
    </div>
  );
}
