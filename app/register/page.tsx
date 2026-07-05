'use client';

// Registration is not open yet — this route shows a premium "opens soon" page.
// The full backend registration flow is untouched at
// conference-backend-core/app/register/page.tsx. To re-enable it, restore:
//   import RegisterPage from '@/conference-backend-core/app/register/page'
//   export default RegisterPage

import { ComingSoon } from '@/components/concepts/premium/ComingSoon';
import { ismc } from '@/lib/ismc/content';

export default function RegisterPage() {
  return (
    <ComingSoon
      kicker="Registration"
      title={<>Registrations<br />open soon</>}
      blurb={`Registration for the ${ismc.name} isn't open just yet. Check back shortly, or drop us a line and we'll let you know the moment it goes live.`}
    />
  );
}
