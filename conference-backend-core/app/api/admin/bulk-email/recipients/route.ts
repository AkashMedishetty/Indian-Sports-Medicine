import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    // Get all users with registration data and workshop information
    const users = await User.find({
      'registration.registrationId': { $exists: true }
    })
      .select('email profile registration workshops')
      .lean()

    const recipients = users.map((user: any) => {
      // Get registrationId - check if it looks like a MongoDB ObjectId (24 hex chars)
      let regId = user.registration?.registrationId || user._id.toString()
      const isMongoId = /^[0-9a-f]{24}$/i.test(regId)
      
      // If it's a MongoDB ObjectId, create a readable registration ID
      if (isMongoId) {
        const shortId = regId.substring(18, 24).toUpperCase()
        regId = `REG-${shortId}`
      }
      
      return {
        _id: user._id.toString(),
        email: user.email,
        name: `${user.profile?.title || ''} ${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim(),
        registrationId: regId,
        registrationType: user.registration?.category || user.registration?.type || 'N/A',
        registrationStatus: user.registration?.status || 'pending',
        category: user.registration?.category || user.registration?.type || 'N/A',
        workshop: user.workshops && user.workshops.length > 0 ? user.workshops[0]?.name || 'Yes' : null
      }
    })

    return NextResponse.json({
      success: true,
      data: recipients
    })

  } catch (error) {
    console.error('Error fetching recipients:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch recipients',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
