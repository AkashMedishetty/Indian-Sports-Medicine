'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, GripVertical } from 'lucide-react';
import { ismc } from '@/lib/ismc/content';

/**
 * One headline, two worlds. The clinical (navy) and the athletic (orange) meet
 * at a seam the visitor can drag — the conference IS the convergence.
 */
function Headline({ tone }: { tone: 'navy' | 'orange' }) {
  const color = tone === 'navy' ? 'text-white' : 'text-[var(--ismc-navy)]';
  const accent = tone === 'navy' ? 'text-[var(--ismc-orange)]' : 'text-white';
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
      <h1 className={`ismc-display uppercase leading-[0.82] tracking-[0.01em] ${color}`} style={{ fontSize: 'clamp(3.4rem, 13vw, 11rem)' }}>
        <span className="block">Indian</span>
        <span className="block">Sports</span>
        <span className="block">Medicine<span className={accent}>.</span></span>
      </h1>
    </div>
  );
}

export function ConvergenceHero() {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const seamRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const posRef = useRef(0.5);
  const draggingRef = useRef(false);
  const [hint, setHint] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let t = 0;
    const apply = (p: number) => {
      posRef.current = p;
      if (leftRef.current) leftRef.current.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`;
      if (rightRef.current) rightRef.current.style.clipPath = `inset(0 0 0 ${p * 100}%)`;
      if (seamRef.current) seamRef.current.style.left = `${p * 100}%`;
    };
    apply(0.5);
    const loop = () => {
      t += 0.016;
      if (!draggingRef.current) {
        const target = reduce ? 0.5 : 0.5 + Math.sin(t * 0.5) * 0.035;
        apply(posRef.current + (target - posRef.current) * 0.05);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const setFromClientX = (clientX: number) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const p = Math.min(0.86, Math.max(0.14, (clientX - rect.left) / rect.width));
    if (leftRef.current) leftRef.current.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`;
    if (rightRef.current) rightRef.current.style.clipPath = `inset(0 0 0 ${p * 100}%)`;
    if (seamRef.current) seamRef.current.style.left = `${p * 100}%`;
    posRef.current = p;
  };

  return (
    <section
      ref={sectionRef}
      className="relative h-[100svh] w-full select-none overflow-hidden"
      onPointerMove={(e) => draggingRef.current && setFromClientX(e.clientX)}
      onPointerUp={() => (draggingRef.current = false)}
      onPointerLeave={() => (draggingRef.current = false)}
    >
      {/* RIGHT WORLD — the athletic (orange) */}
      <div ref={rightRef} className="absolute inset-0 bg-[var(--ismc-orange)] text-[var(--ismc-navy)]">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 90% 10%, rgba(224,123,10,0.5), transparent 60%)' }} />
        <div className="ismc-mono absolute right-6 top-28 text-right text-[11px] uppercase tracking-[0.3em] lg:right-12">
          02 — The Sport
        </div>
        <div className="ismc-mono absolute bottom-28 right-6 flex flex-col items-end gap-2 text-right text-sm font-semibold uppercase tracking-[0.18em] lg:right-12">
          <span>Performance</span>
          <span>Recovery</span>
          <span>Return-to-play</span>
          <span className="mt-3 ismc-display text-3xl tracking-tight">TASM</span>
        </div>
        <Headline tone="orange" />
      </div>

      {/* LEFT WORLD — the clinical (navy) */}
      <div ref={leftRef} className="absolute inset-0 bg-[var(--ismc-navy-deep)] text-white">
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            opacity: 0.05,
          }}
        />
        <div className="ismc-mono absolute left-6 top-28 text-[11px] uppercase tracking-[0.3em] text-[var(--ismc-sky)] lg:left-12">
          01 — The Science
        </div>
        <div className="ismc-mono absolute bottom-28 left-6 flex flex-col gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/85 lg:left-12">
          <span>Evidence</span>
          <span>Biomechanics</span>
          <span>Diagnosis</span>
          <span className="mt-3 ismc-display text-3xl tracking-tight text-[var(--ismc-orange)]">IASM</span>
        </div>
        <Headline tone="navy" />
      </div>

      {/* SEAM + handle */}
      <div ref={seamRef} className="absolute bottom-0 top-0 z-20 w-px -translate-x-1/2 bg-white/40">
        <button
          aria-label="Drag to converge"
          onPointerDown={(e) => {
            draggingRef.current = true;
            setHint(false);
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          }}
          className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-white/40 bg-[var(--ismc-navy-deep)]/70 text-white backdrop-blur-sm transition-transform hover:scale-110"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        {hint && (
          <span className="ismc-mono absolute left-1/2 top-[calc(50%+2.4rem)] -translate-x-1/2 whitespace-nowrap text-[10px] uppercase tracking-[0.25em] text-white/70">
            drag to converge
          </span>
        )}
      </div>

      {/* BOTTOM BAR — shared meta + CTA, never clipped */}
      <div className="absolute inset-x-0 bottom-0 z-30">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 pb-7 text-center lg:px-12">
          <p className="ismc-body max-w-md text-sm text-white mix-blend-difference">
            {ismc.tagline}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <span className="ismc-mono rounded-full bg-white/90 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ismc-navy)]">
              {ismc.dates.mainShort} · Hyderabad
            </span>
            <Link
              href={ismc.cta.register}
              className="group inline-flex items-center gap-2 ismc-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white mix-blend-difference"
            >
              Register now <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
