'use client';

import { useState } from 'react';

export interface DebugValues {
  rotX: number;
  rotY: number;
  rotZ: number;
  posX: number;
  posY: number;
  scale: number;
  particleSize: number;
  cameraZ: number;
  disperseStrength: number;
  // Welcome section values
  welcomePosX: number;
  welcomePosY: number;
  welcomeRotX: number;
  welcomeRotY: number;
  welcomeRotZ: number;
  welcomeScale: number;
  // Charminar section values
  charminarPosX: number;
  charminarPosY: number;
  charminarRotX: number;
  charminarRotY: number;
  charminarRotZ: number;
  charminarScale: number;
}

interface DebugControlsProps {
  values: DebugValues;
  onChange: (key: string, value: number) => void;
  scrollProgress?: number;
}

export function DebugControls({ values, onChange, scrollProgress = 0 }: DebugControlsProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'hero' | 'welcome' | 'charminar'>('hero');

  const heroControls = [
    { key: 'rotX', label: 'Rotation X', min: -Math.PI, max: Math.PI, step: 0.01 },
    { key: 'rotY', label: 'Rotation Y', min: -Math.PI, max: Math.PI, step: 0.01 },
    { key: 'rotZ', label: 'Rotation Z', min: -Math.PI, max: Math.PI, step: 0.01 },
    { key: 'posX', label: 'Position X', min: -15, max: 15, step: 0.1 },
    { key: 'posY', label: 'Position Y', min: -10, max: 10, step: 0.1 },
    { key: 'scale', label: 'Scale', min: 0.5, max: 5, step: 0.1 },
    { key: 'particleSize', label: 'Particle Size', min: 0.005, max: 0.1, step: 0.001 },
    { key: 'cameraZ', label: 'Camera Z', min: 5, max: 40, step: 0.5 },
    { key: 'disperseStrength', label: 'Disperse', min: 0, max: 2, step: 0.05 },
  ];

  const welcomeControls = [
    { key: 'welcomePosX', label: 'Position X', min: -15, max: 15, step: 0.1 },
    { key: 'welcomePosY', label: 'Position Y', min: -10, max: 10, step: 0.1 },
    { key: 'welcomeRotX', label: 'Rotation X', min: -Math.PI, max: Math.PI, step: 0.01 },
    { key: 'welcomeRotY', label: 'Rotation Y', min: -Math.PI, max: Math.PI, step: 0.01 },
    { key: 'welcomeRotZ', label: 'Rotation Z', min: -Math.PI, max: Math.PI, step: 0.01 },
    { key: 'welcomeScale', label: 'Scale', min: 0.5, max: 5, step: 0.1 },
  ];

  const charminarControls = [
    { key: 'charminarPosX', label: 'Position X', min: -15, max: 15, step: 0.1 },
    { key: 'charminarPosY', label: 'Position Y', min: -10, max: 10, step: 0.1 },
    { key: 'charminarRotX', label: 'Rotation X', min: -Math.PI, max: Math.PI, step: 0.01 },
    { key: 'charminarRotY', label: 'Rotation Y', min: -Math.PI, max: Math.PI, step: 0.01 },
    { key: 'charminarRotZ', label: 'Rotation Z', min: -Math.PI, max: Math.PI, step: 0.01 },
    { key: 'charminarScale', label: 'Scale', min: 0.5, max: 5, step: 0.1 },
  ];

  const controls = activeTab === 'hero' ? heroControls : activeTab === 'welcome' ? welcomeControls : charminarControls;

  const copyValues = () => {
    let code = '';
    if (activeTab === 'hero') {
      code = `// Hero Config\nrotationX: ${values.rotX.toFixed(3)}, rotationY: ${values.rotY.toFixed(3)}, rotationZ: ${values.rotZ.toFixed(3)},\npositionX: ${values.posX.toFixed(2)}, positionY: ${values.posY.toFixed(2)}, scale: ${values.scale.toFixed(2)},\nparticleSize: ${values.particleSize.toFixed(4)}, cameraZ: ${values.cameraZ.toFixed(1)}`;
    } else if (activeTab === 'welcome') {
      code = `// Welcome Config\nrotationX: ${values.welcomeRotX.toFixed(3)}, rotationY: ${values.welcomeRotY.toFixed(3)}, rotationZ: ${values.welcomeRotZ.toFixed(3)},\npositionX: ${values.welcomePosX.toFixed(2)}, positionY: ${values.welcomePosY.toFixed(2)}, scale: ${values.welcomeScale.toFixed(2)}`;
    } else {
      code = `// Charminar Config\nrotationX: ${values.charminarRotX.toFixed(3)}, rotationY: ${values.charminarRotY.toFixed(3)}, rotationZ: ${values.charminarRotZ.toFixed(3)},\npositionX: ${values.charminarPosX.toFixed(2)}, positionY: ${values.charminarPosY.toFixed(2)}, scale: ${values.charminarScale.toFixed(2)}`;
    }
    navigator.clipboard.writeText(code);
    alert('Values copied!');
  };

  return (
    <div
      className="fixed top-20 right-4 z-[200] bg-black/90 text-white rounded-lg shadow-2xl text-xs font-mono"
      style={{ width: collapsed ? 'auto' : '280px' }}
    >
      <div
        className="flex items-center justify-between p-2 border-b border-white/20 cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="font-bold">🎛️ Controls</span>
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-[10px]">{(scrollProgress * 100).toFixed(0)}%</span>
          <span>{collapsed ? '▼' : '▲'}</span>
        </div>
      </div>
      {!collapsed && (
        <div className="p-2">
          {/* Tabs */}
          <div className="flex gap-1 mb-3">
            <button
              onClick={() => setActiveTab('hero')}
              className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-colors ${
                activeTab === 'hero' ? 'bg-[#852016] text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              HERO
            </button>
            <button
              onClick={() => setActiveTab('welcome')}
              className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-colors ${
                activeTab === 'welcome' ? 'bg-[#25406b] text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              WELCOME
            </button>
            <button
              onClick={() => setActiveTab('charminar')}
              className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-colors ${
                activeTab === 'charminar' ? 'bg-[#ebc975] text-black' : 'bg-gray-700 text-gray-300'
              }`}
            >
              CHARMINAR
            </button>
          </div>

          {/* Controls */}
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {controls.map(({ key, label, min, max, step }) => (
              <div key={key}>
                <div className="flex justify-between text-[10px]">
                  <span>{label}</span>
                  <span className="text-yellow-400">
                    {(values as any)[key].toFixed(key === 'particleSize' ? 4 : 2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={(values as any)[key]}
                  onChange={(e) => onChange(key, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-yellow-400"
                />
              </div>
            ))}
          </div>

          <button
            onClick={copyValues}
            className="w-full mt-3 py-1.5 bg-yellow-500 text-black font-bold rounded text-[10px]"
          >
            📋 Copy Values
          </button>
        </div>
      )}
    </div>
  );
}
