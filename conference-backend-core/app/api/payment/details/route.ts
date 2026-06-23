import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Payment from '@/lib/models/Payment'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.json(
        { success: false, message: 'Payment ID is required' },
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

    return NextResponse.json({
      success: true,
      data: {
        _id: payment._id,
        amount: payment.amount,
        workshops: payment.workshops,
        status: payment.status,
        type: payment.type
      }
    })

  } catch (error) {
    console.error('Fetch payment details error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch payment details' },
      { status: 500 }
    )
  }
}
