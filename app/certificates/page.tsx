import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Certificates',
  description: 'Download your TGASICON 2026 participation, poster and paper certificates with your registration ID or email.',
}

// Re-export wrapper: Next.js serves pages from the root app/ tree.
export { default } from '@/conference-backend-core/app/certificates/page'
