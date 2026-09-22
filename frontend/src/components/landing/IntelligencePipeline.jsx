import React from 'react';
import { motion } from 'framer-motion';
import { Radio, Crosshair, FileSearch, ShieldAlert, Layers, Activity, GitBranch } from 'lucide-react';

const STEPS = [
  { id: '01', title: 'SIGNAL', desc: 'Ingest raw digital telemetry.', icon: Radio },
  { id: '02', title: 'DETECT', desc: 'Identify suspicious indicators.', icon: Crosshair },
  { id: '03', title: 'EVIDENCE', desc: 'Gather contextual facts.', icon: FileSearch },
  { id: '04', title: 'ASSESS', desc: 'Calculate deterministic risk.', icon: ShieldAlert },
  { id: '05', title: 'CORRELATE', desc: 'Connect isolated events.', icon: Layers },
  { id: '06', title: 'EXPLAIN', desc: 'Generate human-readable intel.', icon: Activity },
  { id: '07', title: 'RESPOND', desc: 'Execute defensive actions.', icon: GitBranch },
];

export default function IntelligencePipeline() {
  return (
    <section id="intelligence" className="py-32 bg-transparent border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">ORION INTELLIGENCE PIPELINE</h2>
          <div className="h-[1px] w-24 bg-cyan-500" />
        </motion.div>

        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/10 -translate-y-1/2 hidden md:block" />
          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute top-1/2 left-0 w-full h-[1px] bg-cyan-500 origin-left -translate-y-1/2 hidden md:block shadow-[0_0_10px_rgba(6,182,212,0.8)]" 
          />

          <div className="grid grid-cols-1 md:grid-cols-7 gap-8 relative z-10">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="flex flex-col items-center text-center group"
                >
                  <div className="w-16 h-16 rounded-xl bg-[#05050A] border border-white/10 flex items-center justify-center mb-6 relative group-hover:border-cyan-500/50 transition-colors duration-300">
                    <Icon className="w-6 h-6 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                    {/* Animated dot on the line */}
                    <motion.div 
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15 + 0.5 }}
                      className="absolute -bottom-[25px] md:-bottom-0 md:top-1/2 left-1/2 md:-translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,1)] opacity-0 md:opacity-100 hidden md:block"
                    />
                  </div>
                  <div className="text-xs font-mono text-cyan-500 mb-2">{step.id}</div>
                  <h3 className="font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
