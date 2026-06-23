'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ismc } from '@/lib/ismc/content';
import { ThemeToggle } from './ThemeToggle';

/** Floating, theme-aware pill navbar. Condenses slightly on scroll. */
export function PillNav({ base = '/v1' }: { base?: string }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:pt-4">
      <nav
        className={`p-glass flex items-center gap-1.5 rounded-full pl-4 pr-1.5 transition-all duration-300 ${
          scrolled ? 'py-1.5 shadow-[var(--p-shadow)]' : 'py-2'
        }`}
        style={{ color: 'var(--p-text)' }}
      >
        <Link href={base} className="ismc-display mr-1.5 text-sm font-bold tracking-tight">
          ISMC<span style={{ color: 'var(--p-accent)' }}>26</span>
        </Link>
        <div className="ismc-mono hidden items-center md:flex">
          {ismc.nav.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className="rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-[var(--p-text-muted)] transition-colors hover:bg-[var(--p-glass-border)] hover:text-[var(--p-text)]"
            >
              {n.label}
            </Link>
          ))}
        </div>
        <ThemeToggle className="ml-0.5" />
        <Link
          href={ismc.cta.register}
          className="p-neon rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0a1e40] transition-transform hover:-translate-y-px"
          style={{ background: 'var(--p-accent)' }}
        >
          Register
        </Link>
      </nav>
    </div>
  );
}
