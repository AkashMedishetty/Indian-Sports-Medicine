import Link from 'next/link';
import { ismc } from '@/lib/ismc/content';

const variations = [
  {
    href: '/v1',
    n: '01',
    name: 'Point cloud',
    kind: 'WebGL particle athlete',
    desc: 'A running figure built from fine points — navy on white, white on near-black — with orange joints, slow rotation and an assemble-on-load. GLB-ready for your 3D model.',
    motif: 'cloud',
  },
  {
    href: '/v2',
    n: '02',
    name: 'Image',
    kind: 'Athlete + data hotspots',
    desc: 'ai.io style — a treated athlete photo with joint hotspots, connector lines and live stat readouts. Drop your photography in and it sings.',
    motif: 'image',
  },
  {
    href: '/v3',
    n: '03',
    name: 'Vector outline',
    kind: 'Low-poly wireframe',
    desc: 'A line-art wireframe runner that draws itself on. Lightest of the set, theme-agnostic, no WebGL.',
    motif: 'vector',
  },
  {
    href: '/v4',
    n: '04',
    name: 'Mesh',
    kind: 'Gradient mesh + stat pills',
    desc: 'A bold gradient-mesh hero — the athlete runs over horizontal stat pills, Hyderabad highlighted. Energetic and editorial.',
    motif: 'mesh',
  },
];

function Motif({ kind }: { kind: string }) {
  if (kind === 'cloud') {
    return (
      <div className="flex h-10 items-center gap-[3px]" aria-hidden="true">
        {Array.from({ length: 26 }).map((_, i) => (
          <span key={i} className="rounded-full" style={{ width: 3, height: 3 + (i % 5) * 2, background: i % 7 === 0 ? 'var(--p-accent)' : 'var(--p-text-faint)' }} />
        ))}
      </div>
    );
  }
  if (kind === 'image') {
    return (
      <svg viewBox="0 0 200 40" className="h-10 w-full" fill="none" aria-hidden="true">
        <line x1="20" y1="30" x2="70" y2="14" stroke="var(--p-text-faint)" strokeWidth="1" />
        <line x1="70" y1="14" x2="120" y2="26" stroke="var(--p-text-faint)" strokeWidth="1" />
        <line x1="120" y1="26" x2="170" y2="10" stroke="var(--p-text-faint)" strokeWidth="1" />
        {[[20, 30], [70, 14], [120, 26], [170, 10]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4" fill="var(--p-accent)" />
        ))}
      </svg>
    );
  }
  if (kind === 'mesh') {
    return (
      <div className="flex h-10 flex-col justify-center gap-1.5" aria-hidden="true">
        <span className="h-2 rounded-full" style={{ width: '70%', background: 'var(--p-accent)', opacity: 0.55 }} />
        <span className="h-2 rounded-full" style={{ width: '88%', background: 'var(--p-text-faint)' }} />
        <span className="h-2 rounded-full" style={{ width: '54%', background: 'var(--p-accent-deep)', opacity: 0.55 }} />
      </div>
    );
  }
  return (
    <svg viewBox="0 0 200 40" className="h-10 w-full" fill="none" aria-hidden="true">
      <polyline points="20,34 50,12 90,30 130,8 170,28" stroke="var(--p-text)" strokeWidth="1.5" />
      {[[20, 34], [50, 12], [90, 30], [130, 8], [170, 28]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill="var(--p-accent)" />
      ))}
    </svg>
  );
}

export default function ConceptChooser() {
  return (
    <main className="p-page min-h-[100svh]">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:px-10">
        <header className="mb-14 flex flex-col gap-4 border-b pb-10" style={{ borderColor: 'var(--p-border)' }}>
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--p-accent-deep)]">
            ISMC 2026 · Design Review
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--p-text)] sm:text-6xl">Choose a direction.</h1>
          <p className="max-w-xl text-[var(--p-text-muted)]">
            Four premium variations for the {ismc.name} — one shared scroll, sections and motion
            system; only the hero differs. Each has a light/dark toggle in the nav.
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--p-text-faint)]">
            {ismc.dates.mainShort} · {ismc.venue.label} · Workshop Sep 7
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {variations.map((v) => (
            <Link
              key={v.href}
              href={v.href}
              className="group flex flex-col justify-between rounded-2xl border p-7 transition-all duration-300 hover:-translate-y-1"
              style={{ borderColor: 'var(--p-border)', background: 'var(--p-surface)' }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-[var(--p-text-faint)]">{v.n}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--p-accent-deep)]">{v.kind}</span>
                </div>
                <h2 className="mt-5 text-2xl font-bold tracking-tight text-[var(--p-text)]">{v.name}</h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--p-text-muted)]">{v.desc}</p>
              </div>
              <div className="mt-8">
                <Motif kind={v.motif} />
                <span className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--p-text-muted)] transition-colors group-hover:text-[var(--p-text)]">
                  Open variation
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-12 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--p-text-faint)]">
          Backend wired · registration, workshops, abstracts, admin &amp; reviewer portal configured for ISMC 2026.
        </p>
      </div>
    </main>
  );
}
