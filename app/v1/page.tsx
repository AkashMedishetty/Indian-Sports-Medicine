'use client';

import { PremiumPage } from '@/components/concepts/premium/PremiumPage';
import { HeroSubjectPointCloud } from '@/components/concepts/premium/HeroSubjectPointCloud';

export default function V1() {
  return <PremiumPage base="/v1" subject={<HeroSubjectPointCloud />} />;
}
