import React, { useState, useEffect } from 'react';
import { Layers, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

export default function OverviewTab() {
  const [metrics, setMetrics] = useState(null);
  const [targets, setTargets] = useState([]);
  
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [resM, resT] = await Promise.all([
          fetch('/api/dashboard/metrics'),
          fetch('/api/dashboard/targets')
        ]);
        if (resM.ok) setMetrics(await resM.json());
        if (resT.ok) setTargets(await resT.json());
      } catch (err) {
        console.error("Failed to load dashboard metrics", err);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics) {
    return <div className="p-8 text-center text-slate-400">Loading metrics...</div>;
  }

  // Format data for charts
  const categoryData = Object.entries(metrics.categories || {}).map(([name, count]) => ({ name, count }));
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 rounded-xl border border-primary/20 bg-gradient-to-r from-surface via-card to-surface relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-primary/10 text-primary border border-primary/30">
              BPUT Hackathon PS09: CYBERGUARD
            </span>
            <span className="text-xs text-slate-400">Phase 5 Dashboard Active</span>
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
          <div className="text-3xl font-bold text-white font-mono">{metrics.total_events}</div>
          <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Continuous ingestion active
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-border glass-panel-hover">
          <div className="text-xs font-mono text-slate-400 uppercase mb-1">Threats Detected</div>
          <div className="text-3xl font-bold text-severity-high font-mono">{metrics.threats_detected}</div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Critical: <strong className="text-severity-critical">{metrics.severities['CRITICAL'] || 0}</strong></span>
            <span>High: <strong className="text-severity-high">{metrics.severities['HIGH'] || 0}</strong></span>
            <span>Med: <strong className="text-severity-medium">{metrics.severities['MEDIUM'] || 0}</strong></span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-border glass-panel-hover">
          <div className="text-xs font-mono text-slate-400 uppercase mb-1">Active Incidents</div>
          <div className="text-3xl font-bold text-amber-400 font-mono">{metrics.active_incidents}</div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>New: {metrics.statuses['new'] || 0}</span>
            <span>Triaged: {metrics.statuses['triaged'] || 0}</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-border glass-panel-hover">
          <div className="text-xs font-mono text-slate-400 uppercase mb-1">Inconclusive Assessments</div>
          <div className="text-3xl font-bold text-slate-300 font-mono">{metrics.inconclusive}</div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Requires manual verification</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-5 rounded-xl border border-border space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono mb-4">
                Threat Categories (Threats Only)
            </h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                        <XAxis type="number" stroke="#94a3b8" />
                        <YAxis dataKey="name" type="category" width={150} stroke="#94a3b8" tick={{fontSize: 11}} />
                        <RechartsTooltip cursor={{fill: '#1e293b'}} contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155'}} />
                        <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]}>
                            {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#f87171', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#818cf8', '#c084fc'][index % 7]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
        
        <div className="glass-panel p-5 rounded-xl border border-border space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono mb-4">
                Frequently Targeted Entities
            </h3>
            <div className="space-y-2">
                {targets.length === 0 ? (
                    <div className="text-sm text-slate-400 py-4">No targeting data available.</div>
                ) : (
                    targets.map((t, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded bg-card border border-border text-sm">
                            <span className="font-mono text-cyan-400">{t.value_canonical}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-slate-400 uppercase">{t.entity_type}</span>
                                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs">{t.count} hits</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
