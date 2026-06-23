import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is admin
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    const adminUser = await User.findById((session.user as any).id)
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 })
    }

    // Fetch all users with basic info for email recipients
    const users = await User.find({ role: 'user' })
      .select('email profile.title profile.firstName profile.lastName registration.type registration.status')
      .lean()

    const recipients = users.map(user => ({
      _id: String(user._id),
      email: user.email,
      name: `${user.profile.title || ''} ${user.profile.firstName} ${user.profile.lastName}`.trim(),
      registrationType: user.registration.type,
      registrationStatus: user.registration.status
    }))

    return NextResponse.json({
      success: true,
      data: recipients
    })

  } catch (error) {
    console.error('Recipients fetch error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}