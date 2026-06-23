'use client';

import { useState } from 'react';

export interface PerModel {
  rotX: number; rotY: number; rotZ: number;
  scale: number; posX: number; posY: number; posZ: number;
}

export interface PCConfig {
  // group (whole morphing cloud)
  posX: number; posY: number; posZ: number;
  rotX: number; rotY: number; rotZ: number;
  scale: number; size: number;
  cameraZ: number; spinSpeed: number; holdTime: number; morphTime: number;
  parallax: number; opacity: number;
  autoRotate: boolean;
  mode: 'morph' | 0 | 1 | 2;
  // per-model alignment
  models: PerModel[];
}

const MODEL0: PerModel = { rotX: 0, rotY: 0, rotZ: 0, scale: 1, posX: 0, posY: 0, posZ: 0 };

export const PC_DEFAULTS: PCConfig = {
  posX: 0, posY: 0, posZ: 0, rotX: 0, rotY: 0, rotZ: 0, scale: 1.14, size: 0.011,
  cameraZ: 3.2, spinSpeed: 0.43, holdTime: 2.5, morphTime: 1.3, parallax: 0.08, opacity: 1,
  autoRotate: true, mode: 'morph',
  models: [
    { rotX: 0, rotY: -0.522, rotZ: 0, scale: 0.85, posX: -0.02, posY: -0.12, posZ: 0.02 }, // Running
    { ...MODEL0 }, // Goalkeeper
    { ...MODEL0 }, // Badminton
  ],
};

const GROUP_SLIDERS: { key: keyof PCConfig; label: string; min: number; max: number; step: number; fixed?: number }[] = [
  { key: 'posX', label: 'Position X', min: -4, max: 4, step: 0.02 },
  { key: 'posY', label: 'Position Y', min: -4, max: 4, step: 0.02 },
  { key: 'posZ', label: 'Position Z', min: -4, max: 4, step: 0.02 },
  { key: 'rotX', label: 'Rotation X', min: -Math.PI, max: Math.PI, step: 0.01 },
  { key: 'rotY', label: 'Rotation Y', min: -Math.PI, max: Math.PI, step: 0.01 },
  { key: 'rotZ', label: 'Rotation Z', min: -Math.PI, max: Math.PI, step: 0.01 },
  { key: 'scale', label: 'Scale', min: 0.1, max: 4, step: 0.01 },
  { key: 'cameraZ', label: 'Camera / Zoom', min: 2, max: 12, step: 0.1 },
  { key: 'size', label: 'Particle Size', min: 0.004, max: 0.07, step: 0.001, fixed: 3 },
  { key: 'opacity', label: 'Opacity', min: 0.2, max: 1, step: 0.02 },
  { key: 'spinSpeed', label: 'Spin Speed', min: 0, max: 0.8, step: 0.01 },
  { key: 'holdTime', label: 'Morph Hold (s)', min: 0.5, max: 6, step: 0.1 },
  { key: 'morphTime', label: 'Morph Time (s)', min: 0.3, max: 4, step: 0.1 },
  { key: 'parallax', label: 'Mouse Parallax', min: 0, max: 0.5, step: 0.01 },
];

const MODEL_SLIDERS: { key: keyof PerModel; label: string; min: number; max: number; step: number }[] = [
  { key: 'rotX', label: 'Rotation X', min: -Math.PI, max: Math.PI, step: 0.01 },
  { key: 'rotY', label: 'Rotation Y', min: -Math.PI, max: Math.PI, step: 0.01 },
  { key: 'rotZ', label: 'Rotation Z', min: -Math.PI, max: Math.PI, step: 0.01 },
  { key: 'scale', label: 'Scale', min: 0.2, max: 3, step: 0.01 },
  { key: 'posX', label: 'Position X', min: -3, max: 3, step: 0.02 },
  { key: 'posY', label: 'Position Y', min: -3, max: 3, step: 0.02 },
  { key: 'posZ', label: 'Position Z', min: -3, max: 3, step: 0.02 },
];

const MODEL_NAMES = ['Running', 'Goalkeeper', 'Badminton'];
const DENSITIES: [string, number][] = [['Low', 4500], ['Med', 9000], ['High', 15000], ['Max', 22000]];

