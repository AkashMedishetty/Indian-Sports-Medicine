'use client';

// Abstract submission isn't open yet — this route shows a premium "opens soon"
// page. The backend abstracts flow is untouched at
// conference-backend-core/app/abstracts/page.tsx. To re-enable it, restore:
//   import AbstractsPage from '@/conference-backend-core/app/abstracts/page'
//   export default AbstractsPage

import { ComingSoon } from '@/components/concepts/premium/ComingSoon';

export default function AbstractsPage() {
  return (
    <ComingSoon
      kicker="Abstracts"
      title={<>Submissions<br />open soon</>}
      blurb="Abstract submission for TASMC 2026 will open soon. Tracks and guidelines will be announced here — check back, or get in touch to be notified."
    />
  );
}
