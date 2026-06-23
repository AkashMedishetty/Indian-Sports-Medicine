'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ismc } from '@/lib/ismc/content';

const ease = [0.16, 1, 0.3, 1] as const;

export function MotionHero() {
  const reduce = useReducedMotion();
  const rise = {
    hidden: { y: reduce ? 0 : '108%' },
    show: (i = 0) => ({ y: '0%', transition: { duration: 0.95, delay: 0.15 + i * 0.09, ease } }),
  };

  const meta = [
    { n: '01', t: 'Hyderabad, India' },
    { n: '02', t: 'Post-conference workshop · Sep 7' },
    { n: '03', t: 'Registrations — open soon' },
  ];

  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden bg-[var(--ismc-light)] text-[var(--ismc-navy)]">
      {/* paper grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'linear-gradient(var(--ismc-navy) 1px, transparent 1px), linear-gradient(90deg, var(--ismc-navy) 1px, transparent 1px)',
          backgroundSize: '96px 96px',
          opacity: 0.04,
        }}
      />

      {/* faint stride arc */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <motion.path
          d="M-50 720 C 320 720, 470 250, 760 250 S 1180 660, 1520 300"
          fill="none"
          stroke="var(--ismc-navy)"
          strokeOpacity="0.10"
          strokeWidth="1.5"
          initial={{ pathLength: reduce ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.8, ease, delay: 0.3 }}
        />
        <motion.circle
          cx="760" cy="250" r="5" fill="var(--ismc-orange)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.4 }}
        />
      </svg>

      {/* masthead */}
      <div className="ismc-mono absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-[var(--ismc-navy)]/15 px-6 pb-3 pt-20 text-[10px] uppercase tracking-[0.25em] text-[var(--ismc-navy)]/60 lg:px-10">
        <span>Indian Sports Medicine Conference</span>
        <span className="hidden sm:block">Hyderabad · MMXXVI</span>
        <span>Vol. 01</span>
      </div>

      {/* grid */}
      <div className="relative z-10 mx-auto grid min-h-[100svh] max-w-7xl grid-cols-1 gap-x-10 gap-y-12 px-6 pb-20 pt-32 lg:grid-cols-12 lg:items-center lg:px-10">
        {/* headline */}
        <div className="lg:col-span-7">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="ismc-mono mb-6 text-[11px] uppercase tracking-[0.3em] text-[var(--ismc-orange-deep)]"
          >
            The Sports Medicine Issue — IASM × TASM
          </motion.p>

          <h1 className="ismc-display font-black uppercase leading-[0.82] tracking-[-0.03em]">
            <span className="block overflow-hidden">
              <motion.span variants={rise} custom={0} initial="hidden" animate="show" className="block" style={{ fontSize: 'clamp(3.6rem, 12vw, 10rem)' }}>
                Sports
              </motion.span>
            </span>
            <span className="relative block overflow-hidden">
              {/* kinesiology tape */}
              <motion.span
                aria-hidden
                initial={{ scaleX: reduce ? 1 : 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.7, ease, delay: 0.6 }}
                className="absolute left-[-1%] top-[42%] z-0 h-[0.34em] w-[78%] origin-left -rotate-2 rounded-full"
                style={{
                  background:
                    'repeating-linear-gradient(90deg, var(--ismc-orange) 0 13px, var(--ismc-orange-deep) 13px 15px)',
                }}
              />
              <motion.span variants={rise} custom={1} initial="hidden" animate="show" className="relative z-10 block" style={{ fontSize: 'clamp(3.6rem, 12vw, 10rem)' }}>
                Medicine
              </motion.span>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.8 }}
            className="ismc-serif mt-3 text-3xl italic text-[var(--ismc-navy)]/80 sm:text-5xl"
          >
            in motion<span className="text-[var(--ismc-orange-deep)]">.</span>
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="ismc-body mt-7 max-w-md text-base leading-relaxed text-[var(--ismc-navy)]/70 sm:text-lg"
          >
            {ismc.tagline}. A two-day conference where the science of the body at its
            limit meets the people who put it back together.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.7 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link
              href={ismc.cta.register}
              className="group inline-flex items-center gap-3 rounded-full bg-[var(--ismc-navy)] px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-white transition-transform duration-300 hover:-translate-y-0.5"
            >
              Register
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href={ismc.cta.program}
              className="ismc-mono inline-flex items-center gap-2 rounded-full border border-[var(--ismc-navy)]/25 px-6 py-3.5 text-xs uppercase tracking-[0.2em] text-[var(--ismc-navy)] transition-colors hover:border-[var(--ismc-orange-deep)] hover:text-[var(--ismc-orange-deep)]"
            >
              View Program
            </Link>
          </motion.div>
        </div>

        {/* datestamp + index */}
        <motion.aside
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.9, ease }}
          className="lg:col-span-5 lg:justify-self-end"
        >
          <div className="lg:max-w-xs lg:border-l lg:border-[var(--ismc-navy)]/15 lg:pl-8">
            <p className="ismc-mono text-[10px] uppercase tracking-[0.3em] text-[var(--ismc-navy)]/50">The Dates</p>
            <div className="ismc-display mt-2 text-7xl font-black leading-[0.85] tracking-[-0.03em] sm:text-8xl">
              05<span className="text-[var(--ismc-orange-deep)]">–</span>06
            </div>
            <div className="ismc-display mt-1 text-2xl font-bold uppercase tracking-tight text-[var(--ismc-navy)]/80">
              September 2026
            </div>

            <ul className="mt-8 divide-y divide-[var(--ismc-navy)]/12 border-y border-[var(--ismc-navy)]/12">
              {meta.map((m) => (
                <li key={m.n} className="flex items-baseline gap-4 py-3">
                  <span className="ismc-mono text-[11px] text-[var(--ismc-orange-deep)]">{m.n}</span>
                  <span className="ismc-body text-sm text-[var(--ismc-navy)]/75">{m.t}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.aside>
      </div>

      {/* bottom index strip */}
      <div className="ismc-mono absolute inset-x-0 bottom-0 z-10 hidden items-center justify-between border-t border-[var(--ismc-navy)]/15 px-10 py-4 text-[10px] uppercase tracking-[0.25em] text-[var(--ismc-navy)]/55 lg:flex">
        <span>Injury — Assessment — Recovery — Return</span>
        <span>Conference Secretary · {ismc.registration.secretary}</span>
      </div>
    </section>
  );
}
