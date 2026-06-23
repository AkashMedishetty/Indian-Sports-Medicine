import type { Metadata } from 'next';
import { premiumFontVars } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'Variation 1 — Point Cloud',
  description:
    'ISMC 2026 homepage — point-cloud variation. Indian Sports Medicine Conference, Hyderabad, Sep 5–6 2026.',
};

export default function V1Layout({ children }: { children: React.ReactNode }) {
  return <div className={premiumFontVars}>{children}</div>;
}
