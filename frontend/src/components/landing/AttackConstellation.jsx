import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Mail, ShieldAlert, Globe, Lock, AlertOctagon } from 'lucide-react';

const NODES = [
  { id: 1, label: "EMAIL", desc: "Initial phishing signal", icon: Mail, yOffset: 0 },
  { id: 2, label: "PHISHING SIGNAL", desc: "Deceptive content detected", icon: ShieldAlert, yOffset: 80 },
  { id: 3, label: "SUSPICIOUS WEBSITE", desc: "Zero-day credential harvester", icon: Globe, yOffset: 160 },
  { id: 4, label: "CREDENTIAL RISK", desc: "User entered credentials", icon: Lock, yOffset: 240 },
  { id: 5, label: "AUTHENTICATION ANOMALY", desc: "Impossible travel login", icon: AlertOctagon, yOffset: 320 }
];

export default function AttackConstellation() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  return (
    <section ref={containerRef} className="py-32 bg-[#05050A] border-t border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        <div>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">ATTACK CONSTELLATION</h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-8">
              ORION does not only analyze isolated events. It natively correlates related signals into a larger, explainable threat story.
            </p>
            <p className="text-slate-500 text-sm">
              * Illustrative ORION intelligence flow
            </p>
          </motion.div>
        </div>

        <div className="relative h-[600px] flex justify-center">
          {/* Vertical connecting line */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] bg-white/5" />
          
          <motion.div 
            className="absolute left-1/2 -translate-x-1/2 top-0 w-[2px] bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)] origin-top"
            style={{ height: useTransform(scrollYProgress, [0, 0.8], ["0%", "100%"]) }}
          />

          <div className="relative w-full max-w-sm">
            {NODES.map((node, i) => {
              // Alternate sides
              const isLeft = i % 2 === 0;
              
              return (
                <motion.div
                  key={node.id}
                  className={`absolute w-full flex items-center ${isLeft ? 'justify-start' : 'justify-end'}`}
                  style={{ top: `${node.yOffset}px` }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: i * 0.2 }}
                >
                  <div className={`flex items-center gap-4 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className="w-12 h-12 rounded-full bg-[#05050A] border-2 border-cyan-500/30 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                      <node.icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className={`bg-white/5 border border-white/10 p-3 rounded-lg backdrop-blur-md w-48 ${isLeft ? 'text-left' : 'text-right'}`}>
                      <div className="text-[10px] font-mono text-cyan-500 mb-1">{node.label}</div>
                      <div className="text-xs text-slate-300">{node.desc}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Final Risk State */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1.2 }}
              className="absolute w-full flex justify-center z-20"
              style={{ top: "420px" }}
            >
              <div className="bg-rose-500/10 border border-rose-500/30 px-6 py-4 rounded-xl text-center backdrop-blur-md shadow-[0_0_30px_rgba(244,63,94,0.2)]">
                <div className="text-rose-400 font-bold tracking-widest text-sm mb-1">ACCOUNT TAKEOVER RISK</div>
                <div className="text-slate-300 text-xs font-mono">SEVERITY: CRITICAL</div>
              </div>
            </motion.div>
          </div>
        </div>

      </div>
    </section>
  );
}
