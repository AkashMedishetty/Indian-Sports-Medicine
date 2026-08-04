'use client';

import { SmoothScroll } from '@/components/concepts/premium/SmoothScroll';
import { Navigation } from '@/conference-backend-core/components/Navigation';
import { About, Stats, Committee, Organizers, Footer } from '@/components/concepts/premium/Sections';
import { ismc } from '@/lib/ismc/content';

export default function AboutPage() {
  return (
    <main className="ismc-body p-page relative overflow-x-hidden">
      <SmoothScroll />
      <Navigation />

      {/* Page header */}
      <header className="p-page relative overflow-hidden">
        <div className="p-hero-mesh pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-20 sm:pt-28 lg:px-10">
          <p className="p-fade-up ismc-mono mb-6 text-[11px] uppercase tracking-[0.3em] text-[var(--p-accent-deep)]">
            Indian Association of Sports Medicine · Hyderabad 2026
          </p>
          <h1
            className="p-fade-up ismc-display max-w-4xl text-4xl font-semibold leading-[1.03] tracking-[-0.025em] text-[var(--p-text)] sm:text-6xl"
            style={{ animationDelay: '0.08s' }}
          >
            About the conference
          </h1>
          <p
            className="p-fade-up ismc-body mt-6 max-w-2xl text-lg leading-relaxed text-[var(--p-text-muted)]"
            style={{ animationDelay: '0.16s' }}
          >
            <span className="text-[var(--p-text)]">{ismc.name}</span> brings sports physicians,
            surgeons, physiotherapists and scientists together in {ismc.venue.city} on{' '}
            {ismc.dates.mainShort} — two days of evidence and practice, with a pre-conference
            hands-on workshop on September 4.
          </p>
        </div>
      </header>

      <About />
      <Stats />
      <Committee />
      <Organizers />
      <Footer />
    </main>
  );
}
