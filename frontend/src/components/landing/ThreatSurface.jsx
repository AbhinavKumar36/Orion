import React from 'react';
import { motion } from 'framer-motion';

const DOMAINS = [
  "PHISHING",
  "MALICIOUS WEBSITES",
  "DIGITAL IMPERSONATION",
  "MEDIA MANIPULATION",
  "AUTHENTICATION ANOMALIES",
  "TECHNICAL THREATS"
];

export default function ThreatSurface() {
  return (
    <section id="platform" className="relative py-32 bg-[#05050A] overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-24"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">THE DIGITAL THREAT SURFACE</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Fragmented signals exist across isolated domains. ORION unifies them to detect the full scope of a threat.
          </p>
        </motion.div>

        <div className="relative h-[400px] flex items-center justify-center">
          {/* Central ORION Hub */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="absolute w-32 h-32 rounded-full border border-cyan-500/50 bg-cyan-950/30 flex items-center justify-center z-20 backdrop-blur-md shadow-[0_0_50px_rgba(6,182,212,0.2)]"
          >
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-400 animate-pulse" />
          </motion.div>

          {/* Orbiting Domains */}
          {DOMAINS.map((domain, index) => {
            const angle = (index / DOMAINS.length) * Math.PI * 2;
            const radius = 250;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <motion.div
                key={domain}
                initial={{ opacity: 0, x: 0, y: 0 }}
                whileInView={{ opacity: 1, x, y }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.1 + 0.5 }}
                className="absolute z-10 flex flex-col items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                <span className="text-[10px] md:text-xs font-mono tracking-widest text-slate-300 text-center w-32">
                  {domain}
                </span>
                
                {/* SVG Line connecting to center */}
                <svg className="absolute top-1 left-1 pointer-events-none" style={{ width: Math.abs(x), height: Math.abs(y), zIndex: -1 }}>
                   <line 
                     x1="0" y1="0" 
                     x2={-x} y2={-y} 
                     stroke="rgba(6, 182, 212, 0.2)" 
                     strokeWidth="1"
                     strokeDasharray="4 4"
                   />
                </svg>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
