'use client';

import * as THREE from 'three';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTheme } from 'next-themes';
import { loadBakedOrGLB } from '@/lib/ismc/pointCloud';
import { PointCloudTweaker, PC_DEFAULTS, type PCConfig, type PerModel } from './PointCloudTweaker';

// Pre-baked point clouds (tiny JSON) with the GLBs as a live-sampling fallback.
// Order matches the tweaker's mode buttons.
const MODELS = [
  { json: '/ismc/pointclouds/0.json', glb: '/running athlete 3d model.glb' },
  { json: '/ismc/pointclouds/1.json', glb: '/soccer goalkeeper 3d model.glb' },
  { json: '/ismc/pointclouds/2.json', glb: '/badminton player 3d model.glb' },
];
const BAKED_COUNT = 15000;

function makeSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.9)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(32, 32, 32, 0, Math.PI * 2);
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

function MorphPoints({ models, cfg, dark }: { models: Float32Array[]; cfg: PCConfig; dark: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const tRef = useRef(0);
  const { mouse, camera } = useThree();
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const { geom, mat } = useMemo(() => {
    const count = models[0].length / 3;
    const positions = new Float32Array(models[0]);
    const colors = new Float32Array(count * 3);
    const base = new THREE.Color(dark ? '#ffffff' : '#0e2a57');
    const accent = new THREE.Color('#f5a524');
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      if (Math.random() < 0.1) c.copy(accent);
      else c.copy(base).offsetHSL(0, 0, (Math.random() - 0.5) * 0.06);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: cfg.size, map: makeSprite(), vertexColors: true, transparent: true,
      depthWrite: false, sizeAttenuation: true, blending: THREE.NormalBlending, opacity: 0,
    });
    return { geom, mat };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [models, dark]);

  // bake each model's per-model transform (rotation/scale/position) into its points
  const xformed = useMemo(() => {
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const v = new THREE.Vector3();
    return models.map((base, idx) => {
      const m = cfg.models[idx];
      e.set(m.rotX, m.rotY, m.rotZ);
      q.setFromEuler(e);
      const out = new Float32Array(base.length);
      for (let i = 0; i < base.length; i += 3) {
        v.set(base[i], base[i + 1], base[i + 2]).applyQuaternion(q).multiplyScalar(m.scale);
        out[i] = v.x + m.posX; out[i + 1] = v.y + m.posY; out[i + 2] = v.z + m.posZ;
      }
      return out;
    });
  }, [models, cfg.models]);

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);
    tRef.current += d;
    const pos = geom.attributes.position.array as Float32Array;

    let a: number, b: number, blend: number;
    if (cfg.mode !== 'morph') { a = b = cfg.mode; blend = 0; }
    else if (reduced) { a = b = 0; blend = 0; }
    else {
      const cyc = cfg.holdTime + cfg.morphTime;
      const tt = tRef.current % (models.length * cyc);
      const mi = Math.floor(tt / cyc);
      const local = tt - mi * cyc;
      a = mi; b = (mi + 1) % models.length;
      if (local < cfg.holdTime) blend = 0;
      else { const x = (local - cfg.holdTime) / cfg.morphTime; blend = x * x * (3 - 2 * x); }
    }
    const A = xformed[a], B = xformed[b];
    if (blend === 0) pos.set(A);
    else for (let i = 0; i < A.length; i++) pos[i] = A[i] + (B[i] - A[i]) * blend;
    geom.attributes.position.needsUpdate = true;

    mat.size = cfg.size;
    mat.opacity = Math.min(tRef.current / 0.8, 1) * cfg.opacity;

    if (camera.position.z !== cfg.cameraZ) camera.position.z = cfg.cameraZ;

    if (ref.current) {
      ref.current.position.set(cfg.posX, cfg.posY, cfg.posZ);
      ref.current.scale.setScalar(cfg.scale);
      const spin = cfg.autoRotate && !reduced ? tRef.current * cfg.spinSpeed : 0;
      const mx = reduced ? 0 : mouse.x * cfg.parallax;
      ref.current.rotation.set(cfg.rotX, cfg.rotY + spin + mx, cfg.rotZ);
    }
  });

  return <points ref={ref} geometry={geom} material={mat} />;
}

export function HeroSubjectPointCloud() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  const [models, setModels] = useState<Float32Array[] | null>(null);
  const [cfg, setCfg] = useState<PCConfig>(PC_DEFAULTS);
  const [count, setCount] = useState(15000);
  const [tweak, setTweak] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setTweak(new URLSearchParams(window.location.search).has('tweak'));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setModels(null);
    setErr(null);
    (async () => {
      try {
        const arrs: Float32Array[] = [];
        for (const m of MODELS) {
          const pts = await loadBakedOrGLB(m.json, encodeURI(m.glb), count, BAKED_COUNT, 1.9);
          if (cancelled) return;
          arrs.push(pts);
        }
        if (!cancelled) setModels(arrs);
      } catch (e) {
        if (!cancelled) setErr(String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [count]);

  const onGroup = (key: keyof PCConfig, value: number | boolean | PCConfig['mode']) =>
    setCfg((c) => ({ ...c, [key]: value }));
  const onModel = (idx: number, key: keyof PerModel, value: number) =>
    setCfg((c) => ({ ...c, models: c.models.map((m, i) => (i === idx ? { ...m, [key]: value } : m)) }));
  const onDensity = (n: number) => setCount(n);

  // R3F lazy-mount measure nudge
  useEffect(() => {
    const id = requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    return () => cancelAnimationFrame(id);
  }, [models]);

  return (
    <div className="relative h-full w-full">
      {models && (
        <Canvas camera={{ position: [0, 0, cfg.cameraZ], fov: 42 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }} resize={{ debounce: 0 }} style={{ width: '100%', height: '100%' }}>
          <MorphPoints models={models} cfg={cfg} dark={dark} />
        </Canvas>
      )}

      {!models && !err && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[var(--p-text-muted)]">
          <span className="h-2.5 w-2.5 animate-ping rounded-full bg-[var(--p-accent)]" />
          <span className="ismc-mono text-[10px] uppercase tracking-[0.2em]">Loading models…</span>
        </div>
      )}
      {err && (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <span className="ismc-mono text-[10px] uppercase tracking-[0.15em] text-[var(--p-text-faint)]">Couldn&apos;t load models</span>
        </div>
      )}

      {tweak && <PointCloudTweaker cfg={cfg} onGroup={onGroup} onModel={onModel} count={count} onDensity={onDensity} />}
    </div>
  );
}
