'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { ismc } from '@/lib/ismc/content';

const phases = [
  { n: '01', label: 'Injury', line: 'The mechanism, the moment, the load that broke.' },
  { n: '02', label: 'Assessment', line: 'Imaging, biomechanics and an evidence-led diagnosis.' },
  { n: '03', label: 'Recovery', line: 'Repair and rehabilitation, staged and measured.' },
  { n: '04', label: 'Return', line: 'Back to play — stronger, and built to last.' },
];

const reveal = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

/* ----------------------------------------------------------------- NAV */
export function MotionNav() {
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
        solid ? 'border-b border-white/10 bg-[var(--ismc-navy-deep)]/90 text-white backdrop-blur-md' : 'text-[var(--ismc-navy)]'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link href="/c2" className="ismc-display text-lg font-black uppercase tracking-tight">
          ISMC<span className="text-[var(--ismc-orange-deep)]">26</span>
        </Link>
        <div className="ismc-mono hidden items-center gap-7 text-[11px] uppercase tracking-[0.2em] opacity-75 md:flex">
          {ismc.nav.map((n) => (
            <Link key={n.label} href={n.href} className="transition-colors hover:text-[var(--ismc-orange-deep)]">
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

/* ----------------------------------------------------------- PHASE RAIL */
export function MotionPhaseRail() {
  return (
    <section className="relative bg-[var(--ismc-navy)] py-24 text-white sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-16 max-w-2xl">
          <p className="ismc-mono mb-4 text-[11px] uppercase tracking-[0.35em] text-[var(--ismc-orange)]">
            The Full Arc
          </p>
          <h2 className="ismc-display text-4xl font-black uppercase leading-[0.9] tracking-[-0.02em] sm:text-6xl">
            From the break to the
            <br />
            <span className="text-[var(--ismc-sky)]">next personal best.</span>
          </h2>
        </div>

        <div className="relative grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-4">
          {phases.map((p, i) => (
            <motion.div
              key={p.n}
              variants={reveal}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              className="group relative bg-[var(--ismc-navy-deep)] p-7 transition-colors hover:bg-[#0c2552]"
            >
              <div className="ismc-display text-6xl font-black text-white/10 transition-colors group-hover:text-[var(--ismc-orange)]/30">
                {p.n}
              </div>
              <h3 className="ismc-display mt-4 text-2xl font-black uppercase tracking-tight">{p.label}</h3>
              <p className="ismc-body mt-3 text-sm leading-relaxed text-white/60">{p.line}</p>
              <span className="ismc-mono mt-6 inline-block h-1 w-10 bg-[var(--ismc-orange)]" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- STATS */
export function MotionStats() {
  return (
    <section className="bg-[var(--ismc-navy-deep)] py-24 text-white sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-14 md:grid-cols-4">
          {ismc.highlights.map((h, i) => (
            <motion.div
              key={h.label}
              variants={reveal}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              <div className="ismc-display text-6xl font-black leading-none text-[var(--ismc-orange)] sm:text-7xl">
                {h.stat}
              </div>
              <div className="ismc-body mt-4 text-sm font-semibold">{h.label}</div>
              <div className="ismc-mono mt-1 text-[11px] uppercase tracking-[0.2em] text-white/45">{h.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- ORGANIZERS */
export function MotionOrganizers() {
  return (
    <section className="border-y border-white/10 bg-[var(--ismc-navy)] py-20 text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 text-center lg:px-10">
        <p className="ismc-mono text-[11px] uppercase tracking-[0.35em] text-[var(--ismc-orange)]">
          Jointly Convened By
        </p>
        <div className="flex flex-col items-center gap-12 sm:flex-row sm:gap-20">
          {ismc.organizers.map((o, i) => (
            <div key={o.short} className="flex items-center gap-12 sm:gap-20">
              <div className="flex flex-col items-center">
                <span className="ismc-display text-5xl font-black tracking-tight">{o.short}</span>
                <span className="ismc-body mt-2 max-w-[14rem] text-xs text-white/55">{o.name}</span>
              </div>
              {i === 0 && <span className="ismc-display text-3xl font-black text-[var(--ismc-orange)]">×</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- REGISTER */
export function MotionRegister() {
  return (
    <section className="relative overflow-hidden bg-[var(--ismc-navy-deep)] py-28 text-white sm:py-36">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 80% at 50% 110%, rgba(245,165,36,0.18) 0%, rgba(10,30,64,0) 60%)',
        }}
      />
      <div className="relative mx-auto max-w-5xl px-6 text-center lg:px-10">
        <h2 className="ismc-display text-5xl font-black uppercase leading-[0.85] tracking-[-0.02em] sm:text-8xl">
          Keep
          <br />
          <span
            style={{
              WebkitTextStroke: '1.5px var(--ismc-orange)',
              color: 'transparent',
            }}
          >
            Moving.
          </span>
        </h2>
        <p className="ismc-body mx-auto mt-8 max-w-xl text-lg text-white/65">{ismc.closing}</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={ismc.cta.register}
            className="group inline-flex items-center gap-3 rounded-full bg-[var(--ismc-orange)] px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-[var(--ismc-navy-deep)] transition-transform hover:-translate-y-0.5"
          >
            Register Now
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <Link
            href={ismc.cta.abstracts}
            className="ismc-mono inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-4 text-xs uppercase tracking-[0.2em] text-white/85 transition-colors hover:border-[var(--ismc-orange)]"
          >
            Submit an Abstract
          </Link>
        </div>
        <p className="ismc-mono mt-8 text-[11px] uppercase tracking-[0.25em] text-white/40">
          Conference Secretary — {ismc.registration.secretary}
        </p>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- FOOTER */
export function MotionFooter() {
  return (
    <footer className="bg-black py-14 text-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex flex-col gap-8 border-b border-white/10 pb-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="ismc-display text-2xl font-black uppercase tracking-tight">
              ISMC<span className="text-[var(--ismc-orange)]">26</span>
            </div>
            <p className="ismc-body mt-4 text-sm leading-relaxed text-white/55">
              {ismc.name}. {ismc.venue.label}, {ismc.dates.mainShort}.
            </p>
          </div>
          <div className="ismc-mono grid grid-cols-2 gap-x-12 gap-y-2 text-[11px] uppercase tracking-[0.2em] text-white/60 sm:grid-cols-3">
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
        <p className="ismc-mono mt-8 text-[10px] uppercase tracking-[0.2em] text-white/35">
          © 2026 Indian Sports Medicine Conference — IASM &amp; TASM.
        </p>
      </div>
    </footer>
  );
}
