'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Activity } from 'lucide-react';
import { ismc } from '@/lib/ismc/content';
import { PulseCanvas } from './PulseCanvas';

const reveal = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

/* ----------------------------------------------------------------- NAV */
export function VitalsNav() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid ? 'border-b border-white/10 bg-[var(--ismc-navy-deep)]/85 backdrop-blur-md' : ''
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link href="/c1" className="ismc-mono flex items-center gap-2.5 text-sm font-semibold tracking-[0.18em] text-white">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--ismc-orange)]" />
          ISMC<span className="text-[var(--ismc-sky)]">/2026</span>
        </Link>
        <div className="ismc-mono hidden items-center gap-7 text-[11px] uppercase tracking-[0.2em] text-white/70 md:flex">
          {ismc.nav.map((n) => (
            <Link key={n.label} href={n.href} className="transition-colors hover:text-[var(--ismc-orange)]">
              {n.label}
            </Link>
          ))}
        </div>
        <Link
          href={ismc.cta.register}
          className="rounded-full bg-[var(--ismc-orange)] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--ismc-navy-deep)] transition-transform hover:-translate-y-0.5"
        >
          Register
        </Link>
      </nav>
    </header>
  );
}

/* -------------------------------------------------------------- TICKER */
export function VitalsTicker() {
  const items = [
    'Hyderabad · India',
    `${ismc.dates.main}`,
    'IASM × TASM',
    'Workshop · Sep 7',
    ismc.tagline,
    'Registrations Open Soon',
  ];
  const row = [...items, ...items];
  return (
    <div className="border-y border-[var(--ismc-navy-deep)]/15 bg-[var(--ismc-orange)] py-3 text-[var(--ismc-navy-deep)]">
      <div className="relative overflow-hidden">
        <motion.div
          className="ismc-mono flex w-max items-center gap-8 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.2em]"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 26, ease: 'linear', repeat: Infinity }}
        >
          {row.map((t, i) => (
            <span key={i} className="flex items-center gap-8">
              {t}
              <span className="text-[var(--ismc-navy-deep)]/40">✶</span>
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- THE ARC */
export function VitalsArc() {
  return (
    <section className="relative bg-[var(--ismc-light)] py-24 text-[var(--ismc-navy)] sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="ismc-mono mb-4 text-[11px] uppercase tracking-[0.35em] text-[var(--ismc-orange-deep)]">
              The Arc of an Athlete
            </p>
            <h2 className="ismc-display max-w-2xl text-4xl font-bold leading-[0.95] tracking-[-0.02em] sm:text-6xl">
              Science. Practice.
              <br />
              <span className="text-[var(--ismc-blue)]">Performance.</span>
            </h2>
          </div>
          <p className="max-w-sm text-[var(--ismc-navy)]/70">
            Two days that follow the full signal of an athlete — from the evidence in the lab to the moment they return to play.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {ismc.pillars.map((p, i) => (
            <motion.article
              key={p.key}
              variants={reveal}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
              className="group relative overflow-hidden rounded-2xl border border-[var(--ismc-navy)]/10 bg-white p-7 shadow-[0_1px_0_rgba(14,42,87,0.04)] transition-shadow hover:shadow-[0_24px_60px_-30px_rgba(14,42,87,0.45)]"
            >
              <div className="ismc-mono mb-6 flex items-center justify-between text-[11px] uppercase tracking-[0.25em] text-[var(--ismc-navy)]/45">
                <span>0{i + 1}</span>
                <Activity className="h-4 w-4 text-[var(--ismc-orange)]" />
              </div>
              <div className="mb-5 h-14 w-full opacity-90">
                <PulseCanvas
                  className="h-full w-full"
                  color="#1E5BB0"
                  glow="rgba(30,91,176,0.35)"
                  grid={false}
                  speed={55 + i * 14}
                  amplitude={0.75}
                  lineWidth={2}
                  reveal={false}
                />
              </div>
              <h3 className="ismc-display text-2xl font-bold tracking-[-0.01em]">{p.label}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--ismc-navy)]/70">{p.line}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- VITALS GRID */
export function VitalsGrid() {
  return (
    <section className="relative overflow-hidden bg-[var(--ismc-navy)] py-24 text-white sm:py-28">
      <PulseCanvas
        className="absolute inset-x-0 bottom-0 h-40 w-full opacity-30"
        color="#F5A524"
        grid={false}
        speed={70}
        amplitude={0.7}
        baseline={0.6}
        reveal={false}
      />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <p className="ismc-mono mb-12 text-[11px] uppercase tracking-[0.35em] text-[var(--ismc-orange)]">
          Vital Signs
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
          {ismc.highlights.map((h, i) => (
            <motion.div
              key={h.label}
              variants={reveal}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="border-t border-white/15 pt-5"
            >
              <div className="ismc-display text-5xl font-bold leading-none text-[var(--ismc-orange)] sm:text-6xl">
                {h.stat}
              </div>
              <div className="mt-4 text-sm font-semibold">{h.label}</div>
              <div className="ismc-mono mt-1 text-[11px] uppercase tracking-[0.2em] text-white/50">{h.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- ORGANIZERS */
export function VitalsOrganizers() {
  return (
    <section className="bg-[var(--ismc-light)] py-24 text-[var(--ismc-navy)] sm:py-28">
      <div className="mx-auto max-w-5xl px-6 text-center lg:px-10">
        <p className="ismc-mono mb-4 text-[11px] uppercase tracking-[0.35em] text-[var(--ismc-orange-deep)]">
          Jointly Convened By
        </p>
        <h2 className="ismc-display mx-auto max-w-3xl text-3xl font-bold leading-[1.05] tracking-[-0.02em] sm:text-5xl">
          One national body. One state body. <span className="text-[var(--ismc-blue)]">One room.</span>
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {ismc.organizers.map((o) => (
            <div
              key={o.short}
              className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--ismc-navy)]/10 bg-white px-8 py-10"
            >
              <span className="ismc-display text-4xl font-bold tracking-[-0.02em] text-[var(--ismc-navy)]">{o.short}</span>
              <span className="text-sm font-medium text-[var(--ismc-navy)]/75">{o.name}</span>
              <span className="ismc-mono text-[10px] uppercase tracking-[0.25em] text-[var(--ismc-orange-deep)]">{o.scope}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- REGISTER BAND */
export function VitalsRegisterBand() {
  return (
    <section className="relative overflow-hidden bg-[var(--ismc-orange)] py-24 text-[var(--ismc-navy-deep)] sm:py-32">
      <div className="relative mx-auto max-w-5xl px-6 text-center lg:px-10">
        <h2 className="ismc-display text-4xl font-bold leading-[0.95] tracking-[-0.02em] sm:text-7xl">
          The stride doesn&apos;t stop.
          <br />
          Neither should you.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--ismc-navy-deep)]/80">{ismc.closing}</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={ismc.cta.register}
            className="group inline-flex items-center gap-3 rounded-full bg-[var(--ismc-navy-deep)] px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-white transition-transform hover:-translate-y-0.5"
          >
            Register Now
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <Link
            href={ismc.cta.abstracts}
            className="ismc-mono inline-flex items-center gap-2 rounded-full border border-[var(--ismc-navy-deep)]/30 px-7 py-4 text-xs uppercase tracking-[0.2em] transition-colors hover:bg-[var(--ismc-navy-deep)]/5"
          >
            Submit an Abstract
          </Link>
        </div>
        <p className="ismc-mono mt-8 text-[11px] uppercase tracking-[0.25em] text-[var(--ismc-navy-deep)]/60">
          Conference Secretary — {ismc.registration.secretary}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- FOOTER */
export function VitalsFooter() {
  return (
    <footer className="bg-[var(--ismc-navy-deep)] py-14 text-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex flex-col gap-8 border-b border-white/10 pb-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="ismc-mono flex items-center gap-2.5 text-sm font-semibold tracking-[0.18em]">
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--ismc-orange)]" />
              ISMC / 2026
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/60">{ismc.name}. {ismc.venue.label}, {ismc.dates.mainShort}.</p>
          </div>
          <div className="ismc-mono grid grid-cols-2 gap-x-12 gap-y-2 text-[11px] uppercase tracking-[0.2em] text-white/65 sm:grid-cols-3">
            {ismc.nav.map((n) => (
              <Link key={n.label} href={n.href} className="transition-colors hover:text-[var(--ismc-orange)]">
                {n.label}
              </Link>
            ))}
            <Link href={ismc.cta.login} className="transition-colors hover:text-[var(--ismc-orange)]">
              Login
            </Link>
          </div>
        </div>
        <p className="ismc-mono mt-8 text-[10px] uppercase tracking-[0.2em] text-white/40">
          © 2026 Indian Sports Medicine Conference — IASM &amp; TASM. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
