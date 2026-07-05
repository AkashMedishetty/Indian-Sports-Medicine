'use client';

import { PremiumPage } from '@/components/concepts/premium/PremiumPage';
import { HeroSubjectPointCloud } from '@/components/concepts/premium/HeroSubjectPointCloud';

export default function Home() {
  return <PremiumPage base="/" subject={<HeroSubjectPointCloud />} />;
}
