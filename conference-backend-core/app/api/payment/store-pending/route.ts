import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'

/**
 * Persists the pending registration for a Razorpay order so the hosted-checkout
 * (redirect) callback can complete the registration after payment. In the hosted
 * flow Razorpay redirects to /api/payment/callback with only the order/payment
 * ids and signature — no page-side data — so we stash the data here, keyed by
 * order id, and /api/payment/verify reads it back.
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId, pendingRegistration } = await request.json()
    if (!orderId || !pendingRegistration) {
      return NextResponse.json({ success: false, message: 'orderId and pendingRegistration are required' }, { status: 400 })
    }
    await connectDB()
    const db = mongoose.connection.db
    if (!db) return NextResponse.json({ success: false, message: 'Database unavailable' }, { status: 500 })
    await db.collection('pending_registrations').updateOne(
      { orderId },
      { $set: { orderId, pendingRegistration, createdAt: new Date() } },
      { upsert: true }
    )
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || 'Failed to store pending registration' }, { status: 500 })
  }
}
