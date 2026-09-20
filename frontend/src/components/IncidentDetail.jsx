import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldAlert, CheckCircle2, PlayCircle, Shield, FileText, Info } from 'lucide-react';

export default function IncidentDetail({ incidentId, onBack }) {
  const [incident, setIncident] = useState(null);
  const [simulating, setSimulating] = useState(null);

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const res = await fetch(`/api/incidents/${incidentId}`);
        if (res.ok) {
          setIncident(await res.json());
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchIncident();
  }, [incidentId]);

  const handleSimulateAction = async (actionName) => {
    setSimulating(actionName);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/actions/${actionName}/simulate`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        // Update local state
        setIncident(prev => {
          const newActions = prev.recommended_actions.map(a => 
            a.action === actionName ? { ...a, status: 'simulated', simulated_at: data.simulated_at } : a
          );
          return { ...prev, recommended_actions: newActions };
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(null);
    }
  };

  if (!incident) {
    return <div className="p-8 text-center text-slate-400">Loading incident {incidentId}...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-surface hover:bg-card border border-border rounded text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white font-mono flex items-center gap-3">
              {incident.incident_id}
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                incident.severity === 'CRITICAL' ? 'bg-severity-critical/20 text-severity-critical' :
                incident.severity === 'HIGH' ? 'bg-severity-high/20 text-severity-high' :
                incident.severity === 'MEDIUM' ? 'bg-severity-medium/20 text-severity-medium' :
                'bg-slate-700 text-slate-300'
              }`}>
                {incident.severity}
              </span>
            </h2>
            <div className="text-sm text-slate-400 flex items-center gap-2 mt-1">
              <span className="uppercase text-xs font-bold text-primary">{incident.module} module</span>
              <span>•</span>
              <span>{incident.threat_type}</span>
              <span>•</span>
              <span>{new Date(incident.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-xl border border-border">
            <h3 className="text-sm font-bold text-white uppercase font-mono mb-4 border-b border-border pb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" /> Incident Explanation
            </h3>
            <div className="text-sm text-slate-300 mb-4 bg-card p-4 rounded border border-border italic">
              {incident.explanation.summary}
            </div>
            
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Evidence Drivers</h4>
            <div className="space-y-3">
              {incident.evidence.map(ev => (
                <div key={ev.type} className="bg-surface p-3 rounded border border-border text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-cyan-400">{ev.type}</span>
                    <span className="text-xs text-slate-400">{ev.contribution > 0 ? '+' : ''}{ev.contribution.toFixed(1)} pts</span>
                  </div>
                  <div className="w-full bg-card h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, ev.contribution_pct * 100))}%` }}></div>
                  </div>
                  <div className="text-xs text-slate-400 mt-2">{ev.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl border border-border">
            <h3 className="text-sm font-bold text-white uppercase font-mono mb-4 border-b border-border pb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Risk Breakdown & Confidence
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card p-3 rounded border border-border text-center">
                 <div className="text-[10px] text-slate-400 uppercase">Probability (P)</div>
                 <div className="font-mono text-xl text-white">{incident.risk_breakdown.P !== null ? incident.risk_breakdown.P.toFixed(2) : 'N/A'}</div>
              </div>
              <div className="bg-card p-3 rounded border border-border text-center">
                 <div className="text-[10px] text-slate-400 uppercase">Evidence (E)</div>
                 <div className="font-mono text-xl text-white">{incident.risk_breakdown.E.toFixed(2)}</div>
              </div>
              <div className="bg-card p-3 rounded border border-border text-center">
                 <div className="text-[10px] text-slate-400 uppercase">Impact Score</div>
                 <div className="font-mono text-xl text-white">{incident.risk_breakdown.impact_score.toFixed(1)}</div>
              </div>
              <div className="bg-card p-3 rounded border border-border text-center">
                 <div className="text-[10px] text-slate-400 uppercase">Final Risk</div>
                 <div className="font-mono text-xl text-severity-high font-bold">{incident.risk_score.toFixed(1)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Actions & Context */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-xl border border-border">
            <h3 className="text-sm font-bold text-white uppercase font-mono mb-4 border-b border-border pb-2 flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-emerald-400" /> Playbooks (Simulated)
            </h3>
            <div className="space-y-3">
              {incident.recommended_actions.map(action => (
                <div key={action.action} className="bg-card p-3 rounded border border-border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-300 font-mono">{action.action}</span>
                    {action.status === 'simulated' ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Simulated
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSimulateAction(action.action)}
                        disabled={simulating === action.action}
                        className="text-[10px] bg-primary/20 text-primary hover:bg-primary/40 border border-primary/30 px-2 py-1 rounded transition"
                      >
                        {simulating === action.action ? 'Simulating...' : 'Run Playbook'}
                      </button>
                    )}
                  </div>
                  {action.simulated_at && (
                    <div className="text-[10px] text-slate-500">Executed at: {new Date(action.simulated_at).toLocaleString()}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl border border-border">
            <h3 className="text-sm font-bold text-white uppercase font-mono mb-4 border-b border-border pb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" /> MITRE ATT&CK
            </h3>
            {incident.mitre_attack && incident.mitre_attack.length > 0 ? (
               <div className="flex flex-wrap gap-2">
                 {incident.mitre_attack.map(m => (
                    <span key={m.tactic} className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-[11px] font-mono border border-slate-700">
                      {m.technique_id} - {m.technique_name}
                    </span>
                 ))}
               </div>
            ) : (
               <div className="text-xs text-slate-500">No specific MITRE mapping for this threat type.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
