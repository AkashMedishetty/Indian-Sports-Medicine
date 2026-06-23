import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Payment from '@/lib/models/Payment'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    // Fetch user data with populated payments
    const user = await User.findById((session.user as any).id).select('-password')
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 })
    }

    // Fetch user's payments
    const payments = await Payment.find({ userId: user._id }).sort({ createdAt: -1 })

    const userData = {
      ...user.toObject(),
      payments
    }

    return NextResponse.json({
      success: true,
      data: userData
    })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    const body = await request.json()
    const { profile, registration } = body

    await connectDB()

    const user = await User.findById((session.user as any).id)
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 })
    }

    // Update profile information
    if (profile) {
      user.profile = {
        ...user.profile,
        ...profile
      }
    }

    // Update registration information (limited fields)
    if (registration) {
      const allowedFields = ['membershipNumber', 'workshopSelections', 'accompanyingPersons']
      allowedFields.forEach(field => {
        if (registration[field] !== undefined) {
          user.registration[field] = registration[field]
        }
      })
    }

    await user.save()

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}