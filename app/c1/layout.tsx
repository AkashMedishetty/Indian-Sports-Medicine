import type { Metadata } from 'next';
import { Space_Grotesk, IBM_Plex_Mono } from 'next/font/google';

const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-display',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono-ismc',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Concept 1 — VITALS',
  description:
    'ISMC 2026 homepage concept 1: the conference as a living diagnostic instrument. Indian Sports Medicine Conference, Hyderabad, Sep 5–6 2026.',
};

export default function C1Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${display.variable} ${mono.variable}`}>{children}</div>;
}
