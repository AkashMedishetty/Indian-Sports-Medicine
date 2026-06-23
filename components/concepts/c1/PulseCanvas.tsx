'use client';

import { useEffect, useRef } from 'react';

interface PulseCanvasProps {
  className?: string;
  color?: string;
  glow?: string;
  grid?: boolean;
  speed?: number; // px per second
  amplitude?: number; // 0..1 share of height used
  baseline?: number; // 0..1 vertical baseline
  lineWidth?: number;
  reveal?: boolean; // ease intensity in on mount
}

/**
 * Self-contained vitals waveform. Scrolls a stream that alternates between an
 * ECG heartbeat complex and a running-gait curve — "the precise science behind
 * peak human motion". DPR-aware, transform-free (canvas), reduced-motion safe.
 */
export function PulseCanvas({
  className,
  color = '#F5A524',
  glow = 'rgba(245,165,36,0.55)',
  grid = true,
  speed = 90,
  amplitude = 1,
  baseline = 0.5,
  lineWidth = 2.5,
  reveal = true,
}: PulseCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    const P = 280; // period in px

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const gauss = (t: number, c: number, width: number, amp: number) =>
      amp * Math.exp(-((t - c) ** 2) / (2 * width * width));

    // Returns vertical offset (positive = up) for a global x coordinate.
    const wave = (g: number) => {
      const idx = Math.floor(g / P);
      const t = g - idx * P;
      if (((idx % 2) + 2) % 2 === 0) {
        // ECG heartbeat complex
        return (
          gauss(t, 52, 9, 0.12) + // P wave
          gauss(t, 92, 4.5, -0.16) + // Q
          gauss(t, 100, 3.6, 1.0) + // R spike
          gauss(t, 108, 5, -0.28) + // S
          gauss(t, 170, 20, 0.22) // T wave
        );
      }
      // Running-gait double force curve
      return gauss(t, 95, 30, 0.5) + gauss(t, 185, 30, 0.46);
    };

    const start = performance.now();
    const draw = (now: number) => {
      const elapsed = now - start;
      const intensity = reveal ? Math.min(1, elapsed / 1500) : 1;
      const ease = intensity * intensity * (3 - 2 * intensity); // smoothstep
      const phase = reduced ? 40 : (elapsed / 1000) * speed;
      const amp = h * 0.34 * amplitude * (reduced ? 1 : ease);
      const yBase = h * baseline;

      ctx.clearRect(0, 0, w, h);

      // faint instrument grid
      if (grid) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(143,176,224,0.07)';
        ctx.beginPath();
        const gx = 28;
        const offset = (phase % gx) * -1;
        for (let x = offset; x <= w; x += gx) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
        }
        for (let y = (yBase % gx) - gx; y <= h; y += gx) {
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
        }
        ctx.stroke();
      }

      // baseline ghost
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(143,176,224,0.18)';
      ctx.beginPath();
      ctx.moveTo(0, yBase);
      ctx.lineTo(w, yBase);
      ctx.stroke();

      // the waveform
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = color;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      let lastY = yBase;
      for (let x = 0; x <= w; x += 1.5) {
        const y = yBase - wave(x + phase) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        lastY = y;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // leading pulse dot
      if (!reduced) {
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.shadowColor = glow;
        ctx.shadowBlur = 18;
        ctx.arc(w - 1, lastY, lineWidth * 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (!reduced) raf = requestAnimationFrame(draw);
    };

    resize();
    raf = requestAnimationFrame(draw);
    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) raf = requestAnimationFrame(draw);
    });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [color, glow, grid, speed, amplitude, baseline, lineWidth, reveal]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
