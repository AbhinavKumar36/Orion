import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, ShieldCheck, Image as ImageIcon, Smartphone, Cpu } from 'lucide-react';

const SURFACES = [
  {
    title: "WEB CONSOLE",
    desc: "Security intelligence command center. The primary interface for SOC analysts.",
    icon: Monitor,
  },
  {
    title: "BROWSER SHIELD",
    desc: "Active protection against suspicious websites, credential harvesting, and digital threats while browsing.",
    icon: ShieldCheck,
  },
  {
    title: "MEDIA INTELLIGENCE",
    desc: "Image, video, and audio authenticity analysis detecting synthetic or manipulated media.",
    icon: ImageIcon,
  },
  {
    title: "ANDROID",
    desc: "Mobile security signals, localized telemetry, notifications, and real-time alerts.",
    icon: Smartphone,
  },
  {
    title: "BACKGROUND AGENTS",
    desc: "Event-driven security signal collection, automated analysis, and continuous monitoring.",
    icon: Cpu,
  }
];

export default function PlatformSurfaces() {
  return (
    <section id="surfaces" className="py-32 bg-transparent border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-24"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">ONE INTELLIGENCE CORE</h2>
          <h3 className="text-xl md:text-2xl text-cyan-400 font-light mb-6">MULTIPLE SURFACES</h3>
          <p className="text-slate-400 max-w-2xl mx-auto">
            ORION is built as a unified platform architecture. A single intelligence engine powering specialized protective surfaces across the digital ecosystem.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SURFACES.map((surface, i) => {
            const Icon = surface.icon;
            return (
              <motion.div
                key={surface.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-xl p-8 hover:bg-white/10 transition-colors group"
              >
                <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white mb-3 tracking-wide">{surface.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {surface.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 text-center text-xs text-slate-600 font-mono"
        >
          * Select surfaces are currently in development or prototype phases.
        </motion.div>
      </div>
    </section>
  );
}
