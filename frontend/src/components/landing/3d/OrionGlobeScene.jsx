import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointMaterial, Html, QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';

// --- CUSTOM SHADER FOR PROCEDURAL EARTH ---
const earthVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPositionNormal;
  varying vec3 vWorldPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const earthFragmentShader = `
  uniform float opacity;
  varying vec3 vNormal;
  varying vec3 vPositionNormal;
  varying vec3 vWorldPosition;

  // Simplex 3D Noise 
  // by Ian McEwan, Ashima Arts
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

  float snoise(vec3 v){ 
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

    i = mod(i, 289.0 ); 
    vec4 p = permute( permute( permute( 
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    float n_ = 1.0/7.0; 
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    // Generate noise for continents
    float n = snoise(vWorldPosition * 0.8) * 0.5 + 0.5;
    n += snoise(vWorldPosition * 2.0) * 0.25;
    
    // Threshold to create landmass vs ocean
    vec3 oceanColor = vec3(0.01, 0.01, 0.02);
    vec3 landColor = vec3(0.02, 0.04, 0.08); // Dark navy continents
    
    vec3 baseColor = mix(oceanColor, landColor, smoothstep(0.4, 0.5, n));
    
    // Fresnel effect for atmospheric rim
    float rim = 1.0 - max(0.0, dot(vNormal, -vPositionNormal));
    float intensity = pow(rim, 3.0) * 1.5;
    vec3 atmosphereColor = vec3(0.0, 0.6, 0.8) * intensity;
    
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

const GLOBE_RADIUS = 2;

const INTEL_NODES = [
  { id: 'PHISHING', lat: 40.7128, lon: -74.0060, label: 'PHISHING', desc: 'Suspicious Message' },
  { id: 'WEBSITE', lat: 35.6762, lon: 139.6503, label: 'WEBSITE', desc: 'Malicious Domain' },
  { id: 'IDENTITY', lat: 51.5074, lon: -0.1278, label: 'IDENTITY', desc: 'Impersonation Risk' },
  { id: 'AUTH', lat: 19.0760, lon: 72.8777, label: 'AUTH', desc: 'Unusual Login' },
];

const CONNECTIONS = [
  { start: 0, end: 1 },
  { start: 1, end: 2 },
  { start: 2, end: 3 },
];

function GlobeAndNetwork() {
  const globeRef = useRef();
  const atmosphereRef = useRef();
  const networkGroup = useRef();
  const { camera } = useThree();

  const earthUniforms = useMemo(() => ({ opacity: { value: 1.0 } }), []);

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
    
    // The hero is 400vh tall, the sticky container is 100vh.
    // The scrollable distance inside the hero is roughly 300vh.
    // Assuming 1vh ~ window.innerHeight / 100
    const scrollableDistance = window.innerHeight * 3;
    const scrollY = window.scrollY;
    
    // Map scroll exactly from 0 to 1 over the 300vh distance
    const progress = Math.min(Math.max(scrollY / scrollableDistance, 0), 1); 

    /*
      STAGES:
      0.0 - 0.2: Observe (Earth distant)
      0.2 - 0.4: Detect (Phishing/Website activate)
      0.4 - 0.6: Connect (Identity activates)
      0.6 - 0.7: Correlate (Auth activates)
      0.7 - 0.8: Evidence HUD appears
      0.8 - 0.9: Risk HUD appears
      0.9 - 1.0: Response Flow HUD appears
    */

    const nodeTargets = [
      progress > 0.2 ? 1 : 0, // Phishing
      progress > 0.2 ? 1 : 0, // Website
      progress > 0.4 ? 1 : 0, // Identity
      progress > 0.6 ? 1 : 0  // Auth
    ];
    
    const lineTargets = [
      progress > 0.3 ? 1 : 0,
      progress > 0.5 ? 1 : 0,
      progress > 0.65 ? 1 : 0
    ];

    // Earth fades out as network becomes primary (after 0.6)
    let currentOpacity = 1.0;
    if (progress > 0.6) {
      currentOpacity = Math.max(1 - ((progress - 0.6) * 4), 0.05); // maps 0.6-0.85 to 1.0-0.0
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

    // Apply Network State
    if (networkGroup.current) {
      const children = networkGroup.current.children;
      let nodeIdx = 0;
      let lineIdx = 0;
      
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.name.startsWith('nodeGroup')) {
          const target = nodeTargets[nodeIdx];
          child.scale.lerp(new THREE.Vector3(Math.max(target, 0.001), Math.max(target, 0.001), Math.max(target, 0.001)), 0.1);
          
          const hud = document.getElementById(`hud-${nodeIdx}`);
          if (hud) {
             hud.style.opacity = (target === 1 && currentOpacity > 0.1) ? '1' : '0';
          }
          nodeIdx++;
        } else if (child.name.startsWith('connection')) {
          const target = lineTargets[lineIdx];
          child.material.opacity += (target * 0.6 - child.material.opacity) * 0.1;
          lineIdx++;
        }
      }
    }

    // Manage Evidence, Risk, Response HUDs
    const evidenceHud = document.getElementById('hud-evidence');
    const riskHud = document.getElementById('hud-risk');
    const responseHud = document.getElementById('hud-response');

    if (evidenceHud) evidenceHud.style.opacity = progress > 0.7 ? '1' : '0';
    if (riskHud) riskHud.style.opacity = progress > 0.8 ? '1' : '0';
    if (responseHud) responseHud.style.opacity = progress > 0.9 ? '1' : '0';

    // Camera Movement
    if (!prefersReducedMotion) {
      const startCam = new THREE.Vector3(3.5, 1, 6); 
      const endCam = new THREE.Vector3(1, 0, 3); 
      
      // Interpolate camera over the full progress
      camera.position.lerpVectors(startCam, endCam, progress);
      
      const targetX = startCam.x * (1 - progress) + endCam.x * progress + (state.pointer.x * 0.2);
      const targetY = startCam.y * (1 - progress) + endCam.y * progress + (state.pointer.y * 0.2);
      
      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (targetY - camera.position.y) * 0.05;
      
      camera.lookAt(0, 0, 0);
    }
  });

  return (
    <group position={[1.5, 0, 0]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={200} array={particles} itemSize={3} />
        </bufferGeometry>
        <PointMaterial transparent color="#06b6d4" size={0.015} sizeAttenuation={true} depthWrite={false} opacity={0.3} />
      </points>

      <mesh ref={globeRef}>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <shaderMaterial
          uniforms={earthUniforms}
          vertexShader={earthVertexShader}
          fragmentShader={earthFragmentShader}
          transparent
        />
      </mesh>
      
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[GLOBE_RADIUS + 0.02, 32, 32]} />
        <meshBasicMaterial color="#06b6d4" wireframe transparent opacity={0.05} />
      </mesh>

      <group ref={networkGroup}>
        {INTEL_NODES.map((node, i) => {
          const pos = latLongToVector3(node.lat, node.lon, GLOBE_RADIUS + 0.05);
          return (
            <group key={node.id} name={`nodeGroup-${i}`} position={pos} scale={0.001}>
              <mesh>
                <sphereGeometry args={[0.03, 16, 16]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh scale={2.5}>
                <sphereGeometry args={[0.04, 16, 16]} />
                <meshBasicMaterial color="#06b6d4" transparent opacity={0.3} />
              </mesh>
              <Html position={[0.1, 0.1, 0]} center zIndexRange={[100, 0]}>
                <div id={`hud-${i}`} className="bg-[#05050A]/90 border border-cyan-500/30 px-3 py-2 rounded shadow-[0_0_15px_rgba(6,182,212,0.15)] backdrop-blur-md whitespace-nowrap opacity-0 transition-opacity duration-700 pointer-events-none">
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
            <QuadraticBezierLine
              key={`conn-${i}`}
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
          );
        })}

        {/* Global Intelligence HUDs anchored in 3D space */}
        <Html position={[-1.5, 1, 1]} center zIndexRange={[100, 0]}>
          <div id="hud-evidence" className="w-64 bg-[#05050A]/90 border border-white/10 p-4 rounded shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md opacity-0 transition-opacity duration-700 pointer-events-none">
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
          <div id="hud-risk" className="w-48 bg-[#05050A]/90 border border-red-500/20 p-4 rounded shadow-[0_0_20px_rgba(239,68,68,0.1)] backdrop-blur-md opacity-0 transition-opacity duration-700 pointer-events-none">
            <div className="text-[9px] text-slate-400 font-mono tracking-widest uppercase mb-1">RISK ASSESSMENT</div>
            <div className="text-xl font-bold text-red-500 mb-2">HIGH</div>
            <div className="flex justify-between items-end border-t border-white/5 pt-2">
              <span className="text-[10px] text-slate-500 uppercase">Risk Score</span>
              <span className="text-lg text-white font-mono">78</span>
            </div>
          </div>
        </Html>

        <Html position={[0, -1.8, 1]} center zIndexRange={[100, 0]}>
          <div id="hud-response" className="flex items-center gap-3 bg-[#05050A]/90 border border-cyan-500/20 px-6 py-3 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-md opacity-0 transition-opacity duration-700 pointer-events-none">
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
