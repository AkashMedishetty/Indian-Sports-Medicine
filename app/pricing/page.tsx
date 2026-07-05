'use client';

// Registration-fees page — reuses the shared premium Fees section (tariff data
// lives in lib/ismc/content.ts). Backend pricing page untouched at
// conference-backend-core/app/pricing/page.tsx.

import { SmoothScroll } from '@/components/concepts/premium/SmoothScroll';
import { Navigation } from '@/conference-backend-core/components/Navigation';
import { Fees, Footer } from '@/components/concepts/premium/Sections';

export default function PricingPage() {
  return (
    <main className="ismc-body p-page relative min-h-screen overflow-x-hidden">
      <SmoothScroll />
      <Navigation />
      <div className="pt-6" />
      <Fees />
      <Footer />
    </main>
  );
}
