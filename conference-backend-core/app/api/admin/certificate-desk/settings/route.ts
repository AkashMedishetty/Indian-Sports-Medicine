import { NextRequest, NextResponse } from 'next/server'
import { requireCertificateStaff } from '@/conference-backend-core/lib/certificates/auth'
import {
  getDeskSettings,
  rotateDeskCode,
  setDeskEnabled,
} from '@/conference-backend-core/lib/certificate-desk/desk-auth'
import { getStats, recentCollections } from '@/conference-backend-core/lib/certificate-desk/service'

export const dynamic = 'force-dynamic'

/** Desk state for the admin panel: code metadata, live counts, cross-desk feed. */
export async function GET() {
  const auth = await requireCertificateStaff()
  if (auth.error) return auth.error

  try {
    const [settings, stats, recent] = await Promise.all([
      getDeskSettings(true),
      getStats(),
      recentCollections({ limit: 100, includeUndone: true }),
    ])
    return NextResponse.json({
      success: true,
      settings: {
        // The code itself is stored hashed and is never recoverable — only the
        // last two characters, so an admin can tell two codes apart.
        hasCode: Boolean(settings?.codeHash),
        codeHint: settings?.codeHint ?? '',
        codeVersion: settings?.codeVersion ?? 0,
        enabled: settings?.enabled !== false,
        rotatedAt: settings?.rotatedAt ?? null,
        rotatedBy: settings?.rotatedBy ?? '',
      },
      stats,
      recent,
    })
  } catch (error) {
    console.error('[certificate-desk] admin settings error:', error)
    return NextResponse.json({ success: false, message: 'Could not load desk settings' }, { status: 500 })
  }
}

/** Rotate the code, or enable/disable desk scanning. */
export async function POST(request: NextRequest) {
  const auth = await requireCertificateStaff()
  if (auth.error) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const action = String(body?.action ?? '')

    if (action === 'rotate') {
      const code = await rotateDeskCode(auth.user.email)
      // Returned exactly once. Rotating invalidates every open desk session,
      // because the version baked into their tokens no longer matches.
      return NextResponse.json({
        success: true,
        code,
        message: 'New code generated. Every open desk must enter it again.',
      })
    }

    if (action === 'enable' || action === 'disable') {
      await setDeskEnabled(action === 'enable')
      return NextResponse.json({ success: true, enabled: action === 'enable' })
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('[certificate-desk] admin action error:', error)
    return NextResponse.json({ success: false, message: 'Action failed' }, { status: 500 })
  }
}
