import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectToDatabase  from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectToDatabase()

  const userId = (session.user as any).id
  const user = await User.findById(userId)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Clean up expired sessions (older than 7 days to match auth config)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const originalCount = user.activeSessions.length
  user.activeSessions = user.activeSessions.filter(
    (s: { lastActivity: string | Date }) => new Date(s.lastActivity) > sevenDaysAgo
  )
  
  const cleanedCount = originalCount - user.activeSessions.length
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired sessions for user ${userId}`)
  }

  // Mark current session and format response
  const formattedSessions = user.activeSessions.map((s: { 
    sessionId: string;
    deviceId: string;
    deviceFingerprint?: string;
    loginTime: Date;
    lastActivity: Date;
    userAgent?: string;
    ipAddress?: string;
  }) => ({
    sessionId: s.sessionId,
    deviceId: s.deviceId,
    deviceFingerprint: s.deviceFingerprint || 'unknown',
    loginTime: s.loginTime,
    lastActivity: s.lastActivity,
    userAgent: s.userAgent || 'unknown',
    ipAddress: s.ipAddress || 'unknown',
    isCurrent: s.sessionId === (session as any).sessionId || s.deviceFingerprint === (session as any).deviceId,
    isExpiringSoon: new Date(s.lastActivity).getTime() < Date.now() - 5 * 24 * 60 * 60 * 1000 // 5 days
  }))

  await user.save()

  return NextResponse.json({ activeSessions: formattedSessions })
}