import { Schibsted_Grotesk, Hanken_Grotesk, IBM_Plex_Mono } from 'next/font/google';

// Premium type system (shared by /v1 /v2 /v3): refined grotesque display +
// clean grotesque body + mono for micro-labels. Mapped onto the .ismc-* classes.
export const display = Schibsted_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

export const body = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

export const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono-ismc',
  display: 'swap',
});

export const premiumFontVars = `${display.variable} ${body.variable} ${mono.variable}`;
