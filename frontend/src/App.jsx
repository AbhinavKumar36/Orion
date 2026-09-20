import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  AlertTriangle,
  Radio,
  FileText,
  Layers,
  BarChart3,
  Settings,
  RefreshCw,
  Terminal,
  Cpu,
  Database,
  CheckCircle2,
  ExternalLink,
  Lock,
  Eye,
  Crosshair,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [health, setHealth] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [latency, setLatency] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStatus = async () => {
    setIsRefreshing(true);
    const start = performance.now();
    try {
      const [resHealth, resInfo] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/system/info'),
      ]);
      const end = performance.now();
      setLatency(Math.round(end - start));

      if (resHealth.ok) {
        const dataH = await resHealth.json();
        setHealth(dataH);
      }
      if (resInfo.ok) {
        const dataI = await resInfo.json();
        setSystemInfo(dataI);
      }
    } catch (err) {
      console.error('Failed to reach backend API:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'overview', label: 'SOC Overview', icon: Activity },
    { id: 'analyze', label: 'Threat Ingestion', icon: Crosshair },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
    { id: 'intel', label: 'Threat Constellation', icon: Layers },
    { id: 'feed', label: 'Live Telemetry', icon: Radio },
    { id: 'evaluation', label: 'Evaluation & Ablation', icon: BarChart3 },
    { id: 'settings', label: 'System & Registry', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(0,242,254,0.3)]">
              <Shield className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-wider text-white">ORION</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/40">
                  Master v3.3
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  risk-cfg-1.1
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                AI Threat Intelligence & Digital Trust Platform (PS09 CYBERGUARD)
              </p>
            </div>
          </div>
        </div>

        {/* Status Indicators & Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-card/60 border border-border text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${health?.status === 'ok' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400 animate-ping'}`} />
              <span className="text-slate-300 font-mono text-[11px]">
                {health?.status === 'ok' ? 'ONLINE' : 'CONNECTING...'}
              </span>
            </div>
            {latency && (
              <span className="text-[10px] text-slate-400 font-mono border-l border-border pl-3">
                {latency}ms
              </span>
            )}
            <span className="text-[10px] text-slate-400 font-mono border-l border-border pl-3 flex items-center gap-1">
              <Database className="w-3 h-3 text-slate-400" />
              SQLite WAL
            </span>
          </div>

          <button
            onClick={fetchStatus}
            disabled={isRefreshing}
            className="p-2 rounded-md hover:bg-card border border-transparent hover:border-border text-slate-400 hover:text-primary transition"
            title="Refresh System Health"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r border-border bg-surface/50 p-4 flex flex-col justify-between">
          <nav className="space-y-1">
            <div className="text-[11px] font-mono text-slate-500 uppercase px-3 mb-2 tracking-wider">
              Control Matrix
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/30 shadow-[0_0_12px_rgba(0,242,254,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-card/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Dual Layer Indicator in Sidebar */}
          <div className="glass-panel p-3 rounded-lg text-xs space-y-2">
            <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              Protected Layers
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Human Layer
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Technology Layer
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                Active
              </span>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Welcome Banner */}
              <div className="glass-panel p-6 rounded-xl border border-primary/20 bg-gradient-to-r from-surface via-card to-surface relative overflow-hidden">
                <div className="relative z-10 max-w-3xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-primary/10 text-primary border border-primary/30">
                      BPUT Hackathon PS09: CYBERGUARD
                    </span>
                    <span className="text-xs text-slate-400">Phase 0 Baseline Active</span>
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">
                    Autonomous Multi-Source Cyber Threat Intelligence
                  </h1>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    ORION continuously fuses digital indicators across the Human Layer (phishing, impersonation, synthetic media) and Technology Layer (account takeover, API abuse, exfiltration) into explainable, prioritized incident assessments.
                  </p>
                </div>
              </div>

              {/* PS09 "F" Command Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-4 rounded-xl border border-border glass-panel-hover">
                  <div className="text-xs font-mono text-slate-400 uppercase mb-1">Total Events Analyzed</div>
                  <div className="text-3xl font-bold text-white font-mono">1,042</div>
                  <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Continuous ingestion active
                  </div>
                </div>

                <div className="glass-panel p-4 rounded-xl border border-border glass-panel-hover">
                  <div className="text-xs font-mono text-slate-400 uppercase mb-1">Threats Detected</div>
                  <div className="text-3xl font-bold text-severity-high font-mono">38</div>
                  <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Critical: <strong className="text-severity-critical">7</strong></span>
                    <span>High: <strong className="text-severity-high">16</strong></span>
                    <span>Med: <strong className="text-severity-medium">15</strong></span>
                  </div>
                </div>

                <div className="glass-panel p-4 rounded-xl border border-border glass-panel-hover">
                  <div className="text-xs font-mono text-slate-400 uppercase mb-1">Human Layer Threats</div>
                  <div className="text-3xl font-bold text-cyan-400 font-mono">24</div>
                  <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Phishing: 14</span>
                    <span>Impersonation: 6</span>
                    <span>Media: 4</span>
                  </div>
                </div>

                <div className="glass-panel p-4 rounded-xl border border-border glass-panel-hover">
                  <div className="text-xs font-mono text-slate-400 uppercase mb-1">Technology Layer Threats</div>
                  <div className="text-3xl font-bold text-emerald-400 font-mono">14</div>
                  <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>ATO / Spraying: 9</span>
                    <span>Exfiltration: 5</span>
                  </div>
                </div>
              </div>

              {/* Attack Constellation Storyline Card */}
              <div className="glass-panel p-5 rounded-xl border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
                      Correlated Attack Constellation (Demo Storyline)
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    Chain: A1 → B1 → D1
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Shared entity graph correlated 3 cross-module incidents under user <code className="text-primary font-mono">user_1042</code> and external source <code className="text-primary font-mono">198.51.100.23</code>.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-card/60 border border-severity-critical/30">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono text-severity-critical font-semibold">ORN-DEMO-A1</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-severity-critical/20 text-severity-critical">CRITICAL (100)</span>
                    </div>
                    <div className="text-xs text-white font-medium">Credential Harvesting Phish</div>
                    <div className="text-[11px] text-slate-400 mt-1">Lookalike domain targeting user_1042</div>
                  </div>

                  <div className="p-3 rounded-lg bg-card/60 border border-severity-high/30">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono text-severity-high font-semibold">ORN-DEMO-B1</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-severity-high/20 text-severity-high">HIGH (78)</span>
                    </div>
                    <div className="text-xs text-white font-medium">Account Takeover (ATO)</div>
                    <div className="text-[11px] text-slate-400 mt-1">Failed burst + success from IP 198.51.100.23</div>
                  </div>

                  <div className="p-3 rounded-lg bg-card/60 border border-severity-high/30">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono text-severity-high font-semibold">ORN-DEMO-D1</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-severity-high/20 text-severity-high">HIGH (66)</span>
                    </div>
                    <div className="text-xs text-white font-medium">Sensitive Data Exfiltration</div>
                    <div className="text-[11px] text-slate-400 mt-1">Outbound volume spike to external IP</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'overview' && (
            <div className="glass-panel p-8 rounded-xl border border-border text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mx-auto">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white capitalize">{activeTab} Module</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Baseline scaffolding complete. Full interactive interface for this view will activate during its respective phase as defined in the 7-day schedule.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
