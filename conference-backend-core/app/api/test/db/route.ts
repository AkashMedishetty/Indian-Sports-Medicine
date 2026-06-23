import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    console.log('Database connection test - SUCCESS')
    
    // Count users in database
    const userCount = await User.countDocuments()
    console.log('Total users in database:', userCount)
    
    // Get recent users (last 5)
    const recentUsers = await User.find()
      .select('email profile.firstName profile.lastName registration.registrationId createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
    
    console.log('Recent users:', recentUsers)
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        userCount,
        recentUsers: recentUsers.map(user => ({
          id: user._id,
          email: user.email,
          name: `${user.profile.firstName} ${user.profile.lastName}`,
          registrationId: user.registration.registrationId,
          createdAt: user.createdAt
        }))
      }
    })
    
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}