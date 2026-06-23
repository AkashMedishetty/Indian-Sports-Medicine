import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

// GET - Search for claimable delegates by email
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'sponsor') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')?.toLowerCase()

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 })
    }

    const user = await User.findOne({ email }).select('email profile registration')

    if (!user) {
      return NextResponse.json({
        success: true,
        found: false,
        message: 'No user found with this email - you can register them as a new delegate'
      })
    }

    // Check if already sponsored by this sponsor
    if (user.registration?.sponsorId?.toString() === sessionUser.id) {
      return NextResponse.json({
        success: true,
        found: true,
        claimable: false,
        alreadySponsored: true,
        message: 'This delegate is already registered under your sponsorship'
      })
    }

    // Check if sponsored by another sponsor
    if (user.registration?.sponsorId) {
      return NextResponse.json({
        success: true,
        found: true,
        claimable: false,
        sponsoredByOther: true,
        message: `This delegate is already sponsored by ${user.registration.sponsorName || 'another sponsor'}`
      })
    }

    // Check if pending-payment (claimable)
    if (user.registration?.status === 'pending-payment') {
      return NextResponse.json({
        success: true,
        found: true,
        claimable: true,
        user: {
          _id: user._id,
          email: user.email,
          name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim(),
          firstName: user.profile?.firstName,
          lastName: user.profile?.lastName,
          phone: user.profile?.phone,
          institution: user.profile?.institution,
          registrationId: user.registration?.registrationId,
          registrationType: user.registration?.type
        },
        message: 'This user has a pending registration and can be claimed'
      })
    }

    // Already confirmed/paid - cannot claim
    return NextResponse.json({
      success: true,
      found: true,
      claimable: false,
      alreadyConfirmed: true,
      message: 'This user already has a confirmed registration and cannot be claimed'
    })
  } catch (error) {
    console.error('Error searching delegate:', error)
    return NextResponse.json({ success: false, message: 'Failed to search' }, { status: 500 })
  }
}
