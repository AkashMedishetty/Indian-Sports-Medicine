// Abstract submission is live — this re-exports the backend abstracts flow at
// conference-backend-core/app/abstracts/page.tsx.
// To show a "coming soon" placeholder again, restore:
//   'use client'
//   import { ComingSoon } from '@/components/concepts/premium/ComingSoon'
//   export default function AbstractsPage() { return <ComingSoon kicker="Abstracts" ... /> }
import AbstractsPage from '@/conference-backend-core/app/abstracts/page'

export default AbstractsPage
