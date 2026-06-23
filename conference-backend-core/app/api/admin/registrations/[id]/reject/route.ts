import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import { EmailService } from '@/lib/email/service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    const adminUser = await User.findById((session.user as any).id)
    if (!adminUser || !['admin', 'manager'].includes(adminUser.role)) {
      return NextResponse.json({
        success: false,
        message: 'Admin or Manager access required'
      }, { status: 403 })
    }

    const { reason } = await request.json()

    // Find the user to reject
    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 })
    }

    // Update payment status to rejected
    if (user.payment) {
      user.payment.status = 'rejected'
      user.payment.verifiedBy = adminUser.email
      user.payment.verificationDate = new Date()
      if (reason) {
        user.payment.remarks = reason
      }
    }

    // Update registration status to cancelled
    user.registration.status = 'cancelled'

    await user.save()

    // Send rejection email
    try {
      await EmailService.sendPaymentRejection({
        email: user.email,
        name: `${user.profile.firstName} ${user.profile.lastName}`,
        registrationId: user.registration.registrationId,
        reason: reason || 'Payment verification failed',
        rejectionDate: new Date()
      })
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError)
      // Don't fail the rejection if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Registration rejected successfully',
      data: {
        id: user._id,
        email: user.email,
        registrationId: user.registration.registrationId,
        paymentStatus: user.payment?.status,
        registrationStatus: user.registration.status
      }
    })

  } catch (error) {
    console.error('Rejection error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
