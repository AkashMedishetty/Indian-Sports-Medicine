import { NextRequest, NextResponse } from 'next/server'
import { requireDesk } from '@/conference-backend-core/lib/certificate-desk/desk-auth'
import { getStats } from '@/conference-backend-core/lib/certificate-desk/service'

export const dynamic = 'force-dynamic'

/**
 * Live counts across every desk. Polled by each scanner every few seconds —
 * which also keeps the serverless instance warm for the scan route.
 *
 * Counts only; no delegate names or emails, so a desk token is enough.
 */
export async function GET(request: NextRequest) {
  const auth = await requireDesk(request)
  if (auth.error) return auth.error

  try {
    const stats = await getStats()
    return NextResponse.json(
      { success: true, deskName: auth.desk, stats },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('[certificate-desk] stats error:', error)
    return NextResponse.json({ success: false, message: 'Could not load counts' }, { status: 500 })
  }
}
