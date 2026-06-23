import type { Metadata } from 'next';
import { Anton, Hanken_Grotesk, IBM_Plex_Mono } from 'next/font/google';

const display = Anton({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
  display: 'swap',
});

const body = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono-ismc',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Concept 3 — CONVERGENCE',
  description:
    'ISMC 2026 homepage concept 3: science meets sport at a draggable seam. Indian Sports Medicine Conference, Hyderabad, Sep 5–6 2026.',
};

export default function C3Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${display.variable} ${body.variable} ${mono.variable}`}>{children}</div>;
}
