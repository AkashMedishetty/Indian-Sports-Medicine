import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'sponsor') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const sponsor = await User.findById(sessionUser.id)
    if (!sponsor || !sponsor.sponsorProfile) {
      return NextResponse.json({ success: false, message: 'Sponsor not found' }, { status: 404 })
    }

    // Update last activity
    sponsor.sponsorProfile.lastActivity = new Date()
    
    // Count actual delegates registered under this sponsor (dynamic count)
    const actualUsedCount = await User.countDocuments({ 
      'registration.sponsorId': sessionUser.id,
      role: 'user' // Only count regular users, not the sponsor itself
    })
    
    // Update the stored count if it differs from actual count
    if (sponsor.sponsorProfile.allocation.used !== actualUsedCount) {
      console.log(`📊 Sponsor ${sponsor.sponsorProfile.companyName}: Updating used count from ${sponsor.sponsorProfile.allocation.used} to ${actualUsedCount}`)
      sponsor.sponsorProfile.allocation.used = actualUsedCount
    }
    
    await sponsor.save()

    // Get recent delegates with full profile info
    const recentDelegates = await User.find({ 'registration.sponsorId': sessionUser.id })
      .select('email profile registration.registrationId registration.status createdAt')
      .sort({ createdAt: -1 })
      .limit(5)

    return NextResponse.json({
      success: true,
      data: {
        companyName: sponsor.sponsorProfile.companyName,
        category: sponsor.sponsorProfile.category,
        allocation: {
          total: sponsor.sponsorProfile.allocation.total,
          used: actualUsedCount // Return the dynamically calculated count
        },
        recentDelegates: recentDelegates.map(d => ({
          _id: d._id,
          name: `${d.profile?.firstName || ''} ${d.profile?.lastName || ''}`.trim(),
          email: d.email,
          city: d.profile?.address?.city || '',
          state: d.profile?.address?.state || '',
          institution: d.profile?.institution || '',
          registrationId: d.registration?.registrationId,
          status: d.registration?.status,
          createdAt: d.createdAt
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching sponsor dashboard:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch dashboard' }, { status: 500 })
  }
}
