'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Activity, MapPin, CalendarDays } from 'lucide-react';
import { ismc } from '@/lib/ismc/content';
import { PulseCanvas } from './PulseCanvas';

function LiveClock() {
  const [t, setT] = useState<string>('--:--:--');
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString('en-IN', {
        hour12: false,
        timeZone: 'Asia/Kolkata',
      });
    setT(fmt());
    const id = setInterval(() => setT(fmt()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{t} IST</span>;
}

const words = ismc.titleLines; // ['Indian','Sports','Medicine']

export function VitalsHero() {
  const reduce = useReducedMotion();

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
  };
  const lineUp = {
    hidden: { y: '110%', opacity: 0 },
    show: {
      y: '0%',
      opacity: 1,
      transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden bg-[var(--ismc-navy-deep)] text-white">
      {/* waveform field */}
      <PulseCanvas className="absolute inset-0 h-full w-full" reveal />

      {/* depth + readability overlays */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 18% 30%, rgba(10,30,64,0.35) 0%, rgba(10,30,64,0.86) 55%, rgba(10,30,64,0.96) 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-soft-light"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent 0 2px, rgba(255,255,255,0.5) 2px 3px)',
        }}
      />

      {/* corner instrument readouts */}
      <div className="ismc-mono pointer-events-none absolute inset-x-0 top-0 hidden items-start justify-between px-6 pt-24 text-[11px] uppercase tracking-[0.2em] text-[var(--ismc-sky)]/70 sm:flex lg:px-10">
        <span>17.3850°N · 78.4867°E</span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ismc-orange)]" />
          EMG · ECG · GAIT
        </span>
      </div>
      <div className="ismc-mono pointer-events-none absolute bottom-5 left-6 hidden text-[11px] uppercase tracking-[0.2em] text-[var(--ismc-sky)]/60 sm:block lg:left-10">
        SYS · ISMC-2026 · <LiveClock />
      </div>

      {/* content */}
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-6 pb-16 pt-28 lg:px-10">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="ismc-mono mb-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.35em] text-[var(--ismc-orange)]"
        >
          <Activity className="h-4 w-4" strokeWidth={2.5} />
          Vitals / Assessment 01 — {ismc.venue.label}
        </motion.p>

        <motion.h1
          variants={container}
          initial={reduce ? undefined : 'hidden'}
          animate={reduce ? undefined : 'show'}
          className="ismc-display font-bold leading-[0.86] tracking-[-0.03em]"
          style={{ fontSize: 'clamp(2.9rem, 11vw, 9.5rem)' }}
        >
          {words.map((word, i) => (
            <span key={word} className="block overflow-hidden">
              <motion.span
                variants={reduce ? undefined : lineUp}
                className="block"
                style={{
                  color: i === 1 ? 'var(--ismc-orange)' : 'white',
                }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="max-w-xl">
            <p className="ismc-mono text-sm uppercase tracking-[0.4em] text-[var(--ismc-sky)]">
              Conference
            </p>
            <p className="mt-4 text-lg leading-relaxed text-white/75 sm:text-xl">
              {ismc.tagline}
            </p>
          </div>

          {/* vital chips */}
          <div className="flex flex-wrap gap-3">
            <Chip icon={<CalendarDays className="h-4 w-4" />} label={ismc.dates.mainShort} sub="+ Workshop Sep 7" />
            <Chip icon={<MapPin className="h-4 w-4" />} label={ismc.venue.city} sub={ismc.venue.state} />
            <Chip
              icon={<span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--ismc-orange)]" />}
              label="Registration"
              sub={ismc.registration.status}
              accent
            />
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.7 }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <Link
            href={ismc.cta.register}
            className="group inline-flex items-center gap-3 rounded-full bg-[var(--ismc-orange)] px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.15em] text-[var(--ismc-navy-deep)] transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ismc-orange)]"
          >
            Begin Assessment — Register
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href={ismc.cta.program}
            className="ismc-mono inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-xs uppercase tracking-[0.2em] text-white/80 transition-colors hover:border-[var(--ismc-orange)] hover:text-white"
          >
            View Program
          </Link>
        </motion.div>
      </div>

      {/* scroll cue */}
      <div className="ismc-mono pointer-events-none absolute bottom-5 right-6 hidden items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-[var(--ismc-sky)]/60 lg:right-10 lg:flex">
        Scroll <span className="inline-block h-8 w-px bg-gradient-to-b from-[var(--ismc-orange)] to-transparent" />
      </div>
    </section>
  );
}

function Chip({
  icon,
  label,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 backdrop-blur-sm ${
        accent
          ? 'border-[var(--ismc-orange)]/40 bg-[var(--ismc-orange)]/10'
          : 'border-white/12 bg-white/[0.04]'
      }`}
    >
      <span className={accent ? 'text-[var(--ismc-orange)]' : 'text-[var(--ismc-sky)]'}>{icon}</span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-white">{label}</span>
        <span className="ismc-mono block text-[10px] uppercase tracking-[0.2em] text-white/50">{sub}</span>
      </span>
    </div>
  );
}
