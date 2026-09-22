import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointMaterial, Html, QuadraticBezierLine, useTexture, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { ShieldAlert, Fingerprint, Network, ShieldCheck, Search, Activity, Cpu } from 'lucide-react';

function latLongToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function getQuadraticBezierPoint(t, p0, p1, p2) {
  const l1 = new THREE.Vector3().lerpVectors(p0, p1, t);
  const l2 = new THREE.Vector3().lerpVectors(p1, p2, t);
  return new THREE.Vector3().lerpVectors(l1, l2, t);
}

const GLOBE_RADIUS = 2;

// Existing Geographic Data
const INTEL_NODES = [
  { id: 'PHISHING', lat: 40.7128, lon: -74.0060, label: 'PHISHING', desc: 'Suspicious Email' },
  { id: 'WEBSITE', lat: 35.6762, lon: 139.6503, label: 'WEBSITE', desc: 'Malicious Domain' },
  { id: 'IDENTITY', lat: 51.5074, lon: -0.1278, label: 'IDENTITY', desc: 'Impersonation Risk' },
  { id: 'MEDIA', lat: -33.8688, lon: 151.2093, label: 'MEDIA', desc: 'Deepfake Audio' },
  { id: 'TECHNICAL', lat: 1.3521, lon: 103.8198, label: 'TECHNICAL', desc: 'Reverse Proxy' },
  { id: 'AUTH', lat: 19.0760, lon: 72.8777, label: 'AUTHENTICATION', desc: 'Unusual Login' },
];

const CONNECTIONS = [
  { start: 0, end: 1, offset: 0.0 }, // PHISHING -> WEBSITE
  { start: 1, end: 2, offset: 0.2 }, // WEBSITE -> IDENTITY
  { start: 3, end: 1, offset: 0.4 }, // MEDIA -> WEBSITE
  { start: 1, end: 4, offset: 0.6 }, // WEBSITE -> TECHNICAL
  { start: 2, end: 5, offset: 0.8 }, // IDENTITY -> AUTH
];

// Precompute vectors
const precomputedNodes = INTEL_NODES.map(node => latLongToVector3(node.lat, node.lon, GLOBE_RADIUS + 0.05));
const precomputedConnections = CONNECTIONS.map(conn => {
  const startPos = precomputedNodes[conn.start];
  const endPos = precomputedNodes[conn.end];
  const midPos = startPos.clone().lerp(endPos, 0.5).normalize().multiplyScalar(GLOBE_RADIUS + 0.4);
  return { startPos, endPos, midPos, offset: conn.offset };
});

function TexturedGlobe({ currentOpacity }) {
  // Using physically based materials with emissive maps for a highly attractive VEILLE-style look
  const earthTexture = useTexture('/earth.jpg');
  const earthLightsTexture = useTexture('/earth_lights.jpg');
  
  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <meshStandardMaterial 
        map={earthTexture}
        color="#080C16" // Dark base for oceans/land to satisfy the "dark Earth" prompt
        emissiveMap={earthLightsTexture}
        emissive="#06b6d4" // ORION's signature cyan tint for the glowing cities
        emissiveIntensity={1.5}
        roughness={0.8} 
        metalness={0.2} 
        transparent
        opacity={currentOpacity}
      />
    </mesh>
  );
}

