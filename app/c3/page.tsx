'use client';

import { ConvergenceHero } from '@/components/concepts/c3/ConvergenceHero';
import {
  ConvergenceNav,
  ConvergeStatement,
  ConvergeStats,
  ConvergeRegister,
  ConvergeFooter,
} from '@/components/concepts/c3/ConvergenceSections';

export default function ConceptConvergence() {
  return (
    <main className="ismc-body relative overflow-x-hidden bg-[var(--ismc-navy-deep)]">
      <ConvergenceNav />
      <ConvergenceHero />
      <ConvergeStatement />
      <ConvergeStats />
      <ConvergeRegister />
      <ConvergeFooter />
    </main>
  );
}
