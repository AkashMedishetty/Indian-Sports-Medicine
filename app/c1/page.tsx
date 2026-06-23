'use client';

import { VitalsHero } from '@/components/concepts/c1/VitalsHero';
import {
  VitalsNav,
  VitalsTicker,
  VitalsArc,
  VitalsGrid,
  VitalsOrganizers,
  VitalsRegisterBand,
  VitalsFooter,
} from '@/components/concepts/c1/VitalsSections';

export default function ConceptVitals() {
  return (
    <main className="ismc-display relative overflow-x-hidden bg-[var(--ismc-navy-deep)]">
      <VitalsNav />
      <VitalsHero />
      <VitalsTicker />
      <VitalsArc />
      <VitalsGrid />
      <VitalsOrganizers />
      <VitalsRegisterBand />
      <VitalsFooter />
    </main>
  );
}
