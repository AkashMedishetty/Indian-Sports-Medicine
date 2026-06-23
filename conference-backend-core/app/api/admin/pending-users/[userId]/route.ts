import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import { sendEmailWithHistory } from '@/conference-backend-core/lib/email/email-with-history'
import { logAction } from '@/conference-backend-core/lib/audit/service'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'

// POST - Actions on pending user
export async function POST(
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

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    if (user.registration?.status !== 'pending-payment') {
      return NextResponse.json({ success: false, message: 'User is not in pending-payment status' }, { status: 400 })
    }

    const { action, reason } = await request.json()
    const metadata = { ip: request.headers.get('x-forwarded-for') || 'unknown', userAgent: request.headers.get('user-agent') || '' }

    switch (action) {
      case 'convert-complimentary':
        // Convert to complimentary registration
        user.registration.status = 'confirmed'
        user.registration.paymentType = 'complimentary'
        user.registration.confirmedDate = new Date()
        user.registration.paymentRemarks = reason || 'Converted to complimentary by admin'
        await user.save()

        await logAction({
          actor: { userId: sessionUser.id, email: sessionUser.email, role: 'admin' },
          action: 'registration.confirmed',
          resourceType: 'registration',
          resourceId: user._id.toString(),
          resourceName: user.registration.registrationId,
          metadata,
          changes: { before: { status: 'pending-payment' }, after: { status: 'confirmed', paymentType: 'complimentary' }, fields: ['status', 'paymentType'] },
          description: 'Converted to complimentary registration'
        })

        // Send confirmation email
        await sendEmailWithHistory({
          to: user.email,
          subject: `${conferenceConfig.shortName} - Registration Confirmed`,
          html: `<p>Dear ${user.profile?.firstName},</p><p>Your registration has been confirmed as complimentary.</p><p>Registration ID: ${user.registration.registrationId}</p>`,
          text: `Your registration has been confirmed. Registration ID: ${user.registration.registrationId}`,
          userId: user._id,
          userName: `${user.profile?.firstName} ${user.profile?.lastName}`,
          templateName: 'registration-confirmed',
          category: 'registration'
        })

        return NextResponse.json({ success: true, message: 'Converted to complimentary registration' })

      case 'send-reminder':
        // Send payment reminder
        await sendEmailWithHistory({
          to: user.email,
          subject: `${conferenceConfig.shortName} - Payment Reminder`,
          html: `
            <p>Dear ${user.profile?.firstName},</p>
            <p>This is a reminder that your registration for ${conferenceConfig.shortName} is pending payment.</p>
            <p><strong>Registration ID:</strong> ${user.registration.registrationId}</p>
            <p>Please complete your payment to confirm your registration.</p>
            <p>Login at: ${conferenceConfig.contact.website}/login</p>
          `,
          text: `Payment reminder for ${conferenceConfig.shortName}. Registration ID: ${user.registration.registrationId}`,
          userId: user._id,
          userName: `${user.profile?.firstName} ${user.profile?.lastName}`,
          templateName: 'payment-reminder',
          category: 'payment'
        })

        await logAction({
          actor: { userId: sessionUser.id, email: sessionUser.email, role: 'admin' },
          action: 'email.sent',
          resourceType: 'registration',
          resourceId: user._id.toString(),
          resourceName: user.registration.registrationId,
          metadata,
          description: 'Payment reminder sent'
        })

        return NextResponse.json({ success: true, message: 'Payment reminder sent' })

      case 'cancel':
        // Cancel registration
        user.registration.status = 'cancelled'
        user.registration.paymentRemarks = reason || 'Cancelled by admin'
        user.isActive = false
        await user.save()

        await logAction({
          actor: { userId: sessionUser.id, email: sessionUser.email, role: 'admin' },
          action: 'registration.cancelled',
          resourceType: 'registration',
          resourceId: user._id.toString(),
          resourceName: user.registration.registrationId,
          metadata,
          changes: { before: { status: 'pending-payment' }, after: { status: 'cancelled' }, fields: ['status'] },
          description: 'Registration cancelled by admin'
        })

        // Send cancellation email
        await sendEmailWithHistory({
          to: user.email,
          subject: `${conferenceConfig.shortName} - Registration Cancelled`,
          html: `<p>Dear ${user.profile?.firstName},</p><p>Your registration has been cancelled.</p>${reason ? `<p>Reason: ${reason}</p>` : ''}`,
          text: `Your registration has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
          userId: user._id,
          userName: `${user.profile?.firstName} ${user.profile?.lastName}`,
          templateName: 'registration-cancelled',
          category: 'registration'
        })

        return NextResponse.json({ success: true, message: 'Registration cancelled' })

      default:
        return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error processing pending user action:', error)
    return NextResponse.json({ success: false, message: 'Failed to process action' }, { status: 500 })
  }
}
