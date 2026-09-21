import React, { useState, useEffect, useRef } from 'react';
import { Layers, Network, Server, User, Globe, File, Link2, ShieldAlert } from 'lucide-react';

// A simple force-directed/circular graph visualization using SVG
function ConstellationGraph({ nodes, edges }) {
  const svgRef = useRef(null);
  const [positions, setPositions] = useState({});
  const width = 800;
  const height = 400;

  useEffect(() => {
    if (!nodes || nodes.length === 0) return;

    // Simple Circular Layout based on Correlation ID groupings
    const newPositions = {};
    
    // Group incidents by correlation_id
    const corrGroups = {};
    nodes.filter(n => n.type === 'incident').forEach(n => {
      const cid = n.correlation_id || 'unlinked';
      if (!corrGroups[cid]) corrGroups[cid] = { incidents: [], entities: [] };
      corrGroups[cid].incidents.push(n);
    });

    // Map entities to the groups they connect to (simplification: assign to first group found)
    nodes.filter(n => n.type === 'entity').forEach(n => {
      let assigned = false;
      for (const e of edges) {
        if (e.target === n.id) {
          const inc = nodes.find(nn => nn.id === e.source);
          if (inc) {
            const cid = inc.correlation_id || 'unlinked';
            if (corrGroups[cid]) {
              corrGroups[cid].entities.push(n);
              assigned = true;
              break;
            }
          }
        }
      }
      if (!assigned) {
         if (!corrGroups['unlinked']) corrGroups['unlinked'] = { incidents: [], entities: [] };
         corrGroups['unlinked'].entities.push(n);
      }
    });

    // Layout each group in a circle
    const groupKeys = Object.keys(corrGroups);
    const cols = Math.ceil(Math.sqrt(groupKeys.length)) || 1;
    const rows = Math.ceil(groupKeys.length / cols) || 1;
    
    const cellW = width / cols;
    const cellH = height / rows;

    groupKeys.forEach((k, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const centerX = col * cellW + cellW / 2;
      const centerY = row * cellH + cellH / 2;
      const radius = Math.min(cellW, cellH) / 3;

      const groupNodes = [...corrGroups[k].incidents, ...corrGroups[k].entities];
      const angleStep = (2 * Math.PI) / groupNodes.length;

      groupNodes.forEach((n, ni) => {
        const angle = ni * angleStep;
        newPositions[n.id] = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        };
      });
    });

    setPositions(newPositions);
  }, [nodes, edges]);

  const getNodeColor = (node) => {
    if (node.type === 'entity') return '#22d3ee'; // cyan-400
    if (node.severity === 'CRITICAL') return '#ef4444'; // red-500
    if (node.severity === 'HIGH') return '#f97316'; // orange-500
    if (node.severity === 'MEDIUM') return '#eab308'; // yellow-500
    return '#3b82f6'; // blue-500
  };

  const getEntityIcon = (type) => {
    switch(type) {
      case 'ip': return <Server size={14} />;
      case 'email': return <User size={14} />;
      case 'domain': return <Globe size={14} />;
      case 'url': return <Link2 size={14} />;
      case 'process': return <File size={14} />;
      default: return <Network size={14} />;
    }
  };

  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] border border-border/50 rounded-xl bg-card/20">
        <p className="text-slate-500">No constellation data available.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden border border-border/50 rounded-xl bg-card/20" style={{ height: '400px' }}>
      <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
          </marker>
        </defs>
        {edges.map((e, i) => {
          const p1 = positions[e.source];
          const p2 = positions[e.target];
          if (!p1 || !p2) return null;
          return (
            <line 
              key={i} 
              x1={p1.x} 
              y1={p1.y} 
              x2={p2.x} 
              y2={p2.y} 
              stroke="#475569" 
              strokeWidth="2"
              strokeDasharray={e.dashed ? "4 4" : "0"}
              markerEnd="url(#arrowhead)"
              className="opacity-50"
            />
          );
        })}
      </svg>
      {nodes.map(n => {
        const p = positions[n.id];
        if (!p) return null;
        const isEntity = n.type === 'entity';
        return (
          <div 
            key={n.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center cursor-pointer group pointer-events-auto"
            style={{ left: p.x, top: p.y }}
            title={isEntity ? `Entity: ${n.value_canonical} (${n.entity_type})` : `Incident: ${n.threat_type} (${n.severity})`}
          >
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 z-10 transition-transform group-hover:scale-110 ${isEntity ? 'bg-slate-800 border-cyan-500/50' : 'bg-slate-900 border-slate-700'}`}
              style={{ borderColor: !isEntity ? getNodeColor(n) : undefined }}
            >
              {isEntity ? (
                <span className="text-cyan-400">{getEntityIcon(n.entity_type)}</span>
              ) : (
                <ShieldAlert size={16} color={getNodeColor(n)} />
              )}
            </div>
            <div className="absolute top-11 bg-slate-900/90 border border-slate-700 text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
              {isEntity ? (
                <span className="font-mono text-cyan-300">{n.value_canonical}</span>
              ) : (
                <span className="font-semibold text-slate-200">{n.id.split('-')[1] || n.id} - {n.module}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ThreatIntelTab() {
  const [entities, setEntities] = useState([]);
  const [constellation, setConstellation] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [entRes, constRes] = await Promise.all([
          fetch('/api/dashboard/targets'),
          fetch('/api/threat-intel/constellations')
        ]);
        
        if (entRes.ok) setEntities(await entRes.json());
        if (constRes.ok) setConstellation(await constRes.json());
      } catch (err) {
        console.error("Failed to load intel", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="glass-panel p-6 rounded-xl border border-border">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
          <Network className="w-5 h-5 text-primary" /> Threat Intelligence & Entity Constellations
        </h2>
        
        <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-300 uppercase font-mono mb-4">Constellation Graph</h3>
            {loading ? (
              <div className="flex items-center justify-center h-[400px] border border-border/50 rounded-xl bg-card/20">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <ConstellationGraph nodes={constellation.nodes} edges={constellation.edges} />
            )}
            <p className="text-xs text-slate-500 mt-2 text-center">Nodes represent Incidents and Entities. Edges indicate when an entity is observed in a digital payload.</p>
        </div>

        <h3 className="text-sm font-bold text-slate-300 uppercase font-mono mb-4 mt-8">Top Targeted Entities</h3>
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
              {entities.length === 0 && !loading && (
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
