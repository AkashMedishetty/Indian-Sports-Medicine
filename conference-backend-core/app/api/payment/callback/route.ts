import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * HDFC Bank Collect Now (Razorpay white-label) payment callback.
 *
 * The in-page Checkout handler flow posts to /api/payment/verify directly.
 * This endpoint covers the REDIRECT ("callback_url") model — where Razorpay
 * auto-submits the payment result here as a form POST — and is the URL that
 * was registered with HDFC (https://tasm2026.com/api/payment/callback).
 *
 * It verifies the signature, marks the payment via the existing /verify route
 * (single source of truth), then redirects the browser to a success/failure page.
 * To actually route the gateway through here, Checkout must be opened with
 * `callback_url` instead of a `handler` — a small frontend change to make only
 * if HDFC's integration guide requires the redirect model.
 */
export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin

  // Razorpay posts application/x-www-form-urlencoded; accept JSON too.
  let params: Record<string, string> = {}
  try {
    const ct = request.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      params = await request.json()
    } else {
      const form = await request.formData()
      for (const [k, v] of form.entries()) params[k] = String(v)
    }
  } catch {
    params = {}
  }

  const razorpay_payment_id = params['razorpay_payment_id']
  const razorpay_order_id = params['razorpay_order_id']
  const razorpay_signature = params['razorpay_signature']

  const fail = (reason: string) =>
    NextResponse.redirect(
      `${origin}/register?payment=failed&reason=${encodeURIComponent(reason)}`,
      { status: 303 }
    )

  // Failure path — Razorpay posts error[...] fields and no signature.
  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    const failOrderId = params['error[metadata][order_id]'] || razorpay_order_id
    if (failOrderId) {
      try {
        await fetch(`${origin}/api/payment/record-failure`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: failOrderId,
            description: params['error[description]'] || params['error_description'],
            code: params['error[code]'] || params['error_code'],
          }),
        })
      } catch { /* best-effort */ }
    }
    return fail(params['error[description]'] || params['error_description'] || 'Payment was not completed')
  }

  // Defensive signature check (verify re-checks authoritatively).
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (secret) {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')
    if (expected !== razorpay_signature) return fail('Invalid payment signature')
  }

  // Mark the payment through the existing verify logic.
  try {
    const res = await fetch(`${origin}/api/payment/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature }),
    })
    const data = await res.json().catch(() => ({} as any))
    if (res.ok && data?.success) {
      const rid = data?.registrationId
      const dest = rid
        ? `${origin}/register/status/${encodeURIComponent(rid)}`
        : `${origin}/dashboard`
      return NextResponse.redirect(dest, { status: 303 })
    }
    return fail(data?.message || 'Payment verification failed')
  } catch {
    return fail('Could not verify payment')
  }
}

// A stray GET (user opens the URL directly) → back to registration.
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/register', request.url), { status: 303 })
}
