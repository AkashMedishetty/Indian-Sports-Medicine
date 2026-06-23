'use client';

import { useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const PARTICLE_COUNT = 70000;
const MODEL_SCALE = 8;

const MODELS: { [key: string]: { path: string; output: string } } = {
  'hero': { path: '/Models/Spline 2 hands.glb', output: 'hero-hands.json' },
  'test': { path: '/Models/TEST.glb', output: 'hand-points.json' },
  'welcome': { path: '/Models/welcome message model.glb', output: 'welcome-gesture.json' },
  'charminar': { path: '/Models/object_0 (1).glb', output: 'charminar-positions.json' },
};

function samplePointsFromMesh(mesh: THREE.Mesh, count: number): Float32Array {
  const geometry = mesh.geometry;
  if (!geometry.attributes.position) return new Float32Array(0);

  const posAttr = geometry.attributes.position;
  const indexAttr = geometry.index;
  
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

export default function GeneratePointsPage() {
  const [status, setStatus] = useState('Select a model and click generate');
  const [generating, setGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState('hero');

  const generatePoints = async () => {
    setGenerating(true);
    const model = MODELS[selectedModel];
    setStatus(`Loading ${model.path}...`);

    const loader = new GLTFLoader();
    
    loader.load(model.path, (gltf) => {
      try {
        setStatus('Finding meshes...');
        
        const meshes: THREE.Mesh[] = [];
        gltf.scene.traverse((child: THREE.Object3D) => {
          if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).geometry) {
            child.updateMatrixWorld(true);
            meshes.push(child as THREE.Mesh);
          }
        });

        if (meshes.length === 0) {
          setStatus('Error: No meshes found in model');
          setGenerating(false);
          return;
        }

        setStatus(`Found ${meshes.length} meshes, sampling points...`);

        const allPoints: number[] = [];
        const ptsPerMesh = Math.max(1000, Math.floor(PARTICLE_COUNT / meshes.length));
        
        meshes.forEach((m, idx) => {
          setStatus(`Sampling mesh ${idx + 1}/${meshes.length}...`);
          const pts = samplePointsFromMesh(m, ptsPerMesh);
          for (let i = 0; i < pts.length; i++) allPoints.push(pts[i]);
        });

        if (allPoints.length === 0) {
          setStatus('Error: No points sampled from meshes');
          setGenerating(false);
          return;
        }

        setStatus(`Sampled ${allPoints.length / 3} points, normalizing...`);

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        
        for (let i = 0; i < allPoints.length; i += 3) {
          minX = Math.min(minX, allPoints[i]); maxX = Math.max(maxX, allPoints[i]);
          minY = Math.min(minY, allPoints[i+1]); maxY = Math.max(maxY, allPoints[i+1]);
          minZ = Math.min(minZ, allPoints[i+2]); maxZ = Math.max(maxZ, allPoints[i+2]);
        }
        
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const cz = (minZ + maxZ) / 2;
        const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
        const scale = maxDim > 0 ? MODEL_SCALE / maxDim : 1;

        const numPoints = allPoints.length / 3;
        const normalized = new Float32Array(allPoints.length);
        
        for (let i = 0; i < numPoints; i++) {
          const idx = i * 3;
          normalized[idx] = (allPoints[idx] - cx) * scale;
          normalized[idx + 1] = (allPoints[idx + 1] - cy) * scale;
          normalized[idx + 2] = (allPoints[idx + 2] - cz) * scale;
        }

        setStatus('Creating download...');

        const pointsArray = Array.from(normalized);
        const data = JSON.stringify(pointsArray);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = model.output;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        const sizeMB = (data.length / 1024 / 1024).toFixed(2);
        setStatus(`✓ Done! Downloaded ${model.output} (${sizeMB} MB, ${numPoints} points). Move it to public/data/`);
        setGenerating(false);
        
      } catch (error) {
        setStatus(`Error: ${error}`);
        setGenerating(false);
      }
    }, 
    (progress) => {
      if (progress.total) {
        setStatus(`Loading model... ${Math.round(progress.loaded / progress.total * 100)}%`);
      }
    },
    (error) => {
      setStatus(`Error loading model: ${error}`);
      setGenerating(false);
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center max-w-lg p-8">
        <h1 className="text-3xl font-bold mb-4">Point Cloud Generator</h1>
        <p className="text-gray-400 mb-8">
          Generate pre-computed point cloud data from 3D models.
        </p>
        
        {/* Model Selection */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Select Model:</label>
          <div className="flex gap-4 justify-center">
            {Object.entries(MODELS).map(([key, model]) => (
              <button
                key={key}
                onClick={() => setSelectedModel(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedModel === key 
                    ? 'bg-[#852016] text-white' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {key.toUpperCase()}
                <span className="block text-xs opacity-60">{model.output}</span>
              </button>
            ))}
          </div>
        </div>
        
        <button
          onClick={generatePoints}
          disabled={generating}
          className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
            generating 
              ? 'bg-gray-700 cursor-not-allowed' 
              : 'bg-[#852016] hover:bg-[#6a1912] cursor-pointer'
          }`}
        >
          {generating ? 'Generating...' : `Generate ${MODELS[selectedModel].output}`}
        </button>
        
        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-300">{status}</p>
        </div>
        
        <div className="mt-8 text-left text-sm text-gray-500">
          <p className="font-bold text-gray-400 mb-2">After download:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Move the JSON file to <code className="bg-gray-800 px-1 rounded">public/data/</code></li>
            <li>Update the component to use the new file</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
