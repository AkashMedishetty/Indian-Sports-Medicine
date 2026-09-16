import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/conference-backend-core/lib/middleware/rateLimiter'
import { lookupCertificates } from '@/conference-backend-core/lib/certificates/public-certificates'

export const dynamic = 'force-dynamic'

/**
 * Public: find a delegate's certificates by registration ID or email. No login,
 * by design. Returns short-lived signed download links, never the email address.
 * POST keeps the ID and email out of URLs and access logs.
 */
export async function POST(request: NextRequest) {
  const limit = await rateLimit(request, { windowMs: 10 * 60 * 1000, max: 40 })
  if (!limit.success) {
    return NextResponse.json(
      { success: false, message: 'Too many searches. Please wait a few minutes and try again.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter ?? 60) } }
    )
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 })
  }

  try {
    const result = await lookupCertificates(typeof body?.query === 'string' ? body.query : '')
    if (!result.ok) return NextResponse.json({ success: false, message: result.message }, { status: result.status })
    const { ok: _ok, ...data } = result
    return NextResponse.json({ success: true, data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Public certificate lookup error:', error)
    return NextResponse.json({ success: false, message: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
