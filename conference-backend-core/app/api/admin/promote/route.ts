import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, secret } = body

    // Validate secret
    if (secret !== 'promote-admin-2026') {
      return NextResponse.json({
        success: false,
        message: 'Invalid secret key'
      }, { status: 403 })
    }

    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'Email is required'
      }, { status: 400 })
    }

    await connectDB()

    // Find user by email
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found or inactive'
      }, { status: 404 })
    }

    // Update user role to admin
    user.role = 'admin'
    await user.save()

    return NextResponse.json({
      success: true,
      message: `User ${email} has been promoted to admin`,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: `${user.profile.firstName} ${user.profile.lastName}`
      }
    })

  } catch (error) {
    console.error('Error promoting user to admin:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}