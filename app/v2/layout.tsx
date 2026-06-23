import type { Metadata } from 'next';
import { premiumFontVars } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'Variation 2 — Image',
  description:
    'ISMC 2026 homepage — image variation. Indian Sports Medicine Conference, Hyderabad, Sep 5–6 2026.',
};

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return <div className={premiumFontVars}>{children}</div>;
}
