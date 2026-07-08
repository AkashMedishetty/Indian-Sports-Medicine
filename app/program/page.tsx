'use client';

// IASMCON 2026 programme isn't published yet — premium "coming soon" page.
// Backend page untouched at conference-backend-core/app/program/page.tsx.
// To re-enable: export { default } from '@/conference-backend-core/app/program/page'

import { ComingSoon } from '@/components/concepts/premium/ComingSoon';

export default function ProgramPage() {
  return (
    <ComingSoon
      kicker="Programme"
      title={<>Schedule<br />coming soon</>}
      blurb="The full scientific programme for IASMCON 2026 — two days of sessions plus the hands-on workshop on the 7th — is being finalised, and will be published here shortly."
    />
  );
}
