import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/conference-backend-core/lib/models/User'
import { logAction } from '@/conference-backend-core/lib/audit/service'

export async function PUT(
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

    const { status } = await request.json()

    if (!status || !['paid', 'confirmed', 'pending-payment', 'cancelled', 'pending'].includes(status)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid status'
      }, { status: 400 })
    }

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 })
    }

    const previousStatus = user.registration?.status

    // Update status
    await User.findByIdAndUpdate(userId, {
      'registration.status': status
    })

    // Log the action
    await logAction({
      actor: {
        userId: sessionUser.id,
        email: sessionUser.email,
        role: 'admin'
      },
      action: 'registration.updated',
      resourceType: 'user',
      resourceId: userId,
      changes: {
        before: { status: previousStatus },
        after: { status },
        fields: ['registration.status']
      },
      metadata: {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully'
    })
  } catch (error) {
    console.error('Error updating user status:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to update status'
    }, { status: 500 })
  }
}
