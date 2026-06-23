'use client';

import { forwardRef } from 'react';

export const AnimatedGradients = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div ref={ref} className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div
        className="animated-gradient absolute -top-[20%] -right-[10%] w-[70vw] h-[70vh] rounded-full blur-[100px] opacity-70"
        style={{
          background:
            'radial-gradient(circle, rgba(220, 230, 140, 0.8) 0%, rgba(235, 240, 180, 0.4) 50%, transparent 70%)',
        }}
      />
      <div
        className="animated-gradient absolute -bottom-[20%] -left-[20%] w-[60vw] h-[60vh] rounded-full blur-[120px] opacity-40"
        style={{
          background: 'radial-gradient(circle, rgba(200, 210, 180, 0.5) 0%, transparent 70%)',
        }}
      />
      <div
        className="animated-gradient absolute bottom-0 left-0 w-[50vw] h-[40vh] rounded-full blur-[80px] opacity-50"
        style={{
          background:
            'radial-gradient(circle, rgba(235, 201, 117, 0.4) 0%, rgba(133, 32, 22, 0.1) 50%, transparent 70%)',
        }}
      />
    </div>
  );
});

AnimatedGradients.displayName = 'AnimatedGradients';
