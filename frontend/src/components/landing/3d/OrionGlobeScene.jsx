import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointMaterial, Html, QuadraticBezierLine, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// --- CUSTOM SHADER FOR REAL GEOGRAPHIC EARTH ---
const earthVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPositionNormal;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const earthFragmentShader = `
  uniform sampler2D map;
  uniform float opacity;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPositionNormal;

  void main() {
    vec4 texColor = texture2D(map, vUv);
    
    // Calculate luminance to distinguish land from ocean
    float lum = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
    
    // Map to ORION brand colors
    vec3 ocean = vec3(0.01, 0.015, 0.03);
    vec3 land = vec3(0.04, 0.08, 0.15); 
    vec3 baseColor = mix(ocean, land, smoothstep(0.1, 0.4, lum));
    
    // Restrained atmospheric rim light
    float rim = 1.0 - max(0.0, dot(vNormal, -vPositionNormal));
    float rimIntensity = pow(rim, 4.0) * 0.5; // Subtle, no blowout
    vec3 atmosphereColor = vec3(0.0, 0.5, 0.8) * rimIntensity;
    
    gl_FragColor = vec4(baseColor + atmosphereColor, opacity);
  }
`;

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

// The expanded deterministic network topology
const INTEL_NODES = [
  { id: 'PHISHING', lat: 40.7128, lon: -74.0060, label: 'PHISHING', desc: 'Suspicious Email' }, // 0: NY
  { id: 'WEBSITE', lat: 35.6762, lon: 139.6503, label: 'WEBSITE', desc: 'Malicious Domain' }, // 1: Tokyo
  { id: 'IDENTITY', lat: 51.5074, lon: -0.1278, label: 'IDENTITY', desc: 'Impersonation Risk' }, // 2: London
  { id: 'MEDIA', lat: -33.8688, lon: 151.2093, label: 'MEDIA', desc: 'Deepfake Audio' }, // 3: Sydney
  { id: 'TECHNICAL', lat: 1.3521, lon: 103.8198, label: 'TECHNICAL', desc: 'Reverse Proxy' }, // 4: Singapore
  { id: 'AUTH', lat: 19.0760, lon: 72.8777, label: 'AUTHENTICATION', desc: 'Unusual Login' }, // 5: Mumbai
];

const CONNECTIONS = [
  { start: 0, end: 1 }, // PHISHING -> WEBSITE
  { start: 1, end: 2 }, // WEBSITE -> IDENTITY
  { start: 3, end: 1 }, // MEDIA -> WEBSITE
  { start: 1, end: 4 }, // WEBSITE -> TECHNICAL
  { start: 2, end: 5 }, // IDENTITY -> AUTH
];

