import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Area-weighted surface point sampling from a GLB (positions only), adapted from
 * the ISSH extractor but with a cumulative-area CDF + binary search so it stays
 * fast on large meshes. Points are centred and uniformly scaled to `targetSize`
 * so multiple models share one normalised space (clean morphing point↔point).
 */
export function sampleGLBPositions(gltf: { scene: THREE.Object3D }, count: number, targetSize = 2.2): Float32Array {
  const meshes: THREE.Mesh[] = [];
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((c) => {
    const m = c as THREE.Mesh;
    if (m.isMesh && m.geometry && m.geometry.attributes.position) meshes.push(m);
  });
  if (!meshes.length) return new Float32Array(count * 3);

  // flat triangle arrays + cumulative area
  const ax: number[] = [], ay: number[] = [], az: number[] = [];
  const bx: number[] = [], by: number[] = [], bz: number[] = [];
  const cx: number[] = [], cy: number[] = [], cz: number[] = [];
  const cum: number[] = [];
  let total = 0;
  const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();

  for (const mesh of meshes) {
    const pos = mesh.geometry.attributes.position as THREE.BufferAttribute;
    const idx = mesh.geometry.index;
    const mw = mesh.matrixWorld;
    const add = (i1: number, i2: number, i3: number) => {
      vA.fromBufferAttribute(pos, i1).applyMatrix4(mw);
      vB.fromBufferAttribute(pos, i2).applyMatrix4(mw);
      vC.fromBufferAttribute(pos, i3).applyMatrix4(mw);
      const area = new THREE.Triangle(vA, vB, vC).getArea();
      if (area > 1e-10) {
        ax.push(vA.x); ay.push(vA.y); az.push(vA.z);
        bx.push(vB.x); by.push(vB.y); bz.push(vB.z);
        cx.push(vC.x); cy.push(vC.y); cz.push(vC.z);
        total += area; cum.push(total);
      }
    };
    if (idx) for (let i = 0; i < idx.count; i += 3) add(idx.getX(i), idx.getX(i + 1), idx.getX(i + 2));
    else for (let i = 0; i < pos.count; i += 3) add(i, i + 1, i + 2);
  }

  const nTri = cum.length;
  const pts = new Float32Array(count * 3);
  if (!nTri) return pts;

  for (let i = 0; i < count; i++) {
    const r = Math.random() * total;
    let lo = 0, hi = nTri - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < r) lo = mid + 1; else hi = mid; }
    let u = Math.random(), v = Math.random();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const w = 1 - u - v;
    pts[i * 3] = ax[lo] * w + bx[lo] * u + cx[lo] * v;
    pts[i * 3 + 1] = ay[lo] * w + by[lo] * u + cy[lo] * v;
    pts[i * 3 + 2] = az[lo] * w + bz[lo] * u + cz[lo] * v;
  }

  // normalise: centre + uniform scale to targetSize
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < count; i++) {
    const x = pts[i * 3], y = pts[i * 3 + 1], z = pts[i * 3 + 2];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }
  const ctrX = (minX + maxX) / 2, ctrY = (minY + maxY) / 2, ctrZ = (minZ + maxZ) / 2;
  const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
  const s = targetSize / maxDim;
  for (let i = 0; i < count; i++) {
    pts[i * 3] = (pts[i * 3] - ctrX) * s;
    pts[i * 3 + 1] = (pts[i * 3 + 1] - ctrY) * s;
    pts[i * 3 + 2] = (pts[i * 3 + 2] - ctrZ) * s;
  }
  return pts;
}

export function loadGLBPoints(url: string, count: number, targetSize = 2.2): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    new GLTFLoader().load(
      url,
      (gltf) => resolve(sampleGLBPositions(gltf as unknown as { scene: THREE.Object3D }, count, targetSize)),
      undefined,
      reject
    );
  });
}

/**
 * Production loader: fetch the pre-baked point-cloud JSON (tiny, instant) when the
 * requested count matches the baked count; otherwise fall back to sampling the GLB
 * live (used by the dev tweaker when changing density).
 */
export async function loadBakedOrGLB(
  jsonUrl: string,
  glbUrl: string,
  count: number,
  bakedCount: number,
  targetSize = 1.9
): Promise<Float32Array> {
  if (count === bakedCount) {
    try {
      const res = await fetch(jsonUrl);
      if (res.ok) {
        const arr = (await res.json()) as number[];
        if (Array.isArray(arr) && arr.length >= count * 3) return new Float32Array(arr);
      }
    } catch {
      /* fall through to GLB */
    }
  }
  return loadGLBPoints(glbUrl, count, targetSize);
}
