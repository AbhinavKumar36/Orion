import React, { useState } from 'react';
import { Play, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function AnalyzeTab({ onIncidentCreated }) {
  const [activeModule, setActiveModule] = useState('phishing');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const modules = [
    { id: 'phishing', label: 'URL / Message', endpoint: '/api/incidents/analyze/phishing' },
    { id: 'impersonation', label: 'Impersonation', endpoint: '/api/incidents/analyze/impersonation' },
    { id: 'media', label: 'Media / Deepfake', endpoint: '/api/incidents/analyze/media' },
    { id: 'authentication', label: 'Authentication', endpoint: '/api/incidents/analyze/authentication' },
    { id: 'system_activity', label: 'System Logs', endpoint: '/api/incidents/analyze/system_activity' }
  ];

  const demoPayloads = {
    phishing: {
      url: "http://orion-c0rp.com/login",
      message: { sender: "admin@orion-c0rp.com", body: "Reset your password." },
      context: { is_vip: true }
    },
    impersonation: {
      message: { sender_name: "Alice Smith", sender_domain: "orion-c0rp.com", role_claim: "CEO", body: "Please wire the payment immediately. It's urgent.", is_first_time: true },
      context: {}
    },
    media: {
      context: { executive_or_official: true }
    },
    authentication: {
      events: [
        { user_id: "admin@orion-c0rp.com", ip: "185.12.3.4", geo: { country: "RU" }, event_type: "login_failure", device_id: "dev_unknown" },
        { user_id: "admin@orion-c0rp.com", ip: "185.12.3.4", geo: { country: "RU" }, event_type: "login_failure", device_id: "dev_unknown" },
        { user_id: "admin@orion-c0rp.com", ip: "185.12.3.4", geo: { country: "RU" }, event_type: "login_failure", device_id: "dev_unknown" },
        { user_id: "admin@orion-c0rp.com", ip: "185.12.3.4", geo: { country: "RU" }, event_type: "login_failure", device_id: "dev_unknown" },
        { user_id: "admin@orion-c0rp.com", ip: "185.12.3.4", geo: { country: "RU" }, event_type: "login_failure", device_id: "dev_unknown" },
        { user_id: "admin@orion-c0rp.com", ip: "185.12.3.4", geo: { country: "RU" }, event_type: "login_success", device_id: "dev_unknown" }
      ],
      context: {}
    },
    system_activity: {
      events: [
        { source: "network_flow", actor: "admin@orion-c0rp.com", dst_ip: "185.12.3.4", bytes_out: 5000000, action: "data_transfer" }
      ],
      context: { sensitive_service: true }
    }
  };

  const handleRunDemo = async () => {
    setLoading(true);
    setResult(null);
    try {
      const currentModule = modules.find(m => m.id === activeModule);
      
      let res;
      if (activeModule === 'media') {
        const formData = new FormData();
        // Create a minimal valid 1x1 GIF for the demo to pass Tier-0 image checks
        const dummyImage = new Uint8Array([
          0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 
          0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 
          0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 
          0x44, 0x01, 0x00, 0x3b
        ]);
        const blob = new Blob([dummyImage], { type: 'image/gif' });
        formData.append('file', blob, 'demo_image.gif');
        formData.append('context', JSON.stringify(demoPayloads.media.context));
        
        res = await fetch(currentModule.endpoint, {
          method: 'POST',
          body: formData
        });
      } else {
        res = await fetch(currentModule.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(demoPayloads[activeModule])
        });
      }
      
      const data = await res.json();
      setResult(data);
      if (onIncidentCreated) {
        onIncidentCreated(data.incident_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex border-b border-border mb-4">
        {modules.map(m => (
          <button
            key={m.id}
            onClick={() => { setActiveModule(m.id); setResult(null); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${activeModule === m.id ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="glass-panel p-6 rounded-xl border border-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Manual Threat Ingestion</h2>
          <button
            onClick={handleRunDemo}
            disabled={loading}
            className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 px-4 py-2 rounded-md font-mono text-sm transition"
          >
            {loading ? <span className="animate-spin">⟳</span> : <Play className="w-4 h-4" />}
            Run Demo Sample
          </button>
        </div>
        
        <div className="bg-card/50 p-4 rounded-md font-mono text-xs text-slate-300 overflow-x-auto border border-border">
          <pre>{JSON.stringify(demoPayloads[activeModule], null, 2)}</pre>
        </div>
      </div>

      {result && (
        <div className="glass-panel p-6 rounded-xl border border-border">
          <h3 className="text-sm font-bold text-white uppercase font-mono mb-4 border-b border-border pb-2">Analysis Result Pipeline</h3>
          <div className="flex items-center gap-4 text-xs font-mono mb-6 overflow-x-auto py-2">
             <span className="text-slate-400">INPUT</span> →
             <span className="text-primary">DETECT</span> →
             <span className="text-emerald-400">CLASSIFY</span> →
             <span className="text-amber-400">SCORE</span> →
             <span className="text-cyan-400">EXPLAIN</span> →
             <span className="text-severity-critical">ALERT</span> →
             <span className="text-severity-high">RESPOND</span>
          </div>
          
          {(result.severity === 'CRITICAL' || result.severity === 'HIGH' || result.severity === 'MEDIUM' || result.assessment === 'inconclusive') && (
            <div className="bg-severity-critical/10 border border-severity-critical/30 rounded p-4 mb-4 font-mono text-sm">
                <div className="flex items-center gap-2 text-severity-critical font-bold mb-2">
                    <ShieldAlert className="w-5 h-5" />
                    🚨 ALERT GENERATED
                </div>
                <div className="text-slate-300">
                    <div><span className="text-slate-400">Alert ID:</span> ALT-{result.incident_id.split('-').pop()}</div>
                    <div><span className="text-slate-400">Severity:</span> {result.severity}</div>
                    <div><span className="text-slate-400">Channel:</span> SOC</div>
                    <div><span className="text-slate-400">Status:</span> NEW</div>
                </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-card/30 p-4 rounded border border-border">
                <div className="text-xs text-slate-400 uppercase mb-2">Verdict</div>
                <div className="flex items-center gap-3">
                    {result.assessment === 'threat' ? <ShieldAlert className="text-severity-high w-8 h-8" /> : (result.assessment === 'inconclusive' ? <AlertTriangle className="text-amber-400 w-8 h-8" /> : <CheckCircle2 className="text-emerald-400 w-8 h-8" />)}
                    <div>
                        <div className="text-lg font-bold text-white uppercase">{result.assessment}</div>
                        <div className={`text-xs ${result.severity === 'CRITICAL' ? 'text-severity-critical' : (result.severity === 'HIGH' ? 'text-severity-high' : 'text-slate-400')}`}>Severity: {result.severity}</div>
                    </div>
                </div>
             </div>
             
             <div className="bg-card/30 p-4 rounded border border-border">
                <div className="text-xs text-slate-400 uppercase mb-2">Recommended Actions</div>
                <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                    {result.recommended_actions?.map((a, idx) => (
                        <li key={idx}>{a.action}</li>
                    ))}
                </ul>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
