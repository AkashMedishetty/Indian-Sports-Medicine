'use client';

import { SmoothScroll } from './SmoothScroll';
import { PillNav } from './PillNav';
import { Hero } from './Hero';
import {
  Marquee,
  About,
  Stats,
  StatsPills,
  Committee,
  VenueCity,
  Organizers,
  CtaOutline,
  Brochures,
  Footer,
} from './Sections';

/** Shared premium page. Variations differ in the hero `subject`, or pass a fully
 *  custom `hero` (e.g. the V4 mesh hero). `v4` applies the mesh's pastel-pill
 *  styling to the stats section (without repainting the whole page). */
export function PremiumPage({
  base,
  subject,
  hero,
  v4 = false,
}: {
  base: string;
  subject?: React.ReactNode;
  hero?: React.ReactNode;
  v4?: boolean;
}) {
  return (
    <main className="ismc-body p-page relative overflow-x-hidden">
      <SmoothScroll />
      <PillNav base={base} />
      {hero ?? <Hero subject={subject} />}
      <Marquee />
      <About />
      {v4 ? <StatsPills /> : <Stats />}
      <Committee />
      <VenueCity />
      <Organizers />
      <CtaOutline />
      <Brochures />
      <Footer />
    </main>
  );
}
