// Pre-bake athlete GLBs to small point-cloud JSON so the live site doesn't
// download the 84 MB of GLBs. Uses the same area-weighted surface sampling +
// normalize as the runtime (lib/ismc/pointCloud.ts), but in Node.
//
// Run:  node scripts/bake-pointclouds.mjs
import { NodeIO } from '@gltf-transform/core';
import * as THREE from 'three';
import fs from 'node:fs';
import path from 'node:path';

const COUNT = 15000;
const TARGET = 1.9;
const MODELS = [
  { glb: 'public/running athlete 3d model.glb', out: '0' },
  { glb: 'public/soccer goalkeeper 3d model.glb', out: '1' },
  { glb: 'public/badminton player 3d model.glb', out: '2' },
];
const OUT_DIR = 'public/ismc/pointclouds';

async function sample(glbPath) {
  const io = new NodeIO();
  const doc = await io.read(glbPath);
  const root = doc.getRoot();

  const ax = [], ay = [], az = [], bx = [], by = [], bz = [], cx = [], cy = [], cz = [];
  const cum = [];
  let total = 0;
  const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();

  const visit = (node, parentWorld) => {
    const local = new THREE.Matrix4().fromArray(node.getMatrix());
    const world = new THREE.Matrix4().multiplyMatrices(parentWorld, local);
    const mesh = node.getMesh();
    if (mesh) {
      for (const prim of mesh.listPrimitives()) {
        const posAcc = prim.getAttribute('POSITION');
        if (!posAcc) continue;
        const pos = posAcc.getArray();
        const idxAcc = prim.getIndices();
        const idx = idxAcc ? idxAcc.getArray() : null;
        const addTri = (i1, i2, i3) => {
          vA.set(pos[i1 * 3], pos[i1 * 3 + 1], pos[i1 * 3 + 2]).applyMatrix4(world);
          vB.set(pos[i2 * 3], pos[i2 * 3 + 1], pos[i2 * 3 + 2]).applyMatrix4(world);
          vC.set(pos[i3 * 3], pos[i3 * 3 + 1], pos[i3 * 3 + 2]).applyMatrix4(world);
          const area = new THREE.Triangle(vA, vB, vC).getArea();
          if (area > 1e-10) {
            ax.push(vA.x); ay.push(vA.y); az.push(vA.z);
            bx.push(vB.x); by.push(vB.y); bz.push(vB.z);
            cx.push(vC.x); cy.push(vC.y); cz.push(vC.z);
            total += area; cum.push(total);
          }
        };
        if (idx) for (let i = 0; i < idx.length; i += 3) addTri(idx[i], idx[i + 1], idx[i + 2]);
        else for (let i = 0; i < pos.length / 3; i += 3) addTri(i, i + 1, i + 2);
      }
    }
    for (const child of node.listChildren()) visit(child, world);
  };

  const I = new THREE.Matrix4();
  for (const scene of root.listScenes()) for (const node of scene.listChildren()) visit(node, I);

  const nTri = cum.length;
  const pts = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
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

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < COUNT; i++) {
    const x = pts[i * 3], y = pts[i * 3 + 1], z = pts[i * 3 + 2];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }
  const ctrX = (minX + maxX) / 2, ctrY = (minY + maxY) / 2, ctrZ = (minZ + maxZ) / 2;
  const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
  const s = TARGET / maxDim;
  const out = new Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    out[i * 3] = Math.round((pts[i * 3] - ctrX) * s * 1000) / 1000;
    out[i * 3 + 1] = Math.round((pts[i * 3 + 1] - ctrY) * s * 1000) / 1000;
    out[i * 3 + 2] = Math.round((pts[i * 3 + 2] - ctrZ) * s * 1000) / 1000;
  }
  return { out, nTri };
}

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const m of MODELS) {
  process.stdout.write(`Sampling ${m.glb} … `);
  const { out, nTri } = await sample(m.glb);
  const file = path.join(OUT_DIR, `${m.out}.json`);
  fs.writeFileSync(file, JSON.stringify(out));
  const kb = (fs.statSync(file).size / 1024).toFixed(0);
  console.log(`${nTri} tris → ${COUNT} pts → ${file} (${kb} KB)`);
}
console.log('Done. Baked at count', COUNT, 'targetSize', TARGET);
