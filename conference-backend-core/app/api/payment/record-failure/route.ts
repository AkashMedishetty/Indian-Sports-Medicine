import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import paymentAttempts from '@/conference-backend-core/lib/payment/attempts'

/**
 * Records a failed Razorpay payment (from the Checkout `payment.failed` event).
 * create-order already logs an attempt (status `initiated`) keyed by the Razorpay
 * order id; here we mark that attempt `failed`. This persists failed transactions
 * in the database — required by the HDFC / Razorpay security audit
 * ("Transactions response is being stored in the database (including Failed)").
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const orderId: string | undefined =
      body.razorpay_order_id || body.orderId || body?.metadata?.order_id
    const error: string = body.description || body.error || 'Payment failed'
    const errorCode: string | undefined = body.code || body.errorCode

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'Missing order id' }, { status: 400 })
    }

    await connectDB()
    const attempt = await paymentAttempts.findByRazorpayOrderId(orderId)
    if (!attempt) {
      return NextResponse.json({ success: false, message: 'No attempt found for order' }, { status: 404 })
    }

    await paymentAttempts.markAttemptFailed(
      attempt.attemptId,
      String(error),
      errorCode ? String(errorCode) : undefined
    )

    return NextResponse.json({ success: true, attemptId: attempt.attemptId, status: 'failed' })
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to record payment failure' }, { status: 500 })
  }
}
