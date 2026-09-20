import React, { useState, useEffect } from 'react';
import { Layers, Network } from 'lucide-react';

export default function ThreatIntelTab() {
  const [entities, setEntities] = useState([]);
  
  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const res = await fetch('/api/dashboard/targets');
        if (res.ok) setEntities(await res.json());
      } catch (err) {
        console.error("Failed to load intel", err);
      }
    };
    fetchEntities();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="glass-panel p-6 rounded-xl border border-border">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
          <Network className="w-5 h-5 text-primary" /> Threat Intelligence & Entity Graph
        </h2>
        
        <div className="bg-card border border-border rounded-xl p-8 mb-6 text-center text-slate-400">
            [Interactive Node-based Constellation Graph Placeholder]
            <br />
            <span className="text-xs">React Flow / D3 integration slated for Phase 6 metrics view.</span>
        </div>

        <h3 className="text-sm font-bold text-slate-300 uppercase font-mono mb-4">Top Targeted Entities</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-surface/50 border-b border-border text-xs uppercase font-mono text-slate-400">
              <tr>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Incident Occurrences</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entities.map((ent, idx) => (
                <tr key={idx} className="hover:bg-card/40">
                  <td className="px-4 py-3 font-mono text-cyan-400">{ent.value_canonical}</td>
                  <td className="px-4 py-3 uppercase text-[10px]">{ent.entity_type}</td>
                  <td className="px-4 py-3">{ent.count}</td>
                </tr>
              ))}
              {entities.length === 0 && (
                <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-slate-500">No entity intelligence gathered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