function GlobeAndNetwork() {
  const globeRef = useRef();
  const atmosphereRef = useRef();
  const networkGroup = useRef();
  const { camera } = useThree();

  // Load the downloaded earth texture
  const earthTexture = useTexture('/earth.jpg');
  const earthUniforms = useMemo(() => ({ 
    map: { value: earthTexture },
    opacity: { value: 1.0 } 
  }), [earthTexture]);

  // DOM Refs to avoid getElementById in useFrame
  const nodeHudRefs = useRef([]);
  const evidenceHudRef = useRef();
  const riskHudRef = useRef();
  const responseHudRef = useRef();

  // Array of meshes for travelling signal particles
  const particleRefs = useRef([]);

  const particles = useMemo(() => {
    const positions = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      const r = 3 + Math.random() * 3;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, []);

  useFrame((state) => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Master timeline based on scroll
    const scrollableDistance = window.innerHeight * 3;
    const progress = Math.min(Math.max(window.scrollY / scrollableDistance, 0), 1); 
    const pct = progress * 100;

    /*
      TIMELINE (%):
      0-20: Quiet Earth
      20-35: Earth + PHISHING
      35-50: Earth + PHISHING-WEBSITE
      50-65: Earth + PHISHING-WEBSITE-IDENTITY
      65-75: Network branches (MEDIA, TECHNICAL, AUTH)
      75-85: Earth fades out, Network primary
      85-100: Final HUDs appear (Evidence, Risk, Response)
    */

    // 1. Camera Timeline (Smooth single lerp + parallax)
    if (!prefersReducedMotion) {
      const startCam = new THREE.Vector3(3.5, 1, 6); 
      const endCam = new THREE.Vector3(1, 0, 3.5); 
      
      const currentCamPos = new THREE.Vector3().lerpVectors(startCam, endCam, progress);
      
      // Add subtle mouse parallax on top of the interpolated position
      currentCamPos.x += state.pointer.x * 0.2;
      currentCamPos.y += state.pointer.y * 0.2;
      
      // Smoothly move actual camera to calculated position
      camera.position.lerp(currentCamPos, 0.1);
      camera.lookAt(0, 0, 0);
    }

    // 2. Earth Fading Timeline
    let currentOpacity = 1.0;
    if (pct > 75) {
      currentOpacity = Math.max(1.0 - ((pct - 75) / 10), 0.05); // Fade from 75% to 85%
    }

    if (globeRef.current && atmosphereRef.current) {
      globeRef.current.material.uniforms.opacity.value = currentOpacity;
      atmosphereRef.current.material.opacity = currentOpacity * 0.05;
      
      if (!prefersReducedMotion) {
        globeRef.current.rotation.y += 0.0005;
        atmosphereRef.current.rotation.y += 0.0005;
        networkGroup.current.rotation.y += 0.0005;
      }
    }

    // 3. Network Evolve Timeline
    const nodeTargets = [
      pct > 20 ? 1 : 0, // PHISHING
      pct > 35 ? 1 : 0, // WEBSITE
      pct > 50 ? 1 : 0, // IDENTITY
      pct > 65 ? 1 : 0, // MEDIA
      pct > 65 ? 1 : 0, // TECHNICAL
      pct > 65 ? 1 : 0  // AUTH
    ];
    
    const lineTargets = [
      pct > 35 ? 1 : 0, // PHISHING -> WEBSITE
      pct > 50 ? 1 : 0, // WEBSITE -> IDENTITY
      pct > 65 ? 1 : 0, // MEDIA -> WEBSITE
      pct > 65 ? 1 : 0, // WEBSITE -> TECHNICAL
      pct > 65 ? 1 : 0  // IDENTITY -> AUTH
    ];

    if (networkGroup.current) {
      const children = networkGroup.current.children;
      let nodeIdx = 0;
      let lineIdx = 0;
      
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.name.startsWith('nodeGroup-')) {
          const target = nodeTargets[nodeIdx];
          child.scale.lerp(new THREE.Vector3(Math.max(target, 0.001), Math.max(target, 0.001), Math.max(target, 0.001)), 0.1);
          
          if (nodeHudRefs.current[nodeIdx]) {
             nodeHudRefs.current[nodeIdx].style.opacity = (target === 1 && currentOpacity > 0.1) ? '1' : '0';
          }
          nodeIdx++;
        } else if (child.name.startsWith('connection-')) {
          const target = lineTargets[lineIdx];
          child.material.opacity += (target * 0.6 - child.material.opacity) * 0.1;
          
          // Animate travelling particle along this line if active
          if (particleRefs.current[lineIdx] && target === 1) {
            particleRefs.current[lineIdx].visible = true;
            // Get the line geometry points
            const conn = CONNECTIONS[lineIdx];
            const startPos = latLongToVector3(INTEL_NODES[conn.start].lat, INTEL_NODES[conn.start].lon, GLOBE_RADIUS + 0.05);
            const endPos = latLongToVector3(INTEL_NODES[conn.end].lat, INTEL_NODES[conn.end].lon, GLOBE_RADIUS + 0.05);
            const midPos = startPos.clone().lerp(endPos, 0.5).normalize().multiplyScalar(GLOBE_RADIUS + 0.5);
            
            // Loop t from 0 to 1
            const t = (state.clock.elapsedTime * 0.4 + (lineIdx * 0.2)) % 1;
            const particlePos = getQuadraticBezierPoint(t, startPos, midPos, endPos);
            particleRefs.current[lineIdx].position.copy(particlePos);
          } else if (particleRefs.current[lineIdx]) {
            particleRefs.current[lineIdx].visible = false;
          }
          
          lineIdx++;
        }
      }
    }

    // 4. Final HUDs Timeline
    if (evidenceHudRef.current) evidenceHudRef.current.style.opacity = pct > 85 ? '1' : '0';
    if (riskHudRef.current) riskHudRef.current.style.opacity = pct > 90 ? '1' : '0';
    if (responseHudRef.current) responseHudRef.current.style.opacity = pct > 95 ? '1' : '0';
  });

  return (
    <group position={[1.5, 0, 0]}>
      {/* Background Particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={200} array={particles} itemSize={3} />
        </bufferGeometry>
        <PointMaterial transparent color="#06b6d4" size={0.015} sizeAttenuation={true} depthWrite={false} opacity={0.3} />
      </points>

      {/* Earth */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <shaderMaterial
          uniforms={earthUniforms}
          vertexShader={earthVertexShader}
          fragmentShader={earthFragmentShader}
          transparent
        />
      </mesh>
      
      {/* Atmosphere */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[GLOBE_RADIUS + 0.02, 32, 32]} />
        <meshBasicMaterial color="#06b6d4" wireframe transparent opacity={0.05} />
      </mesh>

      {/* Intelligence Network */}
      <group ref={networkGroup}>
        {INTEL_NODES.map((node, i) => {
          const pos = latLongToVector3(node.lat, node.lon, GLOBE_RADIUS + 0.05);
          return (
            <group key={node.id} name={`nodeGroup-${i}`} position={pos} scale={0.001}>
              {/* Core signal */}
              <mesh>
                <sphereGeometry args={[0.03, 16, 16]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              {/* Cyan glow */}
              <mesh scale={2.5}>
                <sphereGeometry args={[0.04, 16, 16]} />
                <meshBasicMaterial color="#06b6d4" transparent opacity={0.3} />
              </mesh>
              <Html position={[0.1, 0.1, 0]} center zIndexRange={[100, 0]}>
                <div 
                  ref={el => nodeHudRefs.current[i] = el}
                  className="bg-[#05050A]/90 border border-cyan-500/30 px-3 py-2 rounded shadow-[0_0_15px_rgba(6,182,212,0.15)] backdrop-blur-md whitespace-nowrap opacity-0 transition-opacity duration-500 pointer-events-none"
                >
                  <div className="text-[9px] text-cyan-400 font-mono tracking-widest uppercase flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                    {node.label}
                  </div>
                  <div className="text-[10px] text-white mt-1 font-light">{node.desc}</div>
                </div>
              </Html>
            </group>
          );
        })}

        {CONNECTIONS.map((conn, i) => {
          const startNode = INTEL_NODES[conn.start];
          const endNode = INTEL_NODES[conn.end];
          const startPos = latLongToVector3(startNode.lat, startNode.lon, GLOBE_RADIUS + 0.05);
          const endPos = latLongToVector3(endNode.lat, endNode.lon, GLOBE_RADIUS + 0.05);
          const midPos = startPos.clone().lerp(endPos, 0.5).normalize().multiplyScalar(GLOBE_RADIUS + 0.5);

          return (
            <group key={`conn-group-${i}`}>
              <QuadraticBezierLine
                name={`connection-${i}`}
                start={startPos}
                end={endPos}
                mid={midPos}
                color="#0ea5e9"
                lineWidth={1.5}
                transparent
                opacity={0}
                dashed={false}
              />
              {/* Travelling signal particle */}
              <mesh ref={el => particleRefs.current[i] = el} visible={false}>
                <sphereGeometry args={[0.02, 8, 8]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
          );
        })}

        {/* Global Intelligence HUDs anchored in 3D space */}
        <Html position={[-1.5, 1, 1]} center zIndexRange={[100, 0]}>
          <div 
            ref={evidenceHudRef}
            className="w-64 bg-[#05050A]/90 border border-white/10 p-4 rounded shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md opacity-0 transition-opacity duration-700 pointer-events-none"
          >
            <div className="text-[9px] text-cyan-500 font-mono tracking-widest uppercase mb-3">EVIDENCE AGGREGATION</div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-xs text-slate-300 font-light">
                <span className="text-cyan-500 mt-0.5">•</span> Suspicious URL structure
              </li>
              <li className="flex items-start gap-2 text-xs text-slate-300 font-light">
                <span className="text-cyan-500 mt-0.5">•</span> Impersonated identity
              </li>
              <li className="flex items-start gap-2 text-xs text-slate-300 font-light">
                <span className="text-cyan-500 mt-0.5">•</span> Credential-oriented behavior
              </li>
            </ul>
          </div>
        </Html>

        <Html position={[1.5, -0.5, 1]} center zIndexRange={[100, 0]}>
          <div 
            ref={riskHudRef}
            className="w-48 bg-[#05050A]/90 border border-red-500/20 p-4 rounded shadow-[0_0_20px_rgba(239,68,68,0.1)] backdrop-blur-md opacity-0 transition-opacity duration-700 pointer-events-none"
          >
            <div className="text-[9px] text-slate-400 font-mono tracking-widest uppercase mb-1">RISK ASSESSMENT</div>
            <div className="text-xl font-bold text-red-500 mb-2">HIGH</div>
            <div className="flex justify-between items-end border-t border-white/5 pt-2">
              <span className="text-[10px] text-slate-500 uppercase">Risk Score</span>
              <span className="text-lg text-white font-mono">78</span>
            </div>
          </div>
        </Html>

        <Html position={[0, -1.8, 1]} center zIndexRange={[100, 0]}>
          <div 
            ref={responseHudRef}
            className="flex items-center gap-3 bg-[#05050A]/90 border border-cyan-500/20 px-6 py-3 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-md opacity-0 transition-opacity duration-700 pointer-events-none"
          >
            {['SIGNAL', 'EVIDENCE', 'RISK', 'RELATIONSHIP', 'RESPONSE'].map((step, idx) => (
              <React.Fragment key={step}>
                <span className={idx === 4 ? "text-[10px] font-bold text-white tracking-widest" : "text-[10px] text-cyan-400/70 font-mono tracking-widest"}>
                  {step}
                </span>
                {idx < 4 && <span className="text-slate-600">→</span>}
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
