import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectToDatabase from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const user = await User.findById((session.user as any).id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Clean up expired sessions (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const activeSessions = user.activeSessions.filter(
      (s: any) => new Date(s.lastActivity) > sevenDaysAgo
    )

    // Update user with cleaned sessions
    await User.findByIdAndUpdate((session.user as any).id, {
      $set: { activeSessions }
    })

    const removedCount = user.activeSessions.length - activeSessions.length

    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up ${removedCount} expired sessions`,
      activeSessions: activeSessions.length
    })

  } catch (error) {
    console.error('Session cleanup error:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup sessions' }, 
      { status: 500 }
    )
  }
}

// Also allow GET for manual cleanup
export async function GET() {
  return POST()
}