import React, { useState, useEffect } from 'react';
import { Eye, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function IncidentsTab({ onViewDetail }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await fetch('/api/incidents/');
        if (res.ok) {
          setIncidents(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Incident Feed</h2>
      </div>

      <div className="glass-panel rounded-xl border border-border overflow-hidden">
        {loading && incidents.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Loading incidents...</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-surface/50 border-b border-border text-xs uppercase font-mono text-slate-400">
              <tr>
                <th className="px-6 py-4">Incident ID</th>
                <th className="px-6 py-4">Module</th>
                <th className="px-6 py-4">Threat Type</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {incidents.map((inc) => (
                <tr key={inc.incident_id} className="hover:bg-card/40 transition">
                  <td className="px-6 py-4 font-mono text-cyan-400">{inc.incident_id}</td>
                  <td className="px-6 py-4 uppercase text-xs">{inc.module}</td>
                  <td className="px-6 py-4">{inc.threat_type}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                      inc.severity === 'CRITICAL' ? 'bg-severity-critical/20 text-severity-critical' :
                      inc.severity === 'HIGH' ? 'bg-severity-high/20 text-severity-high' :
                      inc.severity === 'MEDIUM' ? 'bg-severity-medium/20 text-severity-medium' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs">{inc.status}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onViewDetail(inc.incident_id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded transition border border-primary/20 text-xs font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
