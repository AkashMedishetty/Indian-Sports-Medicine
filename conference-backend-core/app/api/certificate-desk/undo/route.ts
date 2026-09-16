import { NextRequest, NextResponse } from 'next/server'
import { requireDesk } from '@/conference-backend-core/lib/certificate-desk/desk-auth'
import { undoCollection } from '@/conference-backend-core/lib/certificate-desk/service'

export const dynamic = 'force-dynamic'

/**
 * Reverse a hand-over made at THIS desk.
 *
 * Scoped to the calling desk on purpose: one counter cannot quietly undo
 * another's work. Admins undo anything from the admin panel.
 */
export async function POST(request: NextRequest) {
  const auth = await requireDesk(request)
  if (auth.error) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const id = String(body?.id ?? '')
    if (!id) return NextResponse.json({ success: false, message: 'Missing record id' }, { status: 400 })

    const record = await undoCollection(id, `desk:${auth.desk}`, auth.desk)
    if (!record) {
      return NextResponse.json(
        { success: false, message: 'Already undone, or it was recorded at another desk' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, record })
  } catch (error) {
    console.error('[certificate-desk] undo error:', error)
    return NextResponse.json({ success: false, message: 'Undo failed' }, { status: 500 })
  }
}
