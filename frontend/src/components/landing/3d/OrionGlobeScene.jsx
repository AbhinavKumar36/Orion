import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, Line, Stars, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Procedural Globe with scroll-driven interactions
function GlobeAndNetwork() {
  const globeRef = useRef();
  const globeWireRef = useRef();
  const networkGroup = useRef();
  const { camera } = useThree();

  // Network Nodes definitions
  const nodes = useMemo(() => [
    { id: 'PHISHING', pos: new THREE.Vector3(-1.2, 0.8, 1.5) },
    { id: 'WEBSITE', pos: new THREE.Vector3(1.5, 0.5, 1.2) },
    { id: 'IDENTITY', pos: new THREE.Vector3(0.5, 1.8, 0.8) },
    { id: 'MEDIA', pos: new THREE.Vector3(-1.5, -0.5, 1.0) },
    { id: 'AUTH', pos: new THREE.Vector3(1.0, -1.2, 1.4) },
    { id: 'SYSTEM', pos: new THREE.Vector3(-0.5, -1.5, 1.2) },
    { id: 'THREAT', pos: new THREE.Vector3(0, 0, 2.0) }, // Central core node
  ], []);

  // Pre-calculate connections
  const connections = useMemo(() => {
    const lines = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        // Only connect some nodes to avoid a complete graph immediately
        if (Math.random() > 0.3 || nodes[i].id === 'THREAT' || nodes[j].id === 'THREAT') {
          lines.push({ start: nodes[i].pos, end: nodes[j].pos });
        }
      }
    }
    return lines;
  }, [nodes]);

  // Generate sparse technical particles
  const particles = useMemo(() => {
    const positions = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      const r = 2.5 + Math.random() * 2;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    return positions;
  }, []);

  useFrame((state) => {
    // Read scroll percentage based on typical heights.
    // 0 = top, 1 = scrolled down heavily. We'll use 4000px as a rough max scroll distance for the animation.
    const scrollY = window.scrollY;
    // Map scroll progress to a 0 to 1 scale over 3000 pixels
    const progress = Math.min(Math.max(scrollY / 3000, 0), 1); 

    // Handle Reduced Motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. GLOBE ROTATION
    if (globeRef.current && globeWireRef.current) {
      if (!prefersReducedMotion) {
        globeRef.current.rotation.y += 0.001;
        globeWireRef.current.rotation.y += 0.0012;
      }
      
      // Stage 4: Fade the globe as we enter the network
      const fadeThreshold = 0.6;
      if (progress > fadeThreshold) {
        const opacity = 1 - ((progress - fadeThreshold) / (1 - fadeThreshold));
        globeRef.current.material.opacity = Math.max(opacity, 0.1);
        globeWireRef.current.material.opacity = Math.max(opacity * 0.3, 0.05);
      } else {
        globeRef.current.material.opacity = 1;
        globeWireRef.current.material.opacity = 0.3;
      }
    }

    // 2. CAMERA MOVEMENT
    if (!prefersReducedMotion) {
      // Stage 1: Camera far, offset to the right (since globe is on the right of the Hero desktop)
      // Stage 4: Camera moves in close to the network center
      const startCam = new THREE.Vector3(4, 0, 8); 
      const endCam = new THREE.Vector3(0, 0, 2.5); // Inside the network
      
      // Interpolate camera position based on scroll
      camera.position.lerpVectors(startCam, endCam, progress);
      
      // Mouse Parallax (subtle)
      const targetX = startCam.x * (1 - progress) + endCam.x * progress + (state.pointer.x * 0.5);
      const targetY = startCam.y * (1 - progress) + endCam.y * progress + (state.pointer.y * 0.5);
      
      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (targetY - camera.position.y) * 0.05;
      
      camera.lookAt(0, 0, 0);
    }

    // 3. NETWORK REVEAL
    if (networkGroup.current) {
      // Nodes scale up and connections appear based on progress
      networkGroup.current.children.forEach((child, i) => {
        // Use child index and progress to stagger appearances
        const threshold = i / networkGroup.current.children.length * 0.5 + 0.1; 
        
        if (child.type === 'Group') { // Node
          const targetScale = progress > threshold ? 1 : 0.01;
          child.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        } else if (child.type === 'Line') { // Connection
          const lineThreshold = threshold + 0.2; // lines appear after nodes
          if (progress > lineThreshold && child.material.opacity < 0.4) {
            child.material.opacity += 0.01;
          } else if (progress <= lineThreshold && child.material.opacity > 0) {
            child.material.opacity -= 0.01;
          }
        }
      });
      
      if (!prefersReducedMotion) {
        networkGroup.current.rotation.y = state.clock.elapsedTime * 0.05;
      }
    }
  });

  return (
    <group>
      {/* Background Stars / Dust */}
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
      
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={500} array={particles} itemSize={3} />
        </bufferGeometry>
        <PointMaterial transparent color="#06b6d4" size={0.02} sizeAttenuation={true} depthWrite={false} opacity={0.3} />
      </points>

      {/* Solid Dark Globe Core */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial color="#020205" roughness={0.7} metalness={0.2} transparent />
      </mesh>
      
      {/* Wireframe Technical Grid */}
      <mesh ref={globeWireRef}>
        <sphereGeometry args={[2.05, 32, 32]} />
        <meshBasicMaterial color="#06b6d4" wireframe transparent opacity={0.3} />
      </mesh>

      {/* Network Nodes and Connections */}
      <group ref={networkGroup}>
        {connections.map((conn, i) => (
          <Line
            key={`line-${i}`}
            points={[conn.start, conn.end]}
            color="#0ea5e9"
            lineWidth={1}
            transparent
            opacity={0} // Managed in useFrame
            depthWrite={false}
          />
        ))}
        {nodes.map((node, i) => (
          <group key={`node-${i}`} position={node.pos} scale={0.01}>
            <mesh>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshBasicMaterial color="#06b6d4" transparent opacity={0.4} />
            </mesh>
          </group>
        ))}
      </group>
      
      {/* Lights */}
      <ambientLight intensity={0.2} color="#06b6d4" />
      <directionalLight position={[5, 3, 5]} intensity={1.5} color="#0ea5e9" />
      <pointLight position={[-5, -5, -5]} intensity={1} color="#3b82f6" />
    </group>
  );
}

export default function OrionGlobeScene() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <div className="w-full h-full pointer-events-none">
      <Canvas camera={{ position: [4, 0, 8], fov: 45 }} gl={{ antialias: false, powerPreference: "high-performance" }}>
        <fog attach="fog" args={["#05050A", 5, 20]} />
        <GlobeAndNetwork />
      </Canvas>
    </div>
  );
}
