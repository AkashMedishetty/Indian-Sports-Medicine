'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { Canvas, useLoader, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import gsap from 'gsap';

const POINT_COUNT = 90000; // Same as example
const POINT_SIZE = 0.0132; // 10% larger than 0.012
const MODEL_SCALE = 8;

// Cached circle texture
let cachedTexture: THREE.Texture | null = null;
function getCircleTexture(): THREE.Texture {
  if (cachedTexture) return cachedTexture;
  
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  
  cachedTexture = new THREE.CanvasTexture(canvas);
  cachedTexture.needsUpdate = true;
  return cachedTexture;
}

function samplePointsFromMesh(mesh: THREE.Mesh, count: number): Float32Array {
  const geometry = mesh.geometry;
  if (!geometry.attributes.position) return new Float32Array(0);

  const posAttr = geometry.attributes.position;
  const indexAttr = geometry.index;
  
  // Build triangles for surface sampling
  const triangles: { a: THREE.Vector3; b: THREE.Vector3; c: THREE.Vector3; area: number }[] = [];
  let totalArea = 0;
  const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();

  const addTri = (i1: number, i2: number, i3: number) => {
    vA.fromBufferAttribute(posAttr, i1);
    vB.fromBufferAttribute(posAttr, i2);
    vC.fromBufferAttribute(posAttr, i3);
    vA.applyMatrix4(mesh.matrixWorld);
    vB.applyMatrix4(mesh.matrixWorld);
    vC.applyMatrix4(mesh.matrixWorld);
    const area = new THREE.Triangle(vA.clone(), vB.clone(), vC.clone()).getArea();
    if (area > 0) { 
      triangles.push({ a: vA.clone(), b: vB.clone(), c: vC.clone(), area }); 
      totalArea += area; 
    }
  };

  if (indexAttr) { 
    for (let i = 0; i < indexAttr.count; i += 3) 
      addTri(indexAttr.getX(i), indexAttr.getX(i+1), indexAttr.getX(i+2)); 
  } else { 
    for (let i = 0; i < posAttr.count; i += 3) 
      addTri(i, i+1, i+2); 
  }

  if (triangles.length === 0 || totalArea === 0) return new Float32Array(0);

  const points = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    let r = Math.random() * totalArea;
    let tri = triangles[0];
    for (const t of triangles) { r -= t.area; if (r <= 0) { tri = t; break; } }
    let u = Math.random(), v = Math.random();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const w = 1 - u - v;
    const idx = i * 3;
    points[idx] = tri.a.x*w + tri.b.x*u + tri.c.x*v;
    points[idx+1] = tri.a.y*w + tri.b.y*u + tri.c.y*v;
    points[idx+2] = tri.a.z*w + tri.b.z*u + tri.c.z*v;
  }
  return points;
}

function ContextHandler() {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const handleContextLost = (e: Event) => e.preventDefault();
    canvas.addEventListener('webglcontextlost', handleContextLost);
    return () => canvas.removeEventListener('webglcontextlost', handleContextLost);
  }, [gl]);
  return null;
}

interface HandPointsProps {
  url: string;
  morphProgress: number;
  scrollProgress: number;
}

