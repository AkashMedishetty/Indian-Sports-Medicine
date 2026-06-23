import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import bcrypt from 'bcryptjs'
import { sendEmailWithHistory } from '@/conference-backend-core/lib/email/email-with-history'
import { logSponsorAction } from '@/conference-backend-core/lib/audit/service'

// Generate a random password
function generatePassword(length: number = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// POST - Reset sponsor password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const sponsor = await User.findOne({ _id: id, role: 'sponsor' })
    if (!sponsor) {
      return NextResponse.json({ success: false, message: 'Sponsor not found' }, { status: 404 })
    }

    const body = await request.json()
    const { password, sendEmail = true } = body

    // Use provided password or generate one
    const plainPassword = password || generatePassword()
    const hashedPassword = await bcrypt.hash(plainPassword, 12)

    // Update password and set mustChangePassword flag
    sponsor.password = hashedPassword
    sponsor.sponsorProfile!.mustChangePassword = !password // If admin sets specific password, don't force change
    await sponsor.save()

    // Log the action
    await logSponsorAction(
      { userId: sessionUser.id, email: sessionUser.email, role: 'admin' },
      'sponsor.password_reset',
      sponsor._id.toString(),
      sponsor.sponsorProfile?.companyName || '',
      { ip: request.headers.get('x-forwarded-for') || 'unknown', userAgent: request.headers.get('user-agent') || '' },
      { before: {}, after: { passwordReset: true, emailSent: sendEmail }, fields: ['password'] }
    )

    // Send email with new password if requested
    if (sendEmail) {
      await sendEmailWithHistory({
        to: sponsor.email,
        subject: 'ISSH Midterm CME 2026 - Sponsor Portal Password Reset',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a365d;">Password Reset</h1>
            <p>Dear ${sponsor.sponsorProfile?.contactPerson},</p>
            <p>Your password for the ISSH 2026 Sponsor Portal has been reset.</p>
            
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Your New Login Credentials</h3>
              <p><strong>Email:</strong> ${sponsor.email}</p>
              <p><strong>New Password:</strong> ${plainPassword}</p>
              ${!password ? '<p style="color: #e53e3e; font-size: 14px;">⚠️ You will be required to change your password on first login.</p>' : ''}
            </div>
            
            <p>Login at: <a href="${process.env.NEXTAUTH_URL}/sponsor/login">${process.env.NEXTAUTH_URL}/sponsor/login</a></p>
            
            <p>Best regards,<br>ISSH 2026 Team</p>
          </div>
        `,
        text: `Your ISSH 2026 Sponsor Portal password has been reset.\n\nEmail: ${sponsor.email}\nNew Password: ${plainPassword}\n\nLogin at: ${process.env.NEXTAUTH_URL}/sponsor/login`,
        userId: sponsor._id,
        userName: sponsor.sponsorProfile?.contactPerson || '',
        templateName: 'sponsor-password-reset',
        category: 'sponsor'
      })
    }

    return NextResponse.json({
      success: true,
      message: sendEmail ? 'Password reset and email sent' : 'Password reset successfully',
      // Only return password if email was not sent (so admin can share it manually)
      ...(sendEmail ? {} : { newPassword: plainPassword })
    })
  } catch (error) {
    console.error('Error resetting sponsor password:', error)
    return NextResponse.json({ success: false, message: 'Failed to reset password' }, { status: 500 })
  }
}
