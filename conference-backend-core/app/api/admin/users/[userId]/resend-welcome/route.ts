import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/conference-backend-core/lib/models/User'
import { sendEmailWithHistory } from '@/conference-backend-core/lib/email/email-with-history'
import { logAction } from '@/conference-backend-core/lib/audit/service'

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
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 })
    }

    const fullName = `${user.profile?.title || ''} ${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim()

    // Send welcome email
    const result = await sendEmailWithHistory({
      to: user.email,
      subject: 'Welcome to ISSH Midterm CME 2026 - Registration Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a365d;">Welcome to ISSH Midterm CME 2026!</h1>
          <p>Dear ${fullName},</p>
          <p>Thank you for registering for ISSH Midterm CME 2026. Your registration details are as follows:</p>
          <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Registration ID:</strong> ${user.registration?.registrationId}</p>
            <p><strong>Registration Type:</strong> ${user.registration?.type}</p>
            <p><strong>Status:</strong> ${user.registration?.status}</p>
          </div>
          <p>You can check your registration status anytime by visiting your dashboard.</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>ISSH 2026 Team</p>
        </div>
      `,
      text: `Welcome to ISSH Midterm CME 2026!\n\nDear ${fullName},\n\nThank you for registering. Your Registration ID is: ${user.registration?.registrationId}\n\nBest regards,\nISSH 2026 Team`,
      userId: user._id,
      userName: fullName,
      templateName: 'welcome-resend',
      templateData: {
        name: fullName,
        registrationId: user.registration?.registrationId,
        type: user.registration?.type,
        status: user.registration?.status
      },
      category: 'registration'
    })

    // Log the action
    await logAction({
      actor: {
        userId: sessionUser.id,
        email: sessionUser.email,
        role: 'admin'
      },
      action: 'user.updated',
      resourceType: 'user',
      resourceId: userId,
      changes: {
        before: {},
        after: { emailSent: result.success, messageId: result.messageId },
        fields: []
      },
      metadata: {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      description: 'Welcome email resent'
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Welcome email sent successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: result.error || 'Failed to send email'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error resending welcome email:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to resend welcome email'
    }, { status: 500 })
  }
}
