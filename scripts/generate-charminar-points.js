/**
 * Generate Charminar point cloud data (positions only, like the working hand script)
 * 
 * Usage: 
 * 1. Run: node scripts/generate-charminar-points.js
 * 2. Copy the code output to browser console at localhost:3000
 * 3. Download the generated JSON file
 * 4. Place it in public/data/charminar-positions.json
 */

console.log(`
===========================================
CHARMINAR POINT CLOUD GENERATOR
===========================================

To generate pre-computed point cloud data:

1. Open your browser to http://localhost:3000
2. Open browser DevTools (F12) -> Console
3. Paste and run the following code:

------- COPY FROM HERE -------

(async function generateCharminarPointCloud() {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  
  const PARTICLE_COUNT = 80000;
  const MODEL_URL = '/Models/object_0 (1).glb';
  
  function samplePointsFromGLTF(gltf, count) {
    const meshes = [];
    gltf.scene.traverse((child) => {
      if (child.isMesh && child.geometry) {
        child.updateMatrixWorld(true);
        meshes.push(child);
      }
    });

    if (meshes.length === 0) {
      console.error('No meshes found!');
      return new Float32Array(count * 3);
    }
    
    console.log('Found ' + meshes.length + ' meshes');

    const allTriangles = [];
    const cumulativeAreas = [];
    let totalArea = 0;

    meshes.forEach((mesh) => {
      const geometry = mesh.geometry;
      if (!geometry.attributes.position) return;

      const posAttr = geometry.attributes.position;
      const indexAttr = geometry.index;
      const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();

      const processTri = (i1, i2, i3) => {
        vA.fromBufferAttribute(posAttr, i1).applyMatrix4(mesh.matrixWorld);
        vB.fromBufferAttribute(posAttr, i2).applyMatrix4(mesh.matrixWorld);
        vC.fromBufferAttribute(posAttr, i3).applyMatrix4(mesh.matrixWorld);
        const area = new THREE.Triangle(vA, vB, vC).getArea();
        if (area > 0.0001) {
          allTriangles.push({ a: vA.clone(), b: vB.clone(), c: vC.clone() });
          totalArea += area;
          cumulativeAreas.push(totalArea);
        }
      };

      if (indexAttr) {
        for (let i = 0; i < indexAttr.count; i += 3)
          processTri(indexAttr.getX(i), indexAttr.getX(i + 1), indexAttr.getX(i + 2));
      } else {
        for (let i = 0; i < posAttr.count; i += 3)
          processTri(i, i + 1, i + 2);
      }
    });
    
    console.log('Total triangles: ' + allTriangles.length);

    if (allTriangles.length === 0) {
      console.error('No triangles found!');
      return new Float32Array(count * 3);
    }

    const findTriangle = (r) => {
      let lo = 0, hi = cumulativeAreas.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (cumulativeAreas[mid] < r) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    };

    const result = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const triIdx = findTriangle(Math.random() * totalArea);
      const tri = allTriangles[triIdx];
      let u = Math.random(), v = Math.random();
      if (u + v > 1) { u = 1 - u; v = 1 - v; }
      const w = 1 - u - v;
      const idx = i * 3;
      result[idx] = tri.a.x * w + tri.b.x * u + tri.c.x * v;
      result[idx + 1] = tri.a.y * w + tri.b.y * u + tri.c.y * v;
      result[idx + 2] = tri.a.z * w + tri.b.z * u + tri.c.z * v;
    }

    // Normalize
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < count * 3; i += 3) {
      minX = Math.min(minX, result[i]); maxX = Math.max(maxX, result[i]);
      minY = Math.min(minY, result[i + 1]); maxY = Math.max(maxY, result[i + 1]);
      minZ = Math.min(minZ, result[i + 2]); maxZ = Math.max(maxZ, result[i + 2]);
    }

    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
    const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
    const scale = maxDim > 0 ? 8 / maxDim : 1;

    for (let i = 0; i < count * 3; i += 3) {
      result[i] = (result[i] - cx) * scale;
      result[i + 1] = (result[i + 1] - cy) * scale;
      result[i + 2] = (result[i + 2] - cz) * scale;
    }

    return result;
  }

  console.log('Loading Charminar model...');
  const loader = new GLTFLoader();
  
  loader.load(MODEL_URL, (gltf) => {
    console.log('Sampling points...');
    const points = samplePointsFromGLTF(gltf, PARTICLE_COUNT);
    
    // Convert to regular array for JSON
    const pointsArray = Array.from(points);
    
    // Create downloadable JSON
    const data = JSON.stringify(pointsArray);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'charminar-positions.json';
    a.click();
    
    console.log('Done! File downloaded as charminar-positions.json');
    console.log('Move it to public/data/charminar-positions.json');
  }, 
  (progress) => {
    if (progress.total) {
      console.log('Loading: ' + Math.round(progress.loaded / progress.total * 100) + '%');
    }
  },
  (error) => {
    console.error('Error loading model:', error);
  });
})();

------- COPY TO HERE -------

4. The file 'charminar-positions.json' will download
5. Move it to: public/data/charminar-positions.json

===========================================
`);