export function PointCloudTweaker({
  cfg, onGroup, onModel, count, onDensity,
}: {
  cfg: PCConfig;
  onGroup: (key: keyof PCConfig, value: number | boolean | PCConfig['mode']) => void;
  onModel: (index: number, key: keyof PerModel, value: number) => void;
  count: number;
  onDensity: (n: number) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<'group' | 0 | 1 | 2>('group');

  const selectTab = (t: 'group' | 0 | 1 | 2) => {
    setTab(t);
    onGroup('mode', t === 'group' ? 'morph' : t);
  };

  const copy = () => {
    const m = (i: number) => {
      const x = cfg.models[i];
      return `  // ${MODEL_NAMES[i]}\n  { rotX: ${x.rotX.toFixed(3)}, rotY: ${x.rotY.toFixed(3)}, rotZ: ${x.rotZ.toFixed(3)}, scale: ${x.scale.toFixed(2)}, posX: ${x.posX.toFixed(2)}, posY: ${x.posY.toFixed(2)}, posZ: ${x.posZ.toFixed(2)} }`;
    };
    const code = `// GROUP
posX: ${cfg.posX.toFixed(2)}, posY: ${cfg.posY.toFixed(2)}, posZ: ${cfg.posZ.toFixed(2)}, rotX: ${cfg.rotX.toFixed(3)}, rotY: ${cfg.rotY.toFixed(3)}, rotZ: ${cfg.rotZ.toFixed(3)}, scale: ${cfg.scale.toFixed(2)},
cameraZ: ${cfg.cameraZ.toFixed(2)}, size: ${cfg.size.toFixed(3)}, opacity: ${cfg.opacity.toFixed(2)}, spinSpeed: ${cfg.spinSpeed.toFixed(2)}, holdTime: ${cfg.holdTime.toFixed(1)}, morphTime: ${cfg.morphTime.toFixed(1)}, parallax: ${cfg.parallax.toFixed(2)}, count: ${count},
// PER-MODEL
models: [
${m(0)},
${m(1)},
${m(2)},
]`;
    navigator.clipboard?.writeText(code);
  };

  return (
    <div className="fixed right-3 top-24 z-[300] flex max-h-[calc(100dvh-6.5rem)] w-[272px] flex-col rounded-xl bg-black/90 font-mono text-xs text-white shadow-2xl ring-1 ring-white/15 backdrop-blur">
      <div className="flex shrink-0 cursor-pointer items-center justify-between border-b border-white/15 px-3 py-2" onClick={() => setCollapsed(!collapsed)}>
        <span className="font-bold">🎛 Point-cloud tweaker</span>
        <span>{collapsed ? '▼' : '▲'}</span>
      </div>
      {!collapsed && (
        <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain p-3">
          <div className="mb-3 grid grid-cols-4 gap-1">
            {(['group', 0, 1, 2] as const).map((t) => (
              <button key={String(t)} onClick={() => selectTab(t)}
                className={`rounded px-1 py-1.5 text-[9px] font-bold ${tab === t ? 'bg-[#F5A524] text-black' : 'bg-white/10 text-white/70'}`}>
                {t === 'group' ? 'Group' : MODEL_NAMES[t]}
              </button>
            ))}
          </div>

          {tab === 'group' && (
            <>
              <label className="mb-2 flex items-center justify-between">
                <span>Auto-rotate</span>
                <input type="checkbox" checked={cfg.autoRotate} onChange={(e) => onGroup('autoRotate', e.target.checked)} className="accent-[#F5A524]" />
              </label>
              <div className="mb-3">
                <div className="mb-1 text-[10px] text-white/55">Point density (re-samples)</div>
                <div className="grid grid-cols-4 gap-1">
                  {DENSITIES.map(([l, c]) => (
                    <button key={c} onClick={() => onDensity(c)}
                      className={`rounded px-1 py-1 text-[9px] font-bold ${count === c ? 'bg-white/85 text-black' : 'bg-white/10 text-white/70'}`}>{l}</button>
                  ))}
                </div>
              </div>
            </>
          )}
          {tab !== 'group' && (
            <p className="mb-2 text-[10px] text-white/50">Aligning <span className="text-[#F5A524]">{MODEL_NAMES[tab]}</span> (frozen)</p>
          )}

          <div className="space-y-2 pr-1">
            {tab === 'group'
              ? GROUP_SLIDERS.map(({ key, label, min, max, step, fixed }) => (
                  <Slider key={key} label={label} min={min} max={max} step={step}
                    value={cfg[key] as number} fixed={fixed ?? 2} onChange={(v) => onGroup(key, v)} />
                ))
              : MODEL_SLIDERS.map(({ key, label, min, max, step }) => (
                  <Slider key={key} label={label} min={min} max={max} step={step}
                    value={cfg.models[tab][key]} fixed={2} onChange={(v) => onModel(tab, key, v)} />
                ))}
          </div>

          <button onClick={copy} className="mt-3 w-full rounded bg-[#F5A524] py-1.5 text-[10px] font-bold text-black">
            📋 Copy all values
          </button>
        </div>
      )}
    </div>
  );
}

function Slider({ label, min, max, step, value, fixed, onChange }: { label: string; min: number; max: number; step: number; value: number; fixed: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between text-[10px]">
        <span>{label}</span>
        <span className="text-[#F5A524]">{value.toFixed(fixed)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="h-1.5 w-full cursor-pointer appearance-none rounded bg-white/15 accent-[#F5A524]" />
    </div>
  );
}
