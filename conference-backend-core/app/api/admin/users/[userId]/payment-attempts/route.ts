import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { getAttemptsForUser } from '@/conference-backend-core/lib/payment/attempts'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = parseInt(searchParams.get('skip') || '0')

    const result = await getAttemptsForUser(userId, { limit, skip })

    // Transform for frontend
    const attempts = result.attempts.map(attempt => ({
      attemptId: attempt.attemptId,
      attemptNumber: attempt.attemptNumber,
      amount: attempt.amount,
      currency: attempt.currency,
      method: attempt.method,
      status: attempt.status,
      initiatedAt: attempt.initiatedAt,
      completedAt: attempt.completedAt,
      error: attempt.error,
      device: attempt.device,
      razorpay: attempt.razorpay ? {
        orderId: attempt.razorpay.orderId,
        paymentId: attempt.razorpay.paymentId
      } : undefined
    }))

    return NextResponse.json({
      success: true,
      attempts,
      total: result.total
    })
  } catch (error) {
    console.error('Error fetching payment attempts:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch payment attempts'
    }, { status: 500 })
  }
}
