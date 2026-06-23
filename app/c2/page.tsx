'use client';

import { MotionHero } from '@/components/concepts/c2/MotionHero';
import {
  MotionNav,
  MotionPhaseRail,
  MotionStats,
  MotionOrganizers,
  MotionRegister,
  MotionFooter,
} from '@/components/concepts/c2/MotionSections';

export default function ConceptInMotion() {
  return (
    <main className="ismc-body relative overflow-x-hidden bg-[var(--ismc-navy-deep)]">
      <MotionNav />
      <MotionHero />
      <MotionPhaseRail />
      <MotionStats />
      <MotionOrganizers />
      <MotionRegister />
      <MotionFooter />
    </main>
  );
}
