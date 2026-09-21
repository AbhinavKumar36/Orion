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

import OverviewTab from './components/OverviewTab';
import AnalyzeTab from './components/AnalyzeTab';
import IncidentsTab from './components/IncidentsTab';
import IncidentDetail from './components/IncidentDetail';
import ThreatIntelTab from './components/ThreatIntelTab';
import LiveAlertFeed from './components/LiveAlertFeed';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeIncidentId, setActiveIncidentId] = useState(null);
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
                  onClick={() => {
                      setActiveTab(item.id);
                      if (item.id !== 'incidentDetail') {
                          setActiveIncidentId(null);
                      }
                  }}
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
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'analyze' && <AnalyzeTab onIncidentCreated={(id) => { setActiveIncidentId(id); setActiveTab('incidentDetail'); }} />}
          {activeTab === 'incidents' && <IncidentsTab onViewDetail={(id) => { setActiveIncidentId(id); setActiveTab('incidentDetail'); }} />}
          {activeTab === 'incidentDetail' && activeIncidentId && <IncidentDetail incidentId={activeIncidentId} onBack={() => { setActiveIncidentId(null); setActiveTab('incidents'); }} />}
          {activeTab === 'intel' && <ThreatIntelTab />}
          {activeTab === 'feed' && <LiveAlertFeed />}

          {(!['overview', 'analyze', 'incidents', 'incidentDetail', 'intel', 'feed'].includes(activeTab)) && (
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
