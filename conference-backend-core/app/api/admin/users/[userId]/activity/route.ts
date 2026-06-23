import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { getUserActivity } from '@/conference-backend-core/lib/audit/service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = parseInt(searchParams.get('skip') || '0')

    const result = await getUserActivity(userId, { limit, skip })

    // Transform for frontend
    const logs = result.logs.map(log => ({
      auditId: log.auditId,
      timestamp: log.timestamp,
      action: log.action,
      actor: {
        email: log.actor.email,
        role: log.actor.role
      },
      description: log.description,
      changes: log.changes ? {
        before: log.changes.before,
        after: log.changes.after,
        fields: log.changes.fields
      } : undefined
    }))

    return NextResponse.json({
      success: true,
      logs,
      total: result.total
    })
  } catch (error) {
    console.error('Error fetching user activity:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch activity logs'
    }, { status: 500 })
  }
}
