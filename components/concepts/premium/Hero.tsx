'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ismc } from '@/lib/ismc/content';

const HEAD_LINES = ['Indian Sports', 'Medicine', 'Conference 2026'];
const STAT_COLORS = ['var(--p-accent)', 'var(--p-subject-soft)', '#16a34a', 'var(--p-accent-deep)'];

export function Hero({ subject }: { subject: React.ReactNode }) {
  return (
    <section className="p-page relative min-h-[100svh] w-full overflow-hidden">
      {/* colour-washed backdrop */}
      <div className="p-hero-mesh pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto grid min-h-[100svh] max-w-7xl grid-cols-1 items-center gap-6 px-5 pb-24 pt-28 lg:grid-cols-12 lg:px-10">
        {/* copy — CSS-driven entrance (robust, always ends visible) */}
        <div className="lg:col-span-6 xl:col-span-5">
          <p
            className="p-fade-up ismc-mono mb-6 text-[11px] uppercase tracking-[0.28em] text-[var(--p-text-muted)]"
            style={{ animationDelay: '0.05s' }}
          >
            Uniting science, practice &amp; performance
          </p>

          <h1 className="ismc-display font-semibold leading-[0.96] tracking-[-0.025em] text-[var(--p-text)]" style={{ fontSize: 'clamp(2.3rem, 5.6vw, 4.8rem)' }}>
            {HEAD_LINES.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.04em]">
                <span className="p-rise" style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
                  {line}
                </span>
              </span>
            ))}
          </h1>

          <p
            className="p-fade-up ismc-body mt-7 max-w-lg text-base leading-relaxed text-[var(--p-text-muted)] sm:text-lg"
            style={{ animationDelay: '0.5s' }}
          >
            <span className="text-[var(--p-text)]">A national gathering of sports physicians, surgeons, physiotherapists and scientists.</span>{' '}
            Two days of evidence and practice in Hyderabad, September 5–6, 2026 — followed by a
            hands-on workshop on the 7th.
          </p>

          {/* quick facts */}
          <div
            className="p-fade-up ismc-mono mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-[var(--p-text-muted)]"
            style={{ animationDelay: '0.6s' }}
          >
            <span><span className="text-[var(--p-accent-deep)]">●</span> {ismc.dates.mainShort}</span>
            <span><span className="text-[var(--p-accent-deep)]">●</span> {ismc.venue.city}</span>
            <span><span className="text-[var(--p-accent-deep)]">●</span> Registrations open soon</span>
          </div>

          <div className="p-fade-up mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: '0.7s' }}>
            <Link
              href={ismc.cta.register}
              className="group inline-flex items-center gap-2.5 rounded-full px-6 py-3.5 text-sm font-semibold tracking-tight transition-transform duration-300 hover:-translate-y-0.5"
              style={{ background: 'var(--p-text)', color: 'var(--p-bg)' }}
            >
              Register now
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href={ismc.cta.program}
              className="inline-flex items-center gap-2 rounded-full border px-5 py-3.5 text-sm font-medium text-[var(--p-text)] transition-colors hover:bg-[var(--p-glass-border)]"
              style={{ borderColor: 'var(--p-border)' }}
            >
              View programme
            </Link>
            <Link
              href={ismc.cta.abstracts}
              className="inline-flex items-center gap-2 px-2 py-3.5 text-sm font-medium text-[var(--p-text-muted)] underline-offset-4 transition-colors hover:text-[var(--p-text)] hover:underline"
            >
              Submit an abstract
            </Link>
          </div>
        </div>

        {/* subject — locked to the image's 2:3 ratio so hotspots stay aligned */}
        <div className="relative mx-auto aspect-[2/3] h-[62vh] w-auto lg:h-[80vh] lg:col-span-6 lg:col-start-7 xl:col-span-7 xl:col-start-6">
          {subject}
        </div>
      </div>

      {/* stat cards */}
      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto max-w-7xl px-5 pb-5 lg:px-10">
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {ismc.highlights.map((h, i) => (
              <div
                key={h.label}
                className="p-fade-up p-glass flex items-center gap-3 rounded-2xl px-4 py-3 transition-transform duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${0.85 + i * 0.08}s` }}
              >
                <span className="ismc-display text-3xl font-bold leading-none" style={{ color: STAT_COLORS[i % STAT_COLORS.length] }}>{h.stat}</span>
                <span className="leading-tight">
                  <span className="ismc-body block text-xs font-semibold text-[var(--p-text)]">{h.label}</span>
                  <span className="ismc-mono block text-[10px] uppercase tracking-[0.16em] text-[var(--p-text-faint)]">{h.sub}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
