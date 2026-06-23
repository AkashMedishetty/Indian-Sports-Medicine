import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Find user by email
    const user = await User.findOne({
      email: email.toLowerCase().trim()
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user has a valid registration (allow pending-payment users)
    const validStatuses = ['completed', 'paid', 'confirmed', 'pending-payment']
    if (!validStatuses.includes(user.registration?.status)) {
      return NextResponse.json(
        { success: false, message: 'You must complete registration before submitting abstracts' },
        { status: 403 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: user._id,
        registrationId: user.registration?.registrationId,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      }
    })

  } catch (error) {
    console.error('Registration verification error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
