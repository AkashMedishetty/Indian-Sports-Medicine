import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface ColoredPointData {
  positions: Float32Array;
  colors: Float32Array;
}

export async function loadPointData(
  url: string,
  fallbackUrl: string,
  isMobile: boolean,
  targetCount: number
): Promise<Float32Array> {
  const count = isMobile ? Math.floor(targetCount * 0.4) : targetCount;
  
  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.length > count * 3) {
        const ratio = Math.ceil(data.length / (count * 3));
        const reduced: number[] = [];
        for (let i = 0; i < data.length; i += 3 * ratio) {
          reduced.push(data[i], data[i + 1], data[i + 2]);
        }
        return new Float32Array(reduced);
      }
      return new Float32Array(data);
    }
  } catch {
    console.log(`Loading from GLB: ${fallbackUrl}`);
  }

  return new Promise((resolve) => {
    const loader = new GLTFLoader();
    loader.load(fallbackUrl, (gltf) => resolve(samplePointsFromGLTF(gltf, count)));
  });
}

// Load precomputed colored point data from JSON files
export async function loadPrecomputedColoredPoints(
  positionsUrl: string,
  colorsUrl: string,
  fallbackModelUrl: string,
  isMobile: boolean,
  targetCount: number
): Promise<ColoredPointData> {
  const count = isMobile ? Math.floor(targetCount * 0.4) : targetCount;
  
  try {
    const [posResponse, colorResponse] = await Promise.all([
      fetch(positionsUrl),
      fetch(colorsUrl),
    ]);
    
    if (posResponse.ok && colorResponse.ok) {
      const [posData, colorData] = await Promise.all([
        posResponse.json(),
        colorResponse.json(),
      ]);
      
      // Reduce if needed
      if (posData.length > count * 3) {
        const ratio = Math.ceil(posData.length / (count * 3));
        const reducedPos: number[] = [];
        const reducedColors: number[] = [];
        for (let i = 0; i < posData.length; i += 3 * ratio) {
          reducedPos.push(posData[i], posData[i + 1], posData[i + 2]);
          reducedColors.push(colorData[i], colorData[i + 1], colorData[i + 2]);
        }
        return {
          positions: new Float32Array(reducedPos),
          colors: new Float32Array(reducedColors),
        };
      }
      
      return {
        positions: new Float32Array(posData),
        colors: new Float32Array(colorData),
      };
    }
  } catch (e) {
    console.log('Precomputed data not found, loading from GLB:', fallbackModelUrl);
  }
  
  // Fallback to loading from GLB
  return loadColoredPointData(fallbackModelUrl, isMobile, targetCount);
}

// Load colored points from GLB with baked textures (fallback)
export async function loadColoredPointData(
  modelUrl: string,
  isMobile: boolean,
  targetCount: number
): Promise<ColoredPointData> {
  const count = isMobile ? Math.floor(targetCount * 0.4) : targetCount;
  
  return new Promise((resolve) => {
    const loader = new GLTFLoader();
    loader.load(modelUrl, (gltf) => {
      resolve(sampleColoredPointsFromGLTF(gltf, count));
    }, undefined, (error) => {
      console.error('Error loading GLB:', error);
      // Return empty data on error
      resolve({
        positions: new Float32Array(count * 3),
        colors: new Float32Array(count * 3).fill(0.5),
      });
    });
  });
}

