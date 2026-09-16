import { NextRequest, NextResponse } from 'next/server'
import { requireDesk } from '@/conference-backend-core/lib/certificate-desk/desk-auth'
import { scan } from '@/conference-backend-core/lib/certificate-desk/service'
import { CERT_TYPES, type CertType } from '@/conference-backend-core/lib/certificate-desk/types'

export const dynamic = 'force-dynamic'

/**
 * Record one certificate hand-over.
 *
 * Deliberately lean: only the models and the parser are imported, so a cold
 * serverless start stays fast while desks are scanning back to back.
 *
 * The desk name comes from the SIGNED TOKEN, never from the request body, so a
 * desk cannot attribute its scans to another counter.
 */
export async function POST(request: NextRequest) {
  const auth = await requireDesk(request)
  if (auth.error) return auth.error

  try {
    const body = await request.json().catch(() => ({}))
    const type = String(body?.type ?? '') as CertType
    if (!CERT_TYPES.includes(type)) {
      return NextResponse.json({ success: false, message: 'Pick a certificate type' }, { status: 400 })
    }

    const result = await scan({
      type,
      deskName: auth.desk,
      raw: typeof body?.raw === 'string' ? body.raw : undefined,
      userId: typeof body?.userId === 'string' ? body.userId : undefined,
      abstractId: typeof body?.abstractId === 'string' ? body.abstractId : undefined,
      override: body?.override === true,
      overrideReason: typeof body?.overrideReason === 'string' ? body.overrideReason : undefined,
    })

    // Always HTTP 200: every outcome is a normal desk situation, and the client
    // switches on result.outcome. Reserving non-2xx for real faults keeps the
    // scanner's error handling from treating "already collected" as a failure.
    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('[certificate-desk] scan error:', error)
    return NextResponse.json({ success: false, message: 'Scan failed — try again' }, { status: 500 })
  }
}
