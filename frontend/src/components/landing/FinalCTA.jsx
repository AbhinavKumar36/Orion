import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="relative py-40 bg-[#05050A] border-t border-white/5 overflow-hidden flex items-center justify-center">
      {/* Background radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-[#05050A] to-[#05050A] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)] mx-auto mb-8">
            <Shield className="w-8 h-8" />
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
            SEE THE SIGNAL.<br/>
            UNDERSTAND THE THREAT.
          </h2>
          
          <p className="text-xl text-slate-400 font-light mb-12 max-w-2xl mx-auto">
            ORION turns fragmented digital signals into explainable, actionable threat intelligence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              to="/console"
              className="w-full sm:w-auto px-10 py-4 rounded-md bg-cyan-500 text-black font-bold tracking-widest text-sm hover:bg-cyan-400 transition-colors shadow-[0_0_30px_rgba(6,182,212,0.4)]"
            >
              ENTER ORION
            </Link>
            <a
              href="#platform"
              className="w-full sm:w-auto px-10 py-4 rounded-md border border-slate-600 text-white font-semibold tracking-widest text-sm hover:bg-white/5 transition-colors"
            >
              EXPLORE THE PLATFORM
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
