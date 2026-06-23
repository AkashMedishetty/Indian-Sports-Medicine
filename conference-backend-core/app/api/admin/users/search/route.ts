import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 })
    }

    await connectDB()

    // Search for user by email (case-insensitive)
    // Escape special regex characters to prevent invalid regex patterns
    const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') }
    }).select('firstName lastName email registration.registrationId profile')

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found',
        user: null
      })
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        _id: user._id,
        firstName: user.profile?.firstName || user.firstName || '',
        lastName: user.profile?.lastName || user.lastName || '',
        email: user.email,
        registration: user.registration
      }
    })

  } catch (error) {
    console.error('Error searching user:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
