import { NextRequest, NextResponse } from 'next/server'
import { requireDesk } from '@/conference-backend-core/lib/certificate-desk/desk-auth'
import { recentCollections } from '@/conference-backend-core/lib/certificate-desk/service'

export const dynamic = 'force-dynamic'

/**
 * This desk's own recent hand-overs, so an operator can see and undo what they
 * just did after a page reload. Restricted to the calling desk: the full
 * cross-desk roster carries delegate emails and stays admin-only.
 */
export async function GET(request: NextRequest) {
  const auth = await requireDesk(request)
  if (auth.error) return auth.error

  try {
    const limit = Number(new URL(request.url).searchParams.get('limit')) || 30
    const records = await recentCollections({ deskName: auth.desk, limit })
    return NextResponse.json({ success: true, records }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[certificate-desk] recent error:', error)
    return NextResponse.json({ success: false, message: 'Could not load recent scans' }, { status: 500 })
  }
}