function GlobeAndNetwork() {
  const networkGroup = useRef();
  
  // Explicit refs for nodes, connections, and particles
  const nodeRefs = useRef([]);
  const connectionRefs = useRef([]);
  const particleRefs = useRef([]);
  
  const { camera } = useThree();

  const particles = useMemo(() => {
    const positions = new Float32Array(300 * 3);
    let seed = 1;
    function random() {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    }
    for (let i = 0; i < 300; i++) {
      const r = 3 + random() * 4;
      const theta = 2 * Math.PI * random();
      const phi = Math.acos(2 * random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, []);

  const [activeStage, setActiveStage] = useState(0);
  const [globeOpacity, setGlobeOpacity] = useState(1.0);

  useFrame((state) => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scrollableDistance = window.innerHeight * 3;
    const progress = Math.min(Math.max(window.scrollY / scrollableDistance, 0), 1); 

    let newStage = 0;
    if (progress >= 0.18) newStage = 1; 
    if (progress >= 0.35) newStage = 2; 
    if (progress >= 0.52) newStage = 3; 
    if (progress >= 0.68) newStage = 4; 
    if (progress >= 0.82) newStage = 5; 
    if (progress >= 0.92) newStage = 6; 
    
    if (newStage !== activeStage) setActiveStage(newStage);

    if (!prefersReducedMotion) {
      let targetCamPos = new THREE.Vector3();
      
      if (progress < 0.18) {
        targetCamPos.set(3.5, 1, 6);
      } else if (progress < 0.35) {
        const t = (progress - 0.18) / (0.35 - 0.18);
        targetCamPos.lerpVectors(new THREE.Vector3(3.5, 1, 6), new THREE.Vector3(2.5, 0.5, 5), t);
      } else if (progress < 0.52) {
        const t = (progress - 0.35) / (0.52 - 0.35);
        targetCamPos.lerpVectors(new THREE.Vector3(2.5, 0.5, 5), new THREE.Vector3(2.0, 0.2, 4.2), t);
      } else {
        const t = Math.min((progress - 0.52) / (0.92 - 0.52), 1.0);
        targetCamPos.lerpVectors(new THREE.Vector3(2.0, 0.2, 4.2), new THREE.Vector3(1.5, 0, 3.5), t);
      }
      
      targetCamPos.x += state.pointer.x * 0.15;
      targetCamPos.y += state.pointer.y * 0.15;
      camera.position.lerp(targetCamPos, 0.05);
      camera.lookAt(0, 0, 0);
    }

    let currentOpacity = 1.0;
    if (progress > 0.68) {
      currentOpacity = Math.max(1.0 - ((progress - 0.68) / 0.15), 0.15); 
    }
    setGlobeOpacity(currentOpacity);

    if (networkGroup.current && !prefersReducedMotion) {
      networkGroup.current.rotation.y += 0.0002;
    }

    const nodeTargets = [
      progress >= 0.18 ? 1 : 0,
      progress >= 0.18 ? 1 : 0,
      progress >= 0.35 ? 1 : 0,
      progress >= 0.52 ? 1 : 0,
      progress >= 0.52 ? 1 : 0,
      progress >= 0.52 ? 1 : 0 
    ];
    
    const lineTargets = [
      progress >= 0.35 ? 1 : 0,
      progress >= 0.45 ? 1 : 0,
      progress >= 0.52 ? 1 : 0,
      progress >= 0.58 ? 1 : 0,
      progress >= 0.65 ? 1 : 0 
    ];

    nodeTargets.forEach((target, idx) => {
      if (nodeRefs.current[idx]) {
        nodeRefs.current[idx].scale.lerp(new THREE.Vector3(Math.max(target, 0.001), Math.max(target, 0.001), Math.max(target, 0.001)), 0.1);
      }
    });

    lineTargets.forEach((target, idx) => {
      const line = connectionRefs.current[idx];
      const particle = particleRefs.current[idx];
      const conn = precomputedConnections[idx];

      if (line) {
        line.material.opacity += (target * 0.8 - line.material.opacity) * 0.1;
      }

      if (particle && target === 1) {
        particle.visible = true;
        const t = (state.clock.elapsedTime * 0.25 + conn.offset) % 1;
        const particlePos = getQuadraticBezierPoint(t, conn.startPos, conn.midPos, conn.endPos);
        particle.position.copy(particlePos);
        
        particle.material.opacity = line ? line.material.opacity : 1.0;
        particle.material.transparent = true;
      } else if (particle) {
        particle.visible = false;
      }
    });
  });

  return (
    <group position={[1.5, 0, 0]}>
      {/* Lighting for the Standard Material */}
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-10, -5, -5]} intensity={1.0} color="#06b6d4" />
      
      {/* Spatial Depth inspired by VEILLE */}
      <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={300} array={particles} itemSize={3} />
        </bufferGeometry>
        <PointMaterial transparent color="#06b6d4" size={0.015} sizeAttenuation={true} depthWrite={false} opacity={0.3} />
      </points>

      <Suspense fallback={
        <mesh>
          <sphereGeometry args={[GLOBE_RADIUS, 32, 32]} />
          <meshBasicMaterial color="#080C16" />
        </mesh>
      }>
        <TexturedGlobe currentOpacity={globeOpacity} />
      </Suspense>
      
      <group ref={networkGroup}>
        {INTEL_NODES.map((node, i) => (
          <group key={node.id} ref={el => nodeRefs.current[i] = el} position={precomputedNodes[i]} scale={0.001}>
            <mesh>
              <sphereGeometry args={[0.02, 16, 16]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh scale={2.5}>
              <sphereGeometry args={[0.03, 16, 16]} />
              <meshBasicMaterial color="#06b6d4" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
            </mesh>
            
            <Html position={[0.1, 0.1, 0]} center zIndexRange={[100, 0]}>
              <div 
                className={`flex items-center gap-2 bg-[#050A14]/80 border border-[#06b6d4]/30 px-3 py-1.5 rounded shadow-[0_4px_20px_rgba(6,182,212,0.15)] backdrop-blur-md whitespace-nowrap transition-all duration-700 pointer-events-none ${activeStage >= 1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#06b6d4] animate-pulse shadow-[0_0_8px_#06b6d4]" />
                <div className="flex flex-col">
                  <span className="text-[8px] text-[#06b6d4] font-mono tracking-widest uppercase">{node.label}</span>
                  <span className="text-[10px] text-white font-bold">{node.desc}</span>
                </div>
              </div>
            </Html>
          </group>
        ))}

        {precomputedConnections.map((conn, i) => (
          <group key={`conn-group-${i}`}>
            <QuadraticBezierLine
              ref={el => connectionRefs.current[i] = el}
              start={conn.startPos}
              end={conn.endPos}
              mid={conn.midPos}
              color="#0ea5e9"
              lineWidth={1.5}
              transparent
              opacity={0}
              dashed={false}
            />
            <mesh ref={el => particleRefs.current[i] = el} visible={false}>
              <sphereGeometry args={[0.018, 16, 16]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}

        {/* Premium VEILLE-style Evidence HUD */}
        <Html position={[-1.8, 1.2, 1]} center zIndexRange={[100, 0]}>
          <div 
            className={`w-72 bg-[#0A1118]/90 border border-slate-700/50 p-5 rounded flex flex-col gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all duration-1000 pointer-events-none ${activeStage >= 4 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          >
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Search className="w-4 h-4 text-[#06b6d4]" />
              <span className="text-[10px] text-[#06b6d4] font-mono tracking-widest uppercase">EVIDENCE AGGREGATION</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Network className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="flex flex-col w-full">
                  <span className="text-xs text-white font-medium">Suspicious URL Structure</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-[#06b6d4] w-[94%]" />
                    </div>
                    <span className="text-[9px] font-mono text-slate-400">94%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Fingerprint className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="flex flex-col w-full">
                  <span className="text-xs text-white font-medium">Impersonated Identity</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-[#06b6d4] w-[88%]" />
                    </div>
                    <span className="text-[9px] font-mono text-slate-400">88%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Html>

        {/* Premium Risk Assessment HUD */}
        <Html position={[1.8, -0.5, 1.5]} center zIndexRange={[100, 0]}>
          <div 
            className={`w-56 bg-[#0A1118]/90 border-l-2 border-l-red-500 border-y border-r border-y-slate-700/50 border-r-slate-700/50 p-4 rounded-r flex flex-col gap-2 shadow-[0_10px_40px_rgba(239,68,68,0.1)] backdrop-blur-xl transition-all duration-1000 pointer-events-none ${activeStage >= 5 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">RISK ASSESSMENT</span>
            </div>
            <div className="text-3xl font-bold text-white mt-1 flex items-baseline gap-2">
              78 <span className="text-sm text-red-500 font-medium">HIGH RISK</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-[10px] text-slate-500">Automated block recommended</span>
              <Activity className="w-3 h-3 text-red-500" />
            </div>
          </div>
        </Html>

        {/* Premium Response Flow HUD */}
        <Html position={[0, -2.0, 1.5]} center zIndexRange={[100, 0]}>
          <div 
            className={`flex items-center bg-[#0A1118]/90 border border-[#06b6d4]/30 rounded-full shadow-[0_10px_40px_rgba(6,182,212,0.2)] backdrop-blur-xl p-1 transition-all duration-1000 pointer-events-none ${activeStage >= 6 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            {['SIGNAL', 'EVIDENCE', 'RISK', 'RELATIONSHIP', 'RESPONSE'].map((step, idx) => (
              <React.Fragment key={step}>
                <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${idx === 4 ? 'bg-[#06b6d4]/10' : ''}`}>
                  {idx === 4 && <ShieldCheck className="w-3 h-3 text-[#06b6d4]" />}
                  <span className={idx === 4 ? "text-[10px] font-bold text-white tracking-widest" : "text-[10px] text-[#06b6d4]/70 font-mono tracking-widest"}>
                    {step}
                  </span>
                </div>
                {idx < 4 && <span className="text-slate-700 mx-1">→</span>}
              </React.Fragment>
            ))}
          </div>
        </Html>
      </group>
    </group>
  );
}

export default function OrionGlobeScene() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="w-full h-full pointer-events-auto bg-transparent">
      <Canvas camera={{ position: [3.5, 1, 6], fov: 45 }} gl={{ antialias: true, powerPreference: "high-performance" }}>
        <GlobeAndNetwork />
      </Canvas>
    </div>
  );
}