export function sampleColoredPointsFromGLTF(gltf: any, count: number): ColoredPointData {
  const meshes: THREE.Mesh[] = [];
  gltf.scene.traverse((child: THREE.Object3D) => {
    if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).geometry) {
      child.updateMatrixWorld(true);
      meshes.push(child as THREE.Mesh);
    }
  });
  
  if (meshes.length === 0) {
    return {
      positions: new Float32Array(count * 3),
      colors: new Float32Array(count * 3).fill(0.5),
    };
  }

  const allPoints: number[] = [];
  const allColors: number[] = [];
  const ptsPerMesh = Math.max(500, Math.floor(count / meshes.length));

  meshes.forEach((mesh) => {
    const geometry = mesh.geometry;
    if (!geometry.attributes.position) return;
    
    const posAttr = geometry.attributes.position;
    const uvAttr = geometry.attributes.uv;
    const colorAttr = geometry.attributes.color;
    const indexAttr = geometry.index;
    
    // Get material color/texture
    const material = mesh.material as THREE.MeshStandardMaterial;
    let baseColor = new THREE.Color(0.6, 0.5, 0.4); // Default brownish color for Charminar
    let texture: THREE.Texture | null = null;
    let textureData: Uint8Array | Uint8ClampedArray | null = null;
    let texWidth = 0, texHeight = 0;
    
    if (material) {
      if (material.color) {
        baseColor = material.color;
      }
      if (material.map) {
        texture = material.map;
        // Try to get texture data
        if (texture.image) {
          try {
            const canvas = document.createElement('canvas');
            const img = texture.image;
            canvas.width = img.width || 256;
            canvas.height = img.height || 256;
            texWidth = canvas.width;
            texHeight = canvas.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              textureData = ctx.getImageData(0, 0, texWidth, texHeight).data;
            }
          } catch (e) {
            // Texture sampling failed, use base color
          }
        }
      }
    }

    interface TriData {
      a: THREE.Vector3;
      b: THREE.Vector3;
      c: THREE.Vector3;
      uvA?: THREE.Vector2;
      uvB?: THREE.Vector2;
      uvC?: THREE.Vector2;
      colorA?: THREE.Color;
      colorB?: THREE.Color;
      colorC?: THREE.Color;
      area: number;
    }
    
    const triangles: TriData[] = [];
    let totalArea = 0;

    const addTri = (i1: number, i2: number, i3: number) => {
      const vA = new THREE.Vector3().fromBufferAttribute(posAttr, i1).applyMatrix4(mesh.matrixWorld);
      const vB = new THREE.Vector3().fromBufferAttribute(posAttr, i2).applyMatrix4(mesh.matrixWorld);
      const vC = new THREE.Vector3().fromBufferAttribute(posAttr, i3).applyMatrix4(mesh.matrixWorld);
      const area = new THREE.Triangle(vA, vB, vC).getArea();
      
      if (area > 0) {
        const tri: TriData = { a: vA, b: vB, c: vC, area };
        
        // Get UVs if available
        if (uvAttr) {
          tri.uvA = new THREE.Vector2().fromBufferAttribute(uvAttr as THREE.BufferAttribute, i1);
          tri.uvB = new THREE.Vector2().fromBufferAttribute(uvAttr as THREE.BufferAttribute, i2);
          tri.uvC = new THREE.Vector2().fromBufferAttribute(uvAttr as THREE.BufferAttribute, i3);
        }
        
        // Get vertex colors if available
        if (colorAttr) {
          tri.colorA = new THREE.Color().fromBufferAttribute(colorAttr as THREE.BufferAttribute, i1);
          tri.colorB = new THREE.Color().fromBufferAttribute(colorAttr as THREE.BufferAttribute, i2);
          tri.colorC = new THREE.Color().fromBufferAttribute(colorAttr as THREE.BufferAttribute, i3);
        }
        
        triangles.push(tri);
        totalArea += area;
      }
    };

    if (indexAttr) {
      for (let i = 0; i < indexAttr.count; i += 3) {
        addTri(indexAttr.getX(i), indexAttr.getX(i + 1), indexAttr.getX(i + 2));
      }
    } else {
      for (let i = 0; i < posAttr.count; i += 3) {
        addTri(i, i + 1, i + 2);
      }
    }
    
    if (triangles.length === 0) return;

    for (let i = 0; i < ptsPerMesh; i++) {
      let r = Math.random() * totalArea;
      let tri = triangles[0];
      for (const t of triangles) {
        r -= t.area;
        if (r <= 0) {
          tri = t;
          break;
        }
      }
      
      let u = Math.random(), v = Math.random();
      if (u + v > 1) {
        u = 1 - u;
        v = 1 - v;
      }
      const w = 1 - u - v;
      
      // Position
      allPoints.push(
        tri.a.x * w + tri.b.x * u + tri.c.x * v,
        tri.a.y * w + tri.b.y * u + tri.c.y * v,
        tri.a.z * w + tri.b.z * u + tri.c.z * v
      );
      
      // Color - try texture first, then vertex colors, then base color
      let finalColor = baseColor.clone();
      
      if (textureData && tri.uvA && tri.uvB && tri.uvC) {
        // Interpolate UV
        const uvX = tri.uvA.x * w + tri.uvB.x * u + tri.uvC.x * v;
        const uvY = tri.uvA.y * w + tri.uvB.y * u + tri.uvC.y * v;
        
        // Sample texture
        const px = Math.floor((uvX % 1) * texWidth);
        const py = Math.floor((1 - (uvY % 1)) * texHeight); // Flip Y
        const idx = (py * texWidth + px) * 4;
        
        if (idx >= 0 && idx < textureData.length - 2) {
          finalColor.setRGB(
            textureData[idx] / 255,
            textureData[idx + 1] / 255,
            textureData[idx + 2] / 255
          );
        }
      } else if (tri.colorA && tri.colorB && tri.colorC) {
        // Interpolate vertex colors
        finalColor.setRGB(
          tri.colorA.r * w + tri.colorB.r * u + tri.colorC.r * v,
          tri.colorA.g * w + tri.colorB.g * u + tri.colorC.g * v,
          tri.colorA.b * w + tri.colorB.b * u + tri.colorC.b * v
        );
      }
      
      allColors.push(finalColor.r, finalColor.g, finalColor.b);
    }
  });

  // Normalize points
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  
  for (let i = 0; i < allPoints.length; i += 3) {
    minX = Math.min(minX, allPoints[i]);
    maxX = Math.max(maxX, allPoints[i]);
    minY = Math.min(minY, allPoints[i + 1]);
    maxY = Math.max(maxY, allPoints[i + 1]);
    minZ = Math.min(minZ, allPoints[i + 2]);
    maxZ = Math.max(maxZ, allPoints[i + 2]);
  }
  
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;
  const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
  const scale = maxDim > 0 ? 10 / maxDim : 1;

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const numPoints = allPoints.length / 3;
  
  for (let i = 0; i < count; i++) {
    const srcIdx = (i % numPoints) * 3;
    positions[i * 3] = (allPoints[srcIdx] - cx) * scale;
    positions[i * 3 + 1] = (allPoints[srcIdx + 1] - cy) * scale;
    positions[i * 3 + 2] = (allPoints[srcIdx + 2] - cz) * scale;
    
    colors[i * 3] = allColors[srcIdx] || 0.6;
    colors[i * 3 + 1] = allColors[srcIdx + 1] || 0.5;
    colors[i * 3 + 2] = allColors[srcIdx + 2] || 0.4;
  }
  
  return { positions, colors };
}

