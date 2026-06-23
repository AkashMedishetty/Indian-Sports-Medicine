import type { Metadata } from 'next';
import { Archivo, Fraunces, Hanken_Grotesk, IBM_Plex_Mono } from 'next/font/google';

const display = Archivo({
  subsets: ['latin'],
  weight: ['600', '800', '900'],
  variable: '--font-display',
  display: 'swap',
});

const serif = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['italic', 'normal'],
  variable: '--font-serif-ismc',
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
  title: 'Concept 2 — IN MOTION (Editorial)',
  description:
    'ISMC 2026 homepage concept 2: a bold editorial poster. Indian Sports Medicine Conference, Hyderabad, Sep 5–6 2026.',
};

export default function C2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${serif.variable} ${body.variable} ${mono.variable}`}>
      {children}
    </div>
  );
}
