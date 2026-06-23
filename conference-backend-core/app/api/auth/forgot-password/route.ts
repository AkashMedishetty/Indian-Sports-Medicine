import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import jwt from 'jsonwebtoken'
import { EmailService } from '@/lib/email/service'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'Email is required'
      }, { status: 400 })
    }

    await connectDB()

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })
    
    if (!user) {
      // For security, don't reveal if email exists or not
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, you will receive a password reset link.'
      })
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: '1h' }
    )

    // Create reset link
    const resetLink = `${process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`

    // Send password reset email
    try {
      await EmailService.sendPasswordReset({
        userId: user._id.toString(),
        email: user.email,
        name: `${user.profile.title || ''} ${user.profile.firstName} ${user.profile.lastName}`.trim(),
        resetLink,
        expiryTime: '1 hour'
      })

      return NextResponse.json({
        success: true,
        message: 'Password reset instructions have been sent to your email.'
      })
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError)
      return NextResponse.json({
        success: false,
        message: 'Failed to send password reset email. Please try again.'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}