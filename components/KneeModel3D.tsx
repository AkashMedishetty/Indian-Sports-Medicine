'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Stage } from '@react-three/drei';

function KneeModel() {
  const { scene } = useGLTF('/knee_anatomy.glb');
  
  return (
    <primitive 
      object={scene} 
      scale={15}
      position={[0, 0, 0]}
    />
  );
}

export default function KneeModel3D() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 60 }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.6} adjustCamera={false}>
            <KneeModel />
          </Stage>
        </Suspense>
        
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={1.5}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload('/knee_anatomy.glb');
