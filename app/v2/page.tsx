'use client';

import { PremiumPage } from '@/components/concepts/premium/PremiumPage';
import { HeroSubjectImage } from '@/components/concepts/premium/HeroSubjectImage';

export default function V2() {
  return <PremiumPage base="/v2" subject={<HeroSubjectImage />} />;
}
