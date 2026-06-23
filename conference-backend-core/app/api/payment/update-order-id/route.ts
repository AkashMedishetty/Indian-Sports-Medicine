import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Payment from '@/lib/models/Payment'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { paymentId, razorpayOrderId } = body

    if (!paymentId || !razorpayOrderId) {
      return NextResponse.json(
        { success: false, message: 'Payment ID and Razorpay Order ID are required' },
        { status: 400 }
      )
    }

    await connectDB()

    const payment = await Payment.findById(paymentId)
    
    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Payment not found' },
        { status: 404 }
      )
    }

    // Verify payment belongs to current user
    if (payment.userId.toString() !== (session.user as any).id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access to payment' },
        { status: 403 }
      )
    }

    // Update payment with Razorpay order ID
    payment.razorpayOrderId = razorpayOrderId
    await payment.save()

    return NextResponse.json({
      success: true,
      message: 'Payment updated with order ID'
    })

  } catch (error) {
    console.error('Update payment order ID error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update payment' },
      { status: 500 }
    )
  }
}
