import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({
        success: false,
        message: 'Token and password are required'
      }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({
        success: false,
        message: 'Password must be at least 8 characters long'
      }, { status: 400 })
    }

    // Verify the reset token
    let decoded
    try {
      decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any
    } catch (jwtError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired reset token'
      }, { status: 400 })
    }

    await connectDB()

    // Find the user
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 })
    }

    if (user.email !== decoded.email) {
      return NextResponse.json({
        success: false,
        message: 'Invalid reset token'
      }, { status: 400 })
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user password using findByIdAndUpdate to avoid full document validation
    await User.findByIdAndUpdate(
      user._id,
      { password: hashedPassword },
      { 
        runValidators: false, // Skip validation for other fields
        new: true 
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}