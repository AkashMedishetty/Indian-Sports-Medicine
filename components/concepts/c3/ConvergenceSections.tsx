'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { ismc } from '@/lib/ismc/content';

const reveal = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

/* ----------------------------------------------------------------- NAV */
export function ConvergenceNav() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid ? 'border-b border-white/10 bg-[var(--ismc-navy-deep)]/90 backdrop-blur-md' : ''
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-12">
        <Link
          href="/c3"
          className={`ismc-display text-xl uppercase tracking-tight ${solid ? 'text-white' : 'text-white mix-blend-difference'}`}
        >
          ISMC 26
        </Link>
        <div className={`ismc-mono hidden items-center gap-7 text-[11px] uppercase tracking-[0.2em] md:flex ${solid ? 'text-white/75' : 'text-white mix-blend-difference'}`}>
          {ismc.nav.map((n) => (
            <Link key={n.label} href={n.href} className="transition-opacity hover:opacity-60">
              {n.label}
            </Link>
          ))}
        </div>
        <Link
          href={ismc.cta.register}
          className="rounded-full bg-white px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--ismc-navy)] transition-transform hover:-translate-y-0.5"
        >
          Register
        </Link>
      </nav>
    </header>
  );
}

/* ------------------------------------------------------- CONVERGE STATEMENT */
export function ConvergeStatement() {
  return (
    <section className="bg-[var(--ismc-navy)] py-28 text-white sm:py-36">
      <div className="mx-auto max-w-5xl px-6 text-center lg:px-12">
        <p className="ismc-mono mb-8 text-[11px] uppercase tracking-[0.35em] text-[var(--ismc-orange)]">
          Where two worlds meet
        </p>
        <motion.h2
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="ismc-display text-4xl uppercase leading-[0.92] tracking-tight sm:text-6xl"
        >
          The lab and the field,
          <br />
          <span className="text-[var(--ismc-sky)]">in one room.</span>
        </motion.h2>
        <p className="ismc-body mx-auto mt-8 max-w-xl text-lg text-white/70">
          {ismc.tagline}. For two days, the people who measure performance and the
          people who restore it share the same stage — then put their hands on it in a
          workshop on September 7.
        </p>
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
          {ismc.pillars.map((p, i) => (
            <motion.div
              key={p.key}
              variants={reveal}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="bg-[var(--ismc-navy-deep)] p-7 text-left"
            >
              <span className="ismc-mono text-[11px] text-[var(--ismc-orange)]">0{i + 1}</span>
              <h3 className="ismc-display mt-3 text-2xl uppercase tracking-tight">{p.label}</h3>
              <p className="ismc-body mt-2 text-sm leading-relaxed text-white/60">{p.line}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- STATS */
export function ConvergeStats() {
  return (
    <section className="bg-[var(--ismc-light)] py-24 text-[var(--ismc-navy)] sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
          {ismc.highlights.map((h, i) => (
            <motion.div
              key={h.label}
              variants={reveal}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="border-t-2 border-[var(--ismc-navy)]/15 pt-5"
            >
              <div className="ismc-display text-6xl uppercase leading-none text-[var(--ismc-navy)] sm:text-7xl">
                {h.stat}
              </div>
              <div className="ismc-body mt-4 text-sm font-semibold">{h.label}</div>
              <div className="ismc-mono mt-1 text-[11px] uppercase tracking-[0.2em] text-[var(--ismc-navy)]/55">{h.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- REGISTER (split) */
export function ConvergeRegister() {
  return (
    <section className="grid min-h-[60vh] grid-cols-1 sm:grid-cols-2">
      <div className="flex flex-col justify-center bg-[var(--ismc-navy-deep)] px-6 py-20 text-white lg:px-16">
        <p className="ismc-mono mb-4 text-[11px] uppercase tracking-[0.3em] text-[var(--ismc-sky)]">The Science</p>
        <h2 className="ismc-display text-4xl uppercase leading-[0.9] tracking-tight sm:text-5xl">
          Bring your
          <br />evidence.
        </h2>
        <Link
          href={ismc.cta.abstracts}
          className="ismc-mono mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/25 px-6 py-3.5 text-xs uppercase tracking-[0.2em] transition-colors hover:border-[var(--ismc-orange)]"
        >
          Submit an Abstract <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="flex flex-col justify-center bg-[var(--ismc-orange)] px-6 py-20 text-[var(--ismc-navy-deep)] lg:px-16">
        <p className="ismc-mono mb-4 text-[11px] uppercase tracking-[0.3em] text-[var(--ismc-navy-deep)]/70">The Sport</p>
        <h2 className="ismc-display text-4xl uppercase leading-[0.9] tracking-tight sm:text-5xl">
          Bring your
          <br />game.
        </h2>
        <Link
          href={ismc.cta.register}
          className="group mt-8 inline-flex w-fit items-center gap-3 rounded-full bg-[var(--ismc-navy-deep)] px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-white transition-transform hover:-translate-y-0.5"
        >
          Register Now <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- FOOTER */
export function ConvergeFooter() {
  return (
    <footer className="bg-[var(--ismc-navy-deep)] py-14 text-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="flex flex-col gap-8 border-b border-white/10 pb-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="ismc-display text-2xl uppercase tracking-tight">ISMC 26</div>
            <p className="ismc-body mt-4 text-sm leading-relaxed text-white/55">
              {ismc.name}. {ismc.venue.label}, {ismc.dates.mainShort}. Conference Secretary — {ismc.registration.secretary}.
            </p>
          </div>
          <div className="ismc-mono grid grid-cols-2 gap-x-12 gap-y-2 text-[11px] uppercase tracking-[0.2em] text-white/60 sm:grid-cols-3">
            {ismc.nav.map((n) => (
              <Link key={n.label} href={n.href} className="transition-colors hover:text-[var(--ismc-orange)]">
                {n.label}
              </Link>
            ))}
            <Link href={ismc.cta.login} className="transition-colors hover:text-[var(--ismc-orange)]">Login</Link>
          </div>
        </div>
        <p className="ismc-mono mt-8 text-[10px] uppercase tracking-[0.2em] text-white/35">
          © 2026 Indian Sports Medicine Conference — IASM &amp; TASM.
        </p>
      </div>
    </footer>
  );
}
