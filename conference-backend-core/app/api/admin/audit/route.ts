import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import AuditLog from '@/conference-backend-core/lib/models/AuditLog'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const actorId = searchParams.get('actorId')
    const action = searchParams.get('action')
    const resourceType = searchParams.get('resourceType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const query: any = {}
    if (actorId) query['actor.userId'] = actorId
    if (action && action !== 'all') {
      // Escape special regex characters to prevent invalid regex patterns
      const escapedAction = action.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      query.action = { $regex: escapedAction, $options: 'i' }
    }
    if (resourceType && resourceType !== 'all') query.resourceType = resourceType
    if (startDate) query.timestamp = { ...query.timestamp, $gte: new Date(startDate) }
    if (endDate) query.timestamp = { ...query.timestamp, $lte: new Date(endDate) }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AuditLog.countDocuments(query)
    ])

    return NextResponse.json({
      success: true,
      logs: logs.map(l => ({
        _id: l._id,
        timestamp: l.timestamp,
        actor: l.actor,
        action: l.action,
        resourceType: l.resourceType,
        resourceId: l.resourceId,
        changes: l.changes,
        metadata: l.metadata
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch audit logs' }, { status: 500 })
  }
}
