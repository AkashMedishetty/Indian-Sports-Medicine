'use client';

import { PremiumPage } from '@/components/concepts/premium/PremiumPage';
import { HeroSubjectVector } from '@/components/concepts/premium/HeroSubjectVector';

export default function V3() {
  return <PremiumPage base="/v3" subject={<HeroSubjectVector />} />;
}
