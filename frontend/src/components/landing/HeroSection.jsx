import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldAlert, Activity, GitCommit, CheckCircle2 } from 'lucide-react';

function HUDElement({ title, status, icon: Icon, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.8 }}
      className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-lg backdrop-blur-sm shadow-[0_0_15px_rgba(6,182,212,0.1)]"
    >
      <div className="text-cyan-400">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 leading-tight">{title}</span>
        <span className="text-[10px] font-bold text-white flex items-center gap-2 leading-tight">
          {status} <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
        </span>
      </div>
    </motion.div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative w-full h-[150vh]">
      {/* Sticky Content Container */}
      <div className="sticky top-0 w-full h-screen flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center pointer-events-none">
          
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
              From Digital Signals to Actionable Threats.
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

            {/* Bottom HUD Bar (Option A from prompt) */}
            <div className="flex flex-wrap gap-4 mt-8 pointer-events-none">
              <HUDElement title="THREAT SIGNALS" status="ACTIVE" icon={Activity} delay={1.2} />
              <HUDElement title="INTELLIGENCE" status="ONLINE" icon={GitCommit} delay={1.4} />
              <HUDElement title="CORRELATION" status="READY" icon={CheckCircle2} delay={1.6} />
              <HUDElement title="RISK ENGINE" status="READY" icon={ShieldAlert} delay={1.8} />
            </div>
          </div>
          
          {/* Right Side: Empty to allow the fixed 3D Globe to show clearly */}
          <div className="w-full md:w-1/2 hidden md:block">
             {/* Intentionally left blank for 3D Earth composition */}
          </div>
        </div>
      </div>
      
      {/* Gradient transition to next section */}
      <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-[#05050A] to-transparent pointer-events-none" />
    </section>
  );
}
