'use client';

// Registration is not open yet — this route shows a premium "opens soon" page.
// The full backend registration flow is untouched at
// conference-backend-core/app/register/page.tsx. To re-enable it, restore:
//   import RegisterPage from '@/conference-backend-core/app/register/page'
//   export default RegisterPage

import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { SmoothScroll } from '@/components/concepts/premium/SmoothScroll';
import { Navigation } from '@/conference-backend-core/components/Navigation';
import { Footer } from '@/components/concepts/premium/Sections';
import { ismc } from '@/lib/ismc/content';

const DOTS = [
  { l: '14%', t: '26%', s: 10, c: 'var(--p-accent)', d: '0s' },
  { l: '82%', t: '30%', s: 7, c: 'var(--p-subject-soft)', d: '1.2s' },
  { l: '22%', t: '70%', s: 8, c: 'var(--p-subject-soft)', d: '0.6s' },
  { l: '86%', t: '66%', s: 11, c: 'var(--p-accent)', d: '1.8s' },
];

export default function RegisterPage() {
  return (
    <main className="ismc-body p-page relative min-h-screen overflow-x-hidden">
      <SmoothScroll />
      <Navigation />

      <section className="p-page relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden">
        <div className="p-hero-mesh pointer-events-none absolute inset-0" aria-hidden="true" />
        {DOTS.map((d, i) => (
          <span
            key={i}
            className="p-float pointer-events-none absolute rounded-full"
            aria-hidden="true"
            style={{ left: d.l, top: d.t, width: d.s, height: d.s, background: d.c, opacity: 0.5, animationDelay: d.d }}
          />
        ))}

        <div className="relative mx-auto w-full max-w-3xl px-5 py-24 text-center lg:px-10">
          {/* status chip */}
          <span className="p-fade-up ismc-mono inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[var(--p-text-muted)]" style={{ borderColor: 'var(--p-border)' }}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: 'var(--p-accent)' }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: 'var(--p-accent)' }} />
            </span>
            Registration
          </span>

          <h1
            className="p-fade-up ismc-display mt-8 text-5xl font-semibold leading-[1.02] tracking-[-0.025em] text-[var(--p-text)] sm:text-7xl"
            style={{ animationDelay: '0.08s' }}
          >
            Registrations<br />open soon
          </h1>

          <p
            className="p-fade-up ismc-body mx-auto mt-7 max-w-xl text-lg leading-relaxed text-[var(--p-text-muted)]"
            style={{ animationDelay: '0.16s' }}
          >
            Registration for the {ismc.name} isn&apos;t open just yet. Check back shortly, or drop us a
            line and we&apos;ll let you know the moment it goes live.
          </p>

          {/* facts */}
          <div className="p-fade-up ismc-mono mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-[var(--p-text-muted)]" style={{ animationDelay: '0.24s' }}>
            <span><span className="text-[var(--p-accent-deep)]">●</span> {ismc.dates.mainShort}</span>
            <span><span className="text-[var(--p-accent-deep)]">●</span> {ismc.venue.city}</span>
            <span><span className="text-[var(--p-accent-deep)]">●</span> Workshop Sep 7</span>
          </div>

          {/* CTAs */}
          <div className="p-fade-up mt-10 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: '0.32s' }}>
            <Link
              href={ismc.cta.contact}
              className="p-neon group inline-flex items-center gap-2.5 rounded-full px-7 py-4 text-sm font-semibold transition-transform hover:-translate-y-0.5"
              style={{ background: 'var(--p-accent)', color: '#0a1e40' }}
            >
              Contact us
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-full border px-6 py-4 text-sm font-medium text-[var(--p-text)] transition-colors hover:bg-[var(--p-glass-border)]"
              style={{ borderColor: 'var(--p-border)' }}
            >
              <ArrowRight className="h-4 w-4 rotate-180 transition-transform group-hover:-translate-x-0.5" />
              Back to home
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
