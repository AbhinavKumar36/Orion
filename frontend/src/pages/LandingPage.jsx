import React, { useEffect } from 'react';
import Navigation from '../components/landing/Navigation';
import HeroSection from '../components/landing/HeroSection';
import ThreatSurface from '../components/landing/ThreatSurface';
import IntelligencePipeline from '../components/landing/IntelligencePipeline';
import PlatformSurfaces from '../components/landing/PlatformSurfaces';
import AttackConstellation from '../components/landing/AttackConstellation';
import ExplainableThreat from '../components/landing/ExplainableThreat';
import FinalCTA from '../components/landing/FinalCTA';

export default function LandingPage() {
  // Ensure we start at top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-[#05050A] text-white selection:bg-cyan-500/30 font-sans min-h-screen relative">
      {/* Global Star Pattern Background */}
      <div className="fixed inset-0 pointer-events-none star-pattern z-0" />

      <Navigation />

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
