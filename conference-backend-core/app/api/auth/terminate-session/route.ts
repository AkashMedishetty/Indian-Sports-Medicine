import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectToDatabase  from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { deviceFingerprint, sessionId } = await request.json()
  if (!deviceFingerprint && !sessionId) {
    return NextResponse.json({ error: 'Missing deviceFingerprint or sessionId' }, { status: 400 })
  }

  // Prevent terminating current session
  if ((session as any).sessionId === sessionId || (session as any).deviceId === deviceFingerprint) {
    return NextResponse.json({ error: 'Cannot terminate current session' }, { status: 400 })
  }

  await connectToDatabase()

  // Try to remove by deviceFingerprint first, then by sessionId
  const query = deviceFingerprint 
    ? { deviceFingerprint }
    : { sessionId }

  const updateResult = await User.updateOne(
    { _id: (session.user as any).id },
    { $pull: { activeSessions: query } }
  )

  if (updateResult.modifiedCount === 0) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  console.log(' Session terminated:', {
    userId: (session.user as any).id,
    terminatedBy: deviceFingerprint ? 'deviceFingerprint' : 'sessionId',
    value: deviceFingerprint || sessionId
  })

  return NextResponse.json({ success: true, message: 'Session terminated' })
}