import React from 'react';
import { motion } from 'framer-motion';
import { Check, ShieldAlert } from 'lucide-react';

export default function ExplainableThreat() {
  return (
    <section className="py-32 bg-transparent border-t border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        <div className="order-2 lg:order-1 relative">
          {/* Simulated UI Panel */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotateX: 10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-[#0A0A0F] border border-white/10 rounded-xl p-8 shadow-2xl relative z-10"
            style={{ perspective: "1000px" }}
          >
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-mono tracking-widest text-slate-500">THREAT ASSESSMENT</div>
                  <div className="text-rose-400 font-bold tracking-wider text-xl">HIGH</div>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-mono tracking-widest text-slate-500">Risk Score</div>
                  <div className="text-2xl font-bold text-white">78</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-mono tracking-widest text-slate-500">Confidence</div>
                  <div className="text-2xl font-bold text-cyan-400">94%</div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="text-xs uppercase font-mono tracking-widest text-slate-500 mb-4">Evidence</div>
              <ul className="space-y-3">
                {[
                  "Suspicious URL indicators",
                  "Brand impersonation pattern",
                  "Credential harvesting indicators",
                  "Newly observed domain"
                ].map((ev, i) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + (i * 0.1) }}
                    className="flex items-center gap-3 text-sm text-slate-300"
                  >
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Check className="w-3 h-3" />
                    </div>
                    {ev}
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 rounded-lg p-5 border border-white/5">
              <div className="text-[10px] uppercase font-mono tracking-widest text-cyan-500 mb-2">WHY ORION FLAGGED THIS</div>
              <p className="text-sm text-slate-300 leading-relaxed italic">
                "The observed indicators collectively increase the likelihood of a phishing-driven credential threat."
              </p>
            </div>
            
            <div className="mt-4 text-center">
              <span className="text-[9px] text-slate-600 font-mono uppercase tracking-widest">* Illustrative Interface Example</span>
            </div>
          </motion.div>
          
          {/* Decorative background glow */}
          <div className="absolute inset-0 bg-cyan-500/5 blur-[100px] rounded-full z-0" />
        </div>

        <div className="order-1 lg:order-2">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">EXPLAINABLE THREAT INTELLIGENCE</h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Black-box AI is useless in a crisis. ORION provides full transparency into its decision-making, offering deterministic risk scores, explicit evidence chains, and natural language explanations for every flagged threat.
            </p>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
