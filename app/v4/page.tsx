'use client';

import { PremiumPage } from '@/components/concepts/premium/PremiumPage';
import { MeshHero } from '@/components/concepts/premium/MeshHero';

export default function V4() {
  return <PremiumPage base="/v4" hero={<MeshHero />} v4 />;
}
