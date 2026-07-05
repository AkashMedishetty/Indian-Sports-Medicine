'use client';

// Premium registration-fees page built from the confirmed tariff. The backend
// pricing page is untouched at conference-backend-core/app/pricing/page.tsx.
// To re-enable it: import PricingPage from '@/conference-backend-core/app/pricing/page'; export default PricingPage

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SmoothScroll } from '@/components/concepts/premium/SmoothScroll';
import { Navigation } from '@/conference-backend-core/components/Navigation';
import { Footer } from '@/components/concepts/premium/Sections';
import { ismc } from '@/lib/ismc/content';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const TIERS = [
  {
    category: 'Consultants / Practitioners',
    rows: [
      { period: 'Early bird', sub: 'till Jul 31, 2026', member: 3500, nonMember: 4000 },
      { period: 'Standard', sub: 'Aug 1 – Sep 4', member: 4000, nonMember: 4500 },
    ],
    spot: 5000,
  },
  {
    category: 'Residents / Students',
    rows: [
      { period: 'Early bird', sub: 'till Jul 31, 2026', member: 3000, nonMember: 3000 },
      { period: 'Standard', sub: 'Aug 1 – Sep 4', member: 3500, nonMember: 3500 },
    ],
    spot: 4000,
  },
];

export default function PricingPage() {
  return (
    <main className="ismc-body p-page relative min-h-screen overflow-x-hidden">
      <SmoothScroll />
      <Navigation />

      {/* Header */}
      <header className="p-page relative overflow-hidden">
        <div className="p-hero-mesh pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-5 pb-8 pt-20 sm:pt-28 lg:px-10">
          <p className="p-fade-up ismc-mono mb-6 text-[11px] uppercase tracking-[0.3em] text-[var(--p-accent-deep)]">
            TASMC 2026 · Registration fees
          </p>
          <h1
            className="p-fade-up ismc-display text-4xl font-semibold leading-[1.03] tracking-[-0.025em] text-[var(--p-text)] sm:text-6xl"
            style={{ animationDelay: '0.08s' }}
          >
            Registration fees
          </h1>
          <p
            className="p-fade-up ismc-body mt-6 max-w-2xl text-lg leading-relaxed text-[var(--p-text-muted)]"
            style={{ animationDelay: '0.16s' }}
          >
            Fees for the {ismc.name}, in Indian Rupees (₹). Early-bird rates apply until
            <span className="text-[var(--p-text)]"> July 31, 2026</span>. Online registration opens soon.
          </p>
        </div>
      </header>

      {/* Fee cards */}
      <section className="mx-auto max-w-7xl px-5 pb-8 pt-4 lg:px-10">
        <div className="grid gap-6 md:grid-cols-2">
          {TIERS.map((tier) => (
            <div key={tier.category} className="p-glass rounded-3xl p-6 sm:p-8">
              <h2 className="ismc-display text-xl font-semibold text-[var(--p-text)] sm:text-2xl">{tier.category}</h2>

              <div className="mt-6">
                <div className="grid grid-cols-[1fr_auto_auto] items-end gap-x-6 border-b pb-2" style={{ borderColor: 'var(--p-border)' }}>
                  <span />
                  <span className="ismc-mono text-right text-[10px] uppercase tracking-[0.16em] text-[var(--p-text-faint)]">Member</span>
                  <span className="ismc-mono text-right text-[10px] uppercase tracking-[0.16em] text-[var(--p-text-faint)]">Non-member</span>
                </div>

                {tier.rows.map((r) => (
                  <div key={r.period} className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-6 border-b py-4" style={{ borderColor: 'var(--p-border)' }}>
                    <div>
                      <div className="ismc-body text-sm font-semibold text-[var(--p-text)]">{r.period}</div>
                      <div className="ismc-mono mt-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--p-text-faint)]">{r.sub}</div>
                    </div>
                    <div className="ismc-display text-right text-lg font-semibold text-[var(--p-text)]">{inr(r.member)}</div>
                    <div className="ismc-display text-right text-lg font-semibold text-[var(--p-text)]">{inr(r.nonMember)}</div>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <div className="ismc-body text-sm font-semibold text-[var(--p-text)]">Spot registration</div>
                    <div className="ismc-mono mt-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--p-text-faint)]">On-site</div>
                  </div>
                  <div className="ismc-display text-lg font-semibold" style={{ color: 'var(--p-accent-deep)' }}>{inr(tier.spot)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="mt-6 flex flex-col gap-4 rounded-3xl border p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8" style={{ borderColor: 'var(--p-border)', background: 'var(--p-bg-soft)' }}>
          <div>
            <p className="ismc-body text-sm text-[var(--p-text)]">
              <span className="font-semibold">Residential packages</span> (stay + registration) are available on request — discounted rates apply.
            </p>
            <p className="ismc-mono mt-2 text-[11px] uppercase tracking-[0.18em] text-[var(--p-text-faint)]">
              Registration opens soon · Early bird till Jul 31, 2026
            </p>
          </div>
          <Link
            href={ismc.cta.contact}
            className="p-neon group inline-flex shrink-0 items-center gap-2.5 rounded-full px-6 py-3.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
            style={{ background: 'var(--p-accent)', color: '#0a1e40' }}
          >
            Contact for packages
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
