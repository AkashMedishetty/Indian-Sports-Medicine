import { NextRequest, NextResponse } from 'next/server'
import { verifyDeskCode, signDeskToken } from '@/conference-backend-core/lib/certificate-desk/desk-auth'

export const dynamic = 'force-dynamic'

/**
 * Join a desk: exchange the shared access code for a signed desk token.
 *
 * Public by design — volunteers have no admin account. The code is the only
 * secret, so a wrong code is rate-limited per IP inside verifyDeskCode.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const code = String(body?.code ?? '')
    const deskName = String(body?.deskName ?? '').trim().slice(0, 40)

    if (!code) return NextResponse.json({ success: false, message: 'Enter the desk code' }, { status: 400 })
    if (!deskName) return NextResponse.json({ success: false, message: 'Name this desk (e.g. "Participation 1")' }, { status: 400 })

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    const check = await verifyDeskCode(code, ip)
    if (!check.ok) return NextResponse.json({ success: false, message: check.message }, { status: 401 })

    return NextResponse.json({
      success: true,
      token: signDeskToken(deskName, check.version),
      deskName,
    })
  } catch (error) {
    console.error('[certificate-desk] session error:', error)
    return NextResponse.json({ success: false, message: 'Could not start the desk session' }, { status: 500 })
  }
}
