import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    // Clean up session from database on sign out
    if (session?.user && (session as any)?.user?.id && (session as any)?.sessionId) {
      await connectToDatabase()
      await User.findByIdAndUpdate((session.user as any).id, {
        $pull: {
          activeSessions: {
            sessionId: (session as any).sessionId
          }
        }
      })
      
      console.log('🔐 Session cleaned up on logout:', {
        userId: (session.user as any).id,
        sessionId: (session as any).sessionId
      })
    }
    
    return NextResponse.json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    console.error('Error during logout:', error)
    return NextResponse.json(
      { error: 'Logout failed' }, 
      { status: 500 }
    )
  }
}