export function samplePointsFromGLTF(gltf: any, count: number): Float32Array {
  const meshes: THREE.Mesh[] = [];
  gltf.scene.traverse((child: THREE.Object3D) => {
    if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).geometry) {
      child.updateMatrixWorld(true);
      meshes.push(child as THREE.Mesh);
    }
  });
  
  if (meshes.length === 0) return new Float32Array(count * 3);

  const allPoints: number[] = [];
  const ptsPerMesh = Math.max(500, Math.floor(count / meshes.length));

  meshes.forEach((mesh) => {
    const geometry = mesh.geometry;
    if (!geometry.attributes.position) return;
    
    const posAttr = geometry.attributes.position;
    const indexAttr = geometry.index;
    const triangles: { a: THREE.Vector3; b: THREE.Vector3; c: THREE.Vector3; area: number }[] = [];
    let totalArea = 0;

    const addTri = (i1: number, i2: number, i3: number) => {
      const vA = new THREE.Vector3().fromBufferAttribute(posAttr, i1).applyMatrix4(mesh.matrixWorld);
      const vB = new THREE.Vector3().fromBufferAttribute(posAttr, i2).applyMatrix4(mesh.matrixWorld);
      const vC = new THREE.Vector3().fromBufferAttribute(posAttr, i3).applyMatrix4(mesh.matrixWorld);
      const area = new THREE.Triangle(vA, vB, vC).getArea();
      if (area > 0) {
        triangles.push({ a: vA, b: vB, c: vC, area });
        totalArea += area;
      }
    };

    if (indexAttr) {
      for (let i = 0; i < indexAttr.count; i += 3) {
        addTri(indexAttr.getX(i), indexAttr.getX(i + 1), indexAttr.getX(i + 2));
      }
    } else {
      for (let i = 0; i < posAttr.count; i += 3) {
        addTri(i, i + 1, i + 2);
      }
    }
    
    if (triangles.length === 0) return;

    for (let i = 0; i < ptsPerMesh; i++) {
      let r = Math.random() * totalArea;
      let tri = triangles[0];
      for (const t of triangles) {
        r -= t.area;
        if (r <= 0) {
          tri = t;
          break;
        }
      }
      let u = Math.random(), v = Math.random();
      if (u + v > 1) {
        u = 1 - u;
        v = 1 - v;
      }
      const w = 1 - u - v;
      allPoints.push(
        tri.a.x * w + tri.b.x * u + tri.c.x * v,
        tri.a.y * w + tri.b.y * u + tri.c.y * v,
        tri.a.z * w + tri.b.z * u + tri.c.z * v
      );
    }
  });

  // Normalize points
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  
  for (let i = 0; i < allPoints.length; i += 3) {
    minX = Math.min(minX, allPoints[i]);
    maxX = Math.max(maxX, allPoints[i]);
    minY = Math.min(minY, allPoints[i + 1]);
    maxY = Math.max(maxY, allPoints[i + 1]);
    minZ = Math.min(minZ, allPoints[i + 2]);
    maxZ = Math.max(maxZ, allPoints[i + 2]);
  }
  
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;
  const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
  const scale = maxDim > 0 ? 10 / maxDim : 1;

  const result = new Float32Array(count * 3);
  const numPoints = allPoints.length / 3;
  
  for (let i = 0; i < count; i++) {
    const srcIdx = (i % numPoints) * 3;
    result[i * 3] = (allPoints[srcIdx] - cx) * scale;
    result[i * 3 + 1] = (allPoints[srcIdx + 1] - cy) * scale;
    result[i * 3 + 2] = (allPoints[srcIdx + 2] - cz) * scale;
  }
  
  return result;
}

export function normalizePointArrays(
  arr1: Float32Array,
  arr2: Float32Array
): [Float32Array, Float32Array] {
  const maxLen = Math.max(arr1.length, arr2.length);
  const norm1 = new Float32Array(maxLen);
  const norm2 = new Float32Array(maxLen);

  for (let i = 0; i < maxLen; i++) {
    norm1[i] = arr1[i % arr1.length];
    norm2[i] = arr2[i % arr2.length];
  }
  
  return [norm1, norm2];
}
