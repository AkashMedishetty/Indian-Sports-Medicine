'use client';

// TASMC 2026 programme isn't published yet — this route shows a premium
// "coming soon" page. The backend program-schedule page is untouched at
// conference-backend-core/app/program-schedule/page.tsx. To re-enable it:
//   export { default } from '@/conference-backend-core/app/program-schedule/page'

import { ComingSoon } from '@/components/concepts/premium/ComingSoon';

export default function ProgramSchedulePage() {
  return (
    <ComingSoon
      kicker="Programme"
      title={<>Schedule<br />coming soon</>}
      blurb="The full scientific programme for TASMC 2026 — two days of sessions plus the hands-on workshop on the 7th — is being finalised, and will be published here shortly."
    />
  );
}
