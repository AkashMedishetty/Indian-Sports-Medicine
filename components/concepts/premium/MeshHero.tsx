'use client';

import Link from 'next/link';
import { Activity, Users, CalendarDays, Award, MapPin, ArrowRight } from 'lucide-react';
import { ismc } from '@/lib/ismc/content';

// Cascading pastel stat pills (indented right, extend under the athlete).
const PILLS = [
  { icon: Activity, label: 'Sessions', value: '40+', bg: 'rgba(192,160,232,0.62)', dot: '#c4a6ec', ml: '34%' },
  { icon: Users, label: 'Faculty', value: '30+', bg: 'rgba(236,222,120,0.6)', dot: '#ecd86a', ml: '24%' },
  { icon: CalendarDays, label: 'Workshop', value: 'Sep 7', bg: 'rgba(165,222,182,0.62)', dot: '#9fdcab', ml: '42%' },
  { icon: Award, label: 'CME', value: 'Accredited', bg: 'rgba(160,198,240,0.64)', dot: '#9ec3f5', ml: '14%' },
];

export function MeshHero() {
  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden">
      <div className="v4-mesh absolute inset-0" aria-hidden="true" />
      <div className="v4-streaks absolute inset-0 opacity-60" aria-hidden="true" />

      {/* athlete — transparent color cut-out, flipped, over the pills */}
      <div className="absolute bottom-0 right-[-3%] z-20 h-[66%] w-[88%] sm:right-0 sm:w-[62%] lg:h-[86%] lg:w-[54%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ismc/athletes/v4.png"
          alt="Athlete"
          className="absolute inset-0 h-full w-full object-contain object-bottom"
          style={{ transform: 'scaleX(-1)' }}
        />
      </div>

      {/* cascading pastel stat pills */}
      <div className="absolute inset-x-0 bottom-[9%] z-10 mx-auto max-w-7xl px-5 lg:px-10">
        <div className="flex flex-col gap-2.5">
          {PILLS.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={p.label}
                className="p-fade-up flex items-center gap-3 rounded-full py-2 pl-2 pr-6 backdrop-blur-[2px]"
                style={{ marginLeft: p.ml, marginRight: '-10%', background: p.bg, animationDelay: `${0.7 + i * 0.1}s` }}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: p.dot }}>
                  <Icon className="h-4 w-4 text-[#0a1e40]" />
                </span>
                <span className="ismc-body text-sm font-medium text-[var(--p-text)]">{p.label}</span>
                <span className="ismc-display ml-1 text-sm font-bold text-[var(--p-text)]">{p.value}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* copy — upper-left, constrained so it never meets the pills */}
      <div className="absolute left-0 top-[15%] z-30 mx-auto w-full max-w-7xl px-5 lg:top-[14%] lg:px-10">
        <div className="max-w-md lg:max-w-[46%]">
          <p className="p-fade-up ismc-mono mb-4 text-[11px] uppercase tracking-[0.28em] text-[var(--p-text-muted)]" style={{ animationDelay: '0.05s' }}>
            Uniting science, practice &amp; performance
          </p>

          <Link
            href={ismc.cta.register}
            className="p-neon p-fade-up mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-[#0a1e40]"
            style={{ background: 'var(--p-accent)', animationDelay: '0.12s' }}
          >
            <MapPin className="h-3.5 w-3.5" /> Hyderabad · Sep 5–6, 2026
          </Link>

          <h1 className="ismc-display font-bold leading-[0.92] tracking-[-0.03em] text-[var(--p-text)]" style={{ fontSize: 'clamp(2.3rem, 5.2vw, 4.4rem)' }}>
            <span className="p-fade-up block" style={{ animationDelay: '0.2s' }}>Indian Sports</span>
            <span className="p-fade-up block" style={{ animationDelay: '0.3s' }}>Medicine</span>
            <span className="p-fade-up block" style={{ animationDelay: '0.4s' }}>Conference 2026</span>
          </h1>

          <p className="p-fade-up mt-5 max-w-sm text-base leading-relaxed text-[var(--p-text-muted)]" style={{ animationDelay: '0.45s' }}>
            Two days uniting sports physicians, surgeons and physiotherapists — diagnosis to
            return-to-play — with a hands-on workshop on the 7th.
          </p>

          <div className="p-fade-up mt-7 flex flex-wrap items-center gap-3" style={{ animationDelay: '0.55s' }}>
            <Link
              href={ismc.cta.register}
              className="group inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-semibold tracking-tight transition-transform duration-300 hover:-translate-y-0.5"
              style={{ background: 'var(--p-text)', color: 'var(--p-bg)' }}
            >
              Register now
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href={ismc.cta.program}
              className="rounded-full border px-5 py-3.5 text-sm font-medium text-[var(--p-text)] transition-colors hover:bg-[var(--p-glass-border)]"
              style={{ borderColor: 'var(--p-border)' }}
            >
              View programme
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
