'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useInView,
  useVelocity,
  useSpring,
  useMotionValue,
  useAnimationFrame,
} from 'framer-motion';
import { ArrowUpRight, Download, FileText, MapPin, ArrowUp, CalendarDays, Activity, Users, Award } from 'lucide-react';
import { ismc } from '@/lib/ismc/content';
import { fadeUp, inView, EASE } from './motion';

const wrap = (min: number, max: number, v: number) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

/* Big section title that drifts horizontally with scroll position (reference signature). */
function KineticHeading({ text, className = '' }: { text: string; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const x = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['12%', '-12%']);
  return (
    <div ref={ref} className={`pointer-events-none select-none overflow-hidden ${className}`} aria-hidden="true">
      <motion.div
        style={{ x }}
        className="ismc-display whitespace-nowrap font-bold uppercase leading-none tracking-[-0.02em]"
        // oversized background heading
      >
        <span style={{ fontSize: 'clamp(4rem, 17vw, 15rem)' }}>{text}</span>
      </motion.div>
    </div>
  );
}

/* small helper: image with graceful gradient fallback */
function Photo({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [err, setErr] = useState(false);
  return (
    <div className={`relative overflow-hidden ${className ?? ''}`} style={{ background: 'linear-gradient(160deg, var(--p-bg-soft), color-mix(in srgb, var(--p-subject) 14%, var(--p-bg-soft)))' }}>
      {!err && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onError={() => setErr(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}

function Overline({ children }: { children: React.ReactNode }) {
  return <p className="ismc-mono mb-5 text-[11px] uppercase tracking-[0.3em] text-[var(--p-accent-deep)]">{children}</p>;
}

/* ------------------------------------------------------------- MARQUEE */
export function Marquee() {
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothV = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const vFactor = useTransform(smoothV, [0, 1000], [0, 4], { clamp: false });
  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);
  const dir = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    let moveBy = dir.current * 1.5 * (delta / 1000);
    if (vFactor.get() < 0) dir.current = -1;
    else if (vFactor.get() > 0) dir.current = 1;
    moveBy += dir.current * moveBy * vFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="p-page overflow-hidden border-y py-5" style={{ borderColor: 'var(--p-border)' }}>
      <motion.div style={{ x }} className="p-marquee ismc-display flex w-max items-center whitespace-nowrap text-2xl font-medium tracking-tight text-[var(--p-text)] sm:text-3xl">
        {[0, 1].map((dup) => (
          <span key={dup} className="flex items-center">
            {ismc.marqueeWords.map((w, i) => (
              <span key={i} className="flex items-center">
                <span className="px-6">{w}</span>
                <span className="text-[var(--p-accent)]">✦</span>
              </span>
            ))}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* --------------------------------------------------------- ABOUT + STEPPER */
export function About() {
  const reduce = useReducedMotion();
  const stepRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: stepRef, offset: ['start 80%', 'end 65%'] });
  const fill = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0.02, 1]);

  return (
    <section className="p-page relative overflow-hidden py-24 sm:py-32">
      <KineticHeading
        text="Science · Practice · Performance ·"
        className="absolute -top-3 left-0 right-0 text-[var(--p-text)] opacity-[0.035]"
      />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Overline>{ismc.about.overline}</Overline>
            <motion.h2
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={inView}
              className="ismc-display text-4xl font-semibold leading-[1.02] tracking-[-0.02em] text-[var(--p-text)] sm:text-5xl"
            >
              {ismc.about.heading}
            </motion.h2>
          </div>
          <div className="lg:col-span-6 lg:col-start-7 lg:self-end">
            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={inView}
              className="ismc-body text-xl leading-relaxed sm:text-2xl"
            >
              {ismc.about.body.map((seg, i) => (
                <span key={i} style={{ color: seg.em ? 'var(--p-text)' : 'var(--p-text-faint)' }}>{seg.t}</span>
              ))}
            </motion.p>
          </div>
        </div>

        {/* scroll-scrubbed stepper */}
        <div ref={stepRef} className="mt-20">
          <div className="relative">
            <div className="absolute left-0 right-0 top-[7px] h-px" style={{ background: 'var(--p-border)' }} />
            <motion.div
              className="absolute left-0 top-[7px] h-px w-full origin-left"
              style={{ background: 'var(--p-accent)', scaleX: fill }}
            />
            <div className="relative grid grid-cols-2 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
              {ismc.programStepper.map((s, i) => (
                <motion.div
                  key={s.label}
                  variants={fadeUp}
                  custom={i}
                  initial="hidden"
                  whileInView="show"
                  viewport={inView}
                  className="pr-4"
                >
                  <span className="block h-[15px] w-[15px] rounded-full border-2" style={{ background: 'var(--p-accent)', borderColor: 'var(--p-bg)' }} />
                  <h3 className="ismc-display mt-5 text-lg font-semibold text-[var(--p-text)]">{s.label}</h3>
                  <p className="ismc-body mt-2 text-sm leading-relaxed text-[var(--p-text-muted)]">{s.caption}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- STATS */
function CountUp({ value }: { value: string }) {
  const m = value.match(/^(\+?)(\d+)(.*)$/);
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: '-60px' });
  const [n, setN] = useState(0);
  const target = m ? parseInt(m[2], 10) : 0;
  useEffect(() => {
    if (!m || !seen) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1100);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, target, m]);
  if (!m) return <span ref={ref}>{value}</span>;
  return <span ref={ref}>{m[1]}{n}{m[3]}</span>;
}

export function Stats() {
  return (
    <section className="py-20" style={{ background: 'var(--p-bg-soft)', color: 'var(--p-text)' }}>
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
          {ismc.highlights.map((h, i) => (
            <motion.div key={h.label} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={inView} className="border-t pt-5" style={{ borderColor: 'var(--p-border)' }}>
              <div className="ismc-display text-5xl font-semibold leading-none text-[var(--p-text)] sm:text-6xl">
                <CountUp value={h.stat} />
              </div>
              <div className="ismc-body mt-4 text-sm font-medium">{h.label}</div>
              <div className="ismc-mono mt-1 text-[11px] uppercase tracking-[0.18em] text-[var(--p-text-faint)]">{h.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------- STATS (V4 pastel pills) */
const STAT_PILLS = [
  { icon: CalendarDays, bg: 'rgba(192,160,232,0.62)', dot: '#c4a6ec', w: '78%' },
  { icon: Activity, bg: 'rgba(236,222,120,0.6)', dot: '#ecd86a', w: '92%' },
  { icon: Users, bg: 'rgba(165,222,182,0.62)', dot: '#9fdcab', w: '70%' },
  { icon: Award, bg: 'rgba(160,198,240,0.64)', dot: '#9ec3f5', w: '84%' },
];

export function StatsPills() {
  return (
    <section className="py-20" style={{ background: 'var(--p-bg-soft)', color: 'var(--p-text)' }}>
      <div className="mx-auto max-w-3xl px-5 lg:px-10">
        <Overline>By the numbers</Overline>
        <div className="mt-8 flex flex-col items-center gap-3">
          {ismc.highlights.map((h, i) => {
            const st = STAT_PILLS[i % STAT_PILLS.length];
            const Icon = st.icon;
            return (
              <motion.div
                key={h.label}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={inView}
                className="flex items-center gap-3 rounded-full py-2.5 pl-2.5 pr-6 backdrop-blur-[2px]"
                style={{ width: st.w, maxWidth: '38rem', background: st.bg }}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: st.dot }}>
                  <Icon className="h-4 w-4 text-[#0a1e40]" />
                </span>
                <span className="ismc-display text-xl font-bold text-[var(--p-text)]">{h.stat}</span>
                <span className="ismc-body text-sm font-medium text-[var(--p-text)]">{h.label}</span>
                <span className="ismc-mono ml-auto hidden text-[10px] uppercase tracking-[0.18em] sm:inline" style={{ color: 'var(--p-text)', opacity: 0.55 }}>{h.sub}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- COMMITTEE */
export function Committee() {
  return (
    <section className="p-page relative overflow-hidden py-24 sm:py-32">
      <KineticHeading text="Committee · Faculty · Committee ·" className="absolute top-6 left-0 right-0 text-[var(--p-text)] opacity-[0.04]" />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-10">
        <div className="mb-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Overline>The people behind it</Overline>
            <h2 className="ismc-display text-4xl font-semibold tracking-[-0.02em] text-[var(--p-text)] sm:text-5xl">Organising Committee</h2>
          </div>
          <p className="ismc-body max-w-xs text-sm text-[var(--p-text-muted)]">A faculty drawn from across IASM and TASM, convened in Hyderabad.</p>
        </div>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
          {ismc.committee.map((c, i) => (
            <motion.div key={i} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={inView} className="group">
              <Photo src={c.photo} alt={c.name} className="aspect-[4/5] rounded-2xl" />
              <div className="mt-4">
                <h3 className="ismc-display text-lg font-semibold text-[var(--p-text)]">{c.name}</h3>
                <p className="ismc-body text-sm text-[var(--p-text-muted)]">{c.role}</p>
                <span className="ismc-mono mt-1 inline-block text-[10px] uppercase tracking-[0.2em] text-[var(--p-accent-deep)]">{c.org}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------- VENUE & HOST CITY */
export function VenueCity() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-6%', '6%']);

  return (
    <section className="relative overflow-hidden py-24 sm:py-32" style={{ background: 'var(--p-bg-soft)', color: 'var(--p-text)' }}>
      <KineticHeading text="Hyderabad · Hyderabad ·" className="absolute -bottom-2 left-0 right-0 text-[var(--p-text)] opacity-[0.04]" />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-10">
        <Overline>Venue & host city</Overline>
        <h2 className="ismc-display max-w-2xl text-4xl font-semibold leading-[1.02] tracking-[-0.02em] sm:text-6xl">
          {ismc.hostCity.name}.<span className="text-[var(--p-text-faint)]"> {ismc.hostCity.tagline}.</span>
        </h2>

        <div ref={ref} className="relative mt-12 overflow-hidden rounded-[28px] border" style={{ borderColor: 'var(--p-border)' }}>
          <motion.div style={{ y }} className="relative h-[58vh] min-h-[360px]">
            <Photo src={ismc.hostCity.image} alt={ismc.hostCity.name} className="absolute inset-0 h-[112%]" />
          </motion.div>
          {/* floating glass facts card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE }}
            className="p-glass absolute bottom-5 left-5 right-5 rounded-2xl p-5 sm:left-6 sm:right-auto sm:w-80"
            style={{ color: 'var(--p-text)' }}
          >
            <div className="ismc-mono mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--p-text-muted)]">
              <MapPin className="h-3.5 w-3.5" /> Conference
            </div>
            <dl className="space-y-2">
              {ismc.hostCity.facts.map((f) => (
                <div key={f.k} className="flex items-center justify-between gap-4 text-sm">
                  <dt className="text-[var(--p-text-muted)]">{f.k}</dt>
                  <dd className="ismc-display font-semibold text-[var(--p-text)]">{f.v}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {ismc.hostCity.highlights.map((h, i) => (
            <motion.div key={h.title} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={inView} className="rounded-2xl border p-6" style={{ borderColor: 'var(--p-border)', background: 'var(--p-surface)' }}>
              <h3 className="ismc-display text-lg font-semibold text-[var(--p-text)]">{h.title}</h3>
              <p className="ismc-body mt-2 text-sm leading-relaxed text-[var(--p-text-muted)]">{h.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* landmark gallery */}
        <div className="mt-14">
          <p className="ismc-mono mb-5 text-[11px] uppercase tracking-[0.28em] text-[var(--p-text-faint)]">Around the city</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {ismc.hostCity.landmarks.map((l, i) => (
              <motion.div
                key={l.name}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={inView}
                className="group relative overflow-hidden rounded-xl"
              >
                <Photo src={l.img} alt={l.name} className="aspect-[3/4]" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                <span className="ismc-mono absolute bottom-3 left-3 text-[10px] uppercase tracking-[0.14em] text-white">{l.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- ORGANIZERS */
export function Organizers() {
  return (
    <section className="p-page py-20">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-5 text-center lg:px-10">
        <Overline>Jointly convened by</Overline>
        <div className="flex flex-col items-center gap-10 sm:flex-row sm:gap-16">
          {ismc.organizers.map((o, i) => (
            <div key={o.short} className="flex items-center gap-10 sm:gap-16">
              <div className="flex flex-col items-center">
                <span className="ismc-display text-5xl font-bold tracking-tight text-[var(--p-text)]">{o.short}</span>
                <span className="ismc-body mt-2 max-w-[14rem] text-xs text-[var(--p-text-muted)]">{o.name}</span>
              </div>
              {i === 0 && <span className="ismc-display text-3xl font-bold text-[var(--p-accent)]">×</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- CTA */
export function CtaOutline() {
  const dots = [
    { l: '12%', t: '24%', s: 10, c: 'var(--p-accent)', d: '0s' },
    { l: '84%', t: '30%', s: 7, c: 'var(--p-subject-soft)', d: '1.2s' },
    { l: '20%', t: '72%', s: 8, c: 'var(--p-subject-soft)', d: '0.6s' },
    { l: '90%', t: '68%', s: 11, c: 'var(--p-accent)', d: '1.8s' },
    { l: '50%', t: '14%', s: 6, c: 'var(--p-accent)', d: '2.4s' },
  ];
  return (
    <section className="p-page relative overflow-hidden py-28 sm:py-40">
      <div className="p-hero-mesh pointer-events-none absolute inset-0" aria-hidden="true" />
      {dots.map((d, i) => (
        <span key={i} className="p-float pointer-events-none absolute rounded-full" aria-hidden="true"
          style={{ left: d.l, top: d.t, width: d.s, height: d.s, background: d.c, opacity: 0.5, animationDelay: d.d }} />
      ))}
      <div className="relative mx-auto max-w-7xl px-5 text-center lg:px-10">
        <motion.h2
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
          className="p-grad-text ismc-display font-bold uppercase leading-[0.85] tracking-[-0.01em]"
          style={{ fontSize: 'clamp(3.5rem, 16vw, 14rem)' }}
        >
          Register
        </motion.h2>
        <p className="ismc-body mx-auto mt-6 max-w-md text-lg text-[var(--p-text-muted)]">{ismc.closing}</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href={ismc.cta.register} className="p-pulse group inline-flex items-center gap-2.5 rounded-full px-7 py-4 text-sm font-semibold transition-transform hover:-translate-y-0.5" style={{ background: 'var(--p-accent)' }}>
            <span style={{ color: '#0a1e40' }}>Register now</span>
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: '#0a1e40' }} />
          </Link>
          <Link href={ismc.cta.abstracts} className="inline-flex items-center gap-2 rounded-full border px-6 py-4 text-sm font-medium text-[var(--p-text)] transition-colors hover:bg-[var(--p-glass-border)]" style={{ borderColor: 'var(--p-border)' }}>
            Submit an abstract
          </Link>
        </div>
        <p className="ismc-mono mt-8 text-[11px] uppercase tracking-[0.22em] text-[var(--p-text-faint)]">Conference Secretary — {ismc.registration.secretary}</p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- BROCHURES */
export function Brochures() {
  return (
    <section className="py-24" style={{ background: 'var(--p-bg-soft)', color: 'var(--p-text)' }}>
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <Overline>Downloads</Overline>
        <h2 className="ismc-display mb-12 text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">Brochures & forms</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {ismc.brochures.map((b, i) => (
            <motion.a
              key={b.title}
              href={b.file}
              download
              variants={fadeUp}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={inView}
              className="group flex flex-col justify-between rounded-2xl border p-6 transition-all hover:-translate-y-1"
              style={{ borderColor: 'var(--p-border)', background: 'var(--p-surface)' }}
            >
              <div className="flex items-start justify-between">
                <FileText className="h-7 w-7 text-[var(--p-accent)]" />
                <span className="ismc-mono text-[10px] uppercase tracking-[0.2em] text-[var(--p-text-faint)]">{b.kind}</span>
              </div>
              <div className="mt-10">
                <h3 className="ismc-display text-lg font-semibold text-[var(--p-text)]">{b.title}</h3>
                <p className="ismc-body mt-1 text-sm text-[var(--p-text-muted)]">{b.desc}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--p-accent-deep)]">
                  Download <Download className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- FOOTER */
export function Footer() {
  return (
    <footer className="p-page border-t py-14" style={{ borderColor: 'var(--p-border)' }}>
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <div className="flex flex-col gap-8 pb-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="ismc-display text-2xl font-bold tracking-tight text-[var(--p-text)]">ISMC<span className="text-[var(--p-accent)]">26</span></div>
            <p className="ismc-body mt-4 text-sm leading-relaxed text-[var(--p-text-muted)]">{ismc.name}. {ismc.venue.label}, {ismc.dates.mainShort}.</p>
          </div>
          <div className="ismc-mono grid grid-cols-2 gap-x-12 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-[var(--p-text-muted)] sm:grid-cols-3">
            {ismc.nav.map((n) => (
              <Link key={n.label} href={n.href} className="transition-colors hover:text-[var(--p-accent-deep)]">{n.label}</Link>
            ))}
            <Link href={ismc.cta.login} className="transition-colors hover:text-[var(--p-accent-deep)]">Login</Link>
          </div>
        </div>
        <div className="flex items-center justify-between border-t pt-8" style={{ borderColor: 'var(--p-border)' }}>
          <p className="ismc-mono text-[10px] uppercase tracking-[0.18em] text-[var(--p-text-faint)]">© 2026 ISMC — IASM &amp; TASM</p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="ismc-mono inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--p-text-muted)] transition-colors hover:text-[var(--p-text)]">
            Top <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
