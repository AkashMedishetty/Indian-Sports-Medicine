'use client';

import { SmoothScroll } from '@/components/concepts/premium/SmoothScroll';
import { Navigation } from '@/conference-backend-core/components/Navigation';
import { VenueCity, Footer } from '@/components/concepts/premium/Sections';
import { ismc } from '@/lib/ismc/content';

export default function VenuePage() {
  return (
    <main className="ismc-body p-page relative overflow-x-hidden">
      <SmoothScroll />
      <Navigation />

      {/* Page header */}
      <header className="p-page relative overflow-hidden">
        <div className="p-hero-mesh pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 pb-8 pt-20 sm:pt-28 lg:px-10">
          <p className="p-fade-up ismc-mono mb-6 text-[11px] uppercase tracking-[0.3em] text-[var(--p-accent-deep)]">
            IASMCON 2026 · {ismc.dates.mainShort}
          </p>
          <h1
            className="p-fade-up ismc-display text-4xl font-semibold leading-[1.03] tracking-[-0.025em] text-[var(--p-text)] sm:text-6xl"
            style={{ animationDelay: '0.08s' }}
          >
            Venue
          </h1>
          <p
            className="p-fade-up ismc-body mt-6 max-w-2xl text-lg leading-relaxed text-[var(--p-text-muted)]"
            style={{ animationDelay: '0.16s' }}
          >
            The {ismc.name} convenes in {ismc.venue.city} on {ismc.dates.mainShort} — the exact
            venue will be announced soon. Meet the city that hosts it.
          </p>
        </div>
      </header>

      <VenueCity />
      <Footer />
    </main>
  );
}
