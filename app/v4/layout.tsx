import type { Metadata } from 'next';
import { premiumFontVars } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'Variation 4 — Mesh',
  description:
    'ISMC 2026 homepage — gradient-mesh variation. Indian Sports Medicine Conference, Hyderabad, Sep 5–6 2026.',
};

export default function V4Layout({ children }: { children: React.ReactNode }) {
  return <div className={premiumFontVars}>{children}</div>;
}