function HandPoints({ url, morphProgress, scrollProgress }: HandPointsProps) {
  const gltf = useLoader(GLTFLoader, url);
  const pointsRef = useRef<THREE.Points>(null);
  const dataRef = useRef<{
    original: Float32Array;
    burst: Float32Array;
    current: Float32Array;
  } | null>(null);
  
  const { geometry, material } = useMemo(() => {
    const meshes: THREE.Mesh[] = [];
    gltf.scene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).geometry) {
        child.updateMatrixWorld(true);
        meshes.push(child as THREE.Mesh);
      }
    });

    const allPoints: number[] = [];
    const ptsPerMesh = Math.max(1000, Math.floor(POINT_COUNT / meshes.length));
    
    meshes.forEach(m => {
      const pts = samplePointsFromMesh(m, ptsPerMesh);
      for (let i = 0; i < pts.length; i++) allPoints.push(pts[i]);
    });

    if (allPoints.length === 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0,0,0]), 3));
      const mat = new THREE.PointsMaterial({ size: 0.1, color: 0x852016 });
      return { geometry: geo, material: mat };
    }

    // Find bounds
    let minX=Infinity, maxX=-Infinity, minY=Infinity, maxY=-Infinity, minZ=Infinity, maxZ=-Infinity;
    for (let i = 0; i < allPoints.length; i += 3) {
      minX = Math.min(minX, allPoints[i]); maxX = Math.max(maxX, allPoints[i]);
      minY = Math.min(minY, allPoints[i+1]); maxY = Math.max(maxY, allPoints[i+1]);
      minZ = Math.min(minZ, allPoints[i+2]); maxZ = Math.max(maxZ, allPoints[i+2]);
    }
    
    const cx = (minX+maxX)/2, cy = (minY+maxY)/2, cz = (minZ+maxZ)/2;
    const maxDim = Math.max(maxX-minX, maxY-minY, maxZ-minZ);
    const scale = maxDim > 0 ? MODEL_SCALE / maxDim : 1;

    const numPoints = allPoints.length / 3;
    const original = new Float32Array(allPoints.length);
    const burst = new Float32Array(allPoints.length);
    const current = new Float32Array(allPoints.length);

    for (let i = 0; i < numPoints; i++) {
      const idx = i * 3;
      original[idx] = (allPoints[idx] - cx) * scale;
      original[idx+1] = (allPoints[idx+1] - cy) * scale;
      original[idx+2] = (allPoints[idx+2] - cz) * scale;
      
      // Burst positions - spherical explosion
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const dist = 15 + Math.random() * 25;
      burst[idx] = original[idx] + Math.sin(phi) * Math.cos(theta) * dist;
      burst[idx+1] = original[idx+1] + Math.sin(phi) * Math.sin(theta) * dist;
      burst[idx+2] = original[idx+2] + Math.cos(phi) * dist;
      
      // Start at original
      current[idx] = original[idx];
      current[idx+1] = original[idx+1];
      current[idx+2] = original[idx+2];
    }

    dataRef.current = { original, burst, current };

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(current, 3));
    
    // Black dots with normal blending for white background
    const mat = new THREE.PointsMaterial({
      size: POINT_SIZE,
      color: 0x000000, // Black dots
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.NormalBlending, // Normal blending for white bg
    });
    
    return { geometry: geo, material: mat };
  }, [gltf.scene]);

  // Smooth interpolation each frame
  useFrame(() => {
    if (!pointsRef.current || !dataRef.current) return;
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const { original, burst } = dataRef.current;
    const t = morphProgress;
    
    for (let i = 0; i < positions.length; i++) {
      positions[i] = original[i] + (burst[i] - original[i]) * t;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  // Gentle floating animation + cinematic rotation on scroll
  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const time = clock.elapsedTime;
    // Float effect
    pointsRef.current.position.y = Math.sin(time * 0.5) * 0.1 - scrollProgress * 2;
    // Cinematic rotation on scroll (like example)
    pointsRef.current.rotation.y = scrollProgress * Math.PI * 1.8;
    pointsRef.current.rotation.z = Math.sin(scrollProgress * Math.PI) * 0.3;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

interface HandPointCloudProps {
  className?: string;
}

export default function HandPointCloud({ className }: HandPointCloudProps) {
  const [mounted, setMounted] = useState(false);
  const [morphProgress, setMorphProgress] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const animRef = useRef({ value: 0 });
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  
  useEffect(() => { 
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Smooth GSAP scroll-based morph like the example
  useEffect(() => {
    if (!mounted) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
      
      // Update scroll progress immediately for rotation
      setScrollProgress(progress);
      
      // Kill previous tween if still running
      if (tweenRef.current) tweenRef.current.kill();
      
      // Smooth GSAP animation like the example (power3.inOut, 2.2s)
      tweenRef.current = gsap.to(animRef.current, {
        value: progress,
        duration: 2.2,
        ease: 'power3.inOut',
        onUpdate: () => setMorphProgress(animRef.current.value)
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (tweenRef.current) tweenRef.current.kill();
    };
  }, [mounted]);

  if (!mounted) {
    return <div className={`w-full h-full bg-black ${className || ''}`} />;
  }

  return (
    <div className={`w-full h-full ${className || ''}`}>
      <Canvas 
        camera={{ position: [0, 2, 28], fov: 28 }} // Same as example
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <ContextHandler />
        <HandPoints url="/Models/TEST.glb" morphProgress={morphProgress} scrollProgress={scrollProgress} />
        <OrbitControls 
          enablePan={false} 
          enableZoom={false}
          enableRotate={true}
          autoRotate={false}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}
