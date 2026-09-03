'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download, MapPin, ArrowRight } from 'lucide-react';
import { SmoothScroll } from './SmoothScroll';
import { Navigation } from '@/conference-backend-core/components/Navigation';
import { Footer } from './Sections';
import { programme, type ProgRow } from '@/lib/ismc/programme';
import { ismc } from '@/lib/ismc/content';

const CONF_VENUE = 'Trident Hotel, Hyderabad';

function Row({ row }: { row: ProgRow }) {
  if ('chairs' in row) {
    return (
      <div className="ismc-mono px-4 py-2 text-[11px] uppercase tracking-[0.12em] text-[var(--p-text-muted)]"
        style={{ background: 'var(--p-glass)', borderTop: '1px solid var(--p-hairline)', borderBottom: '1px solid var(--p-hairline)' }}>
        Chairpersons · <span className="text-[var(--p-text)]">{row.chairs}</span>
      </div>
    );
  }
  if ('brk' in row) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5">
        <span className="h-px flex-1" style={{ background: 'var(--p-hairline)' }} />
        <span className="ismc-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--p-text-faint)]">{row.brk}</span>
        <span className="h-px flex-1" style={{ background: 'var(--p-hairline)' }} />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-0.5 px-4 py-3 sm:grid-cols-[104px_1fr]"
      style={{ borderTop: '1px solid var(--p-hairline)' }}>
      <div className="ismc-mono pt-0.5 text-[12px] font-medium tracking-tight text-[var(--p-accent-deep)]">{row.time}</div>
      <div>
        <p className="text-[14.5px] leading-snug text-[var(--p-text)]">{row.topic}</p>
        {row.faculty && <p className="mt-0.5 text-[13px] text-[var(--p-text-muted)]">{row.faculty}</p>}
      </div>
    </div>
  );
}

export function Programme() {
  const [d, setD] = useState(0);
  const [h, setH] = useState(0);
  const day = programme[d];
  const hall = day.halls[Math.min(h, day.halls.length - 1)];
  const pick = (i: number) => { setD(i); setH(0); };

  return (
    <main className="ismc-body p-page relative min-h-screen overflow-x-hidden">
      <SmoothScroll />
      <Navigation />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="p-hero-mesh pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-5xl px-5 pb-8 pt-28 text-center lg:px-10 lg:pt-32">
          <span className="ismc-mono inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[var(--p-text-muted)]"
            style={{ borderColor: 'var(--p-border)' }}>
            Scientific Programme
          </span>
          <h1 className="ismc-display mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-[-0.025em] text-[var(--p-text)] sm:text-6xl">
            The full agenda
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-[var(--p-text-muted)]">
            A pre-conference hands-on workshop on 4 September, then two days of parallel sessions across two halls
            on 5–6 September 2026 — ACL, shoulder, lower limb, sports nutrition, physiotherapy, regenerative medicine and more.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a href="/brochures/iasmcon-2026-programme.pdf" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium text-white transition-transform hover:-translate-y-0.5"
              style={{ background: 'var(--p-subject)' }}>
              <Download className="h-4 w-4" /> Download programme (PDF)
            </a>
            <Link href={ismc.cta.register}
              className="inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-[13px] font-medium text-[var(--p-text)] transition-colors hover:border-[var(--p-accent)]"
              style={{ borderColor: 'var(--p-border)' }}>
              Register <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Day selector */}
      <div className="sticky top-16 z-30 -mb-px" style={{ background: 'var(--p-glass)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--p-hairline)' }}>
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-5 py-3 lg:px-10">
          {programme.map((dy, i) => {
            const active = i === d;
            return (
              <button key={dy.id} onClick={() => pick(i)}
                className="shrink-0 rounded-full border px-4 py-2 text-left transition-colors"
                style={{
                  borderColor: active ? 'transparent' : 'var(--p-border)',
                  background: active ? 'var(--p-accent)' : 'transparent',
                  color: active ? '#1a1206' : 'var(--p-text-muted)',
                }}>
                <span className="ismc-mono block text-[12px] font-semibold uppercase tracking-[0.12em]">{dy.label}</span>
                <span className="block text-[11px]" style={{ opacity: active ? 0.8 : 0.75 }}>{dy.date.replace(' 2026', '')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day content */}
      <section className="mx-auto w-full max-w-5xl px-5 py-10 lg:px-10">
        <div className="mb-6">
          <div className="ismc-mono text-[11px] uppercase tracking-[0.18em] text-[var(--p-accent-deep)]">{day.kind}</div>
          <h2 className="ismc-display mt-1 text-2xl font-semibold tracking-tight text-[var(--p-text)] sm:text-3xl">{day.date}</h2>
          <div className="mt-2 flex items-center gap-1.5 text-[13px] text-[var(--p-text-muted)]">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{day.venue || CONF_VENUE}</span>
          </div>
        </div>

        {/* Hall tabs (only when a day has more than one hall) */}
        {day.halls.length > 1 && (
          <div className="mb-6 inline-flex rounded-full border p-1" style={{ borderColor: 'var(--p-border)' }}>
            {day.halls.map((hl, i) => {
              const active = i === Math.min(h, day.halls.length - 1);
              return (
                <button key={hl.name} onClick={() => setH(i)}
                  className="rounded-full px-4 py-1.5 text-[12.5px] font-medium transition-colors"
                  style={{ background: active ? 'var(--p-subject)' : 'transparent', color: active ? '#fff' : 'var(--p-text-muted)' }}>
                  {hl.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Sessions */}
        <div className="space-y-5">
          {hall.sessions.map((s, si) => (
            <div key={si} className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--p-border)', background: 'var(--p-surface)', boxShadow: 'var(--p-shadow)' }}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3.5"
                style={{ background: 'var(--p-bg-soft)', borderBottom: '1px solid var(--p-hairline)' }}>
                <h3 className="ismc-display text-[17px] font-semibold tracking-tight text-[var(--p-text)]">{s.theme}</h3>
                <span className="ismc-mono text-[12px] font-medium text-[var(--p-text-muted)]">{s.time}</span>
              </div>
              <div>
                {s.rows.map((r, ri) => <Row key={ri} row={r} />)}
              </div>
            </div>
          ))}
          {hall.note && (
            <div className="rounded-xl border px-4 py-3 text-center text-[12.5px] text-[var(--p-text-muted)]"
              style={{ borderColor: 'var(--p-border)', borderStyle: 'dashed' }}>
              {hall.note}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
