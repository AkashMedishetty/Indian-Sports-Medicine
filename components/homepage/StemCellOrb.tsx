'use client';

import { Suspense, useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Red stem cell nucleus - dark blood red
function RedNucleus() {
  const groupRef = useRef<THREE.Group>(null);

  const spheres = useMemo(() => {
    return [
      { position: [0, 0, 0] as [number, number, number], radius: 0.32 },
      { position: [0.25, 0.08, 0.06] as [number, number, number], radius: 0.25 },
      { position: [-0.23, 0.1, 0.08] as [number, number, number], radius: 0.23 },
      { position: [0.08, -0.23, 0.06] as [number, number, number], radius: 0.22 },
      { position: [-0.08, 0.21, -0.08] as [number, number, number], radius: 0.21 },
      { position: [0.17, 0.17, 0.17] as [number, number, number], radius: 0.19 },
      { position: [-0.15, -0.14, 0.14] as [number, number, number], radius: 0.2 },
      { position: [0.06, 0.06, -0.23] as [number, number, number], radius: 0.18 },
    ];
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {spheres.map((sphere, index) => (
        <mesh key={index} position={sphere.position}>
          <sphereGeometry args={[sphere.radius, 32, 32]} />
          <meshStandardMaterial
            color="#5a0a0a"
            roughness={0.75}
            metalness={0.0}
            envMapIntensity={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

// Outer glass membrane with soap bubble iridescence
function GlassMembrane() {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(1.5, 128, 128);
    const positions = geo.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      const noise =
        Math.sin(vertex.x * 3 + vertex.y * 2) *
        Math.cos(vertex.y * 2.5 + vertex.z * 3) *
        Math.sin(vertex.z * 2 + vertex.x * 2.5);
      const deform = 1 + noise * 0.05;
      vertex.multiplyScalar(deform);
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.06;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.03;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <MeshTransmissionMaterial
        backside
        samples={8}
        thickness={0.1}
        chromaticAberration={0.03}
        transmission={1}
        roughness={0.0}
        ior={1.4}
        color="#ffffff"
        envMapIntensity={0.5}
        clearcoat={1}
        clearcoatRoughness={0.0}
        transparent
        opacity={0.2}
        iridescence={0.8}
        iridescenceIOR={1.2}
        iridescenceThicknessRange={[100, 300]}
        attenuationColor="#ffffff"
        attenuationDistance={5}
      />
    </mesh>
  );
}

// Outer soap bubble rim layer
function SoapBubbleRim() {
  const meshRef = useRef<THREE.Mesh>(null);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        
        void main() {
          vec3 viewDir = normalize(vViewPosition);
          vec3 normal = normalize(vNormal);
          
          float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 3.0);
          
          // Soap bubble iridescence
          float angle = dot(viewDir, normal);
          vec3 iridescence = vec3(
            0.5 + 0.5 * sin(angle * 15.0 + uTime * 0.3),
            0.5 + 0.5 * sin(angle * 15.0 + 2.094 + uTime * 0.3),
            0.5 + 0.5 * sin(angle * 15.0 + 4.188 + uTime * 0.3)
          );
          
          // Warm golden tint mixed with iridescence
          vec3 warmTint = vec3(0.95, 0.85, 0.7);
          vec3 color = mix(warmTint, iridescence, 0.4);
          
          // Only visible at edges
          float alpha = fresnel * 0.4;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(1.52, 96, 96);
    const positions = geo.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      const noise =
        Math.sin(vertex.x * 3 + vertex.y * 2) *
        Math.cos(vertex.y * 2.5 + vertex.z * 3) *
        Math.sin(vertex.z * 2 + vertex.x * 2.5);
      const deform = 1 + noise * 0.05;
      vertex.multiplyScalar(deform);
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame((state) => {
    shaderMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.06;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.03;
    }
  });

  return <mesh ref={meshRef} geometry={geometry} material={shaderMaterial} />;
}

function StemCellModel() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <RedNucleus />
      <GlassMembrane />
      <SoapBubbleRim />
    </group>
  );
}

export function StemCellOrb() {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return <div style={{ width: '100%', height: '100%' }} />;
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        dpr={[1, 2]}
        frameloop="always"
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x000000, 0);
          scene.background = null;
        }}
      >
        <Environment preset="studio" />
        
        <directionalLight position={[5, 3, 5]} intensity={1.5} color="#fff5e0" />
        <directionalLight position={[-4, 2, 3]} intensity={0.8} color="#e0f0ff" />
        <directionalLight position={[0, 5, -3]} intensity={0.6} color="#ffeedd" />
        <ambientLight intensity={0.4} />

        <Suspense fallback={null}>
          <StemCellModel />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default StemCellOrb;
