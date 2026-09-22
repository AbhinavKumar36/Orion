import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import OrionGlobeScene from './3d/OrionGlobeScene';

export default function HeroSection() {
  const { scrollYProgress } = useScroll();

  return (
    <section className="relative w-full h-[400vh]">
      {/* Sticky Content Container */}
      <div className="sticky top-0 w-full h-screen flex items-center px-6 overflow-hidden bg-transparent">
        
        {/* The 3D Scene - Now scoped entirely to the hero */}
        <div className="absolute inset-0 z-0">
          <OrionGlobeScene />
        </div>

        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center pointer-events-none relative z-10">
          
          {/* Left Side: Typography */}
          <div className="w-full md:w-1/2 pt-20">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="h-[1px] w-8 bg-cyan-500" />
              <span className="text-cyan-400 text-xs font-mono tracking-[0.2em] uppercase">
                AI-Powered Cyber Threat Intelligence
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-6xl md:text-8xl font-bold tracking-tight text-white mb-6 leading-tight"
            >
              ORION
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="text-2xl md:text-3xl text-slate-300 font-light mb-8"
            >
              From Digital Signals<br />to Actionable Threats.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="text-lg text-slate-400 max-w-xl mb-12 leading-relaxed"
            >
              ORION unifies digital signals across phishing, websites, identity, media and authentication into explainable threat intelligence.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="flex flex-wrap items-center gap-6 pointer-events-auto mb-16"
            >
              <Link
                to="/console"
                className="px-8 py-4 rounded-md bg-cyan-500 text-black font-bold tracking-widest text-sm hover:bg-cyan-400 transition-colors shadow-[0_0_30px_rgba(6,182,212,0.4)]"
              >
                ENTER ORION
              </Link>
              <a
                href="#intelligence"
                className="px-8 py-4 rounded-md border border-slate-600 text-white font-semibold tracking-widest text-sm hover:bg-white/5 transition-colors"
              >
                EXPLORE INTELLIGENCE
              </a>
            </motion.div>

            {/* Bottom HUD Bar (Compact Status Strip) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.0 }}
              className="inline-flex items-center gap-8 bg-white/5 border border-white/10 px-6 py-3 rounded-lg backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.1)] pointer-events-none"
            >
              {[
                { label: 'SIGNALS', status: 'ACTIVE' },
                { label: 'INTELLIGENCE', status: 'ONLINE' },
                { label: 'CORRELATION', status: 'READY' },
                { label: 'RISK ENGINE', status: 'READY' }
              ].map((item, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-[10px] uppercase font-mono text-slate-500 tracking-widest mb-1">{item.label}</span>
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    {item.status} <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
          
          {/* Right Side: Intentionally left blank for 3D Earth composition */}
          <div className="w-full md:w-1/2 hidden md:block">
          </div>
        </div>
        
        {/* Gradient transition masking the bottom of the sticky view */}
        <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-[#05050A] to-transparent pointer-events-none z-10" />
      </div>
    </section>
  );
}
