import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import ErrorLog from '@/conference-backend-core/lib/models/ErrorLog'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const severity = searchParams.get('severity')
    const category = searchParams.get('category')
    const resolved = searchParams.get('resolved')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const query: any = {}
    if (severity && severity !== 'all') query.severity = severity
    if (category && category !== 'all') query.category = category
    if (resolved === 'yes') query.resolved = true
    if (resolved === 'no') query.resolved = false

    const [errors, total, stats] = await Promise.all([
      ErrorLog.find(query)
        .sort({ lastOccurrence: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ErrorLog.countDocuments(query),
      ErrorLog.aggregate([
        {
          $group: {
            _id: { severity: '$severity', resolved: '$resolved' },
            count: { $sum: 1 }
          }
        }
      ])
    ])

    // Process stats
    const statsSummary = {
      total: 0,
      critical: 0,
      error: 0,
      warning: 0,
      info: 0,
      resolved: 0,
      unresolved: 0
    }
    
    stats.forEach((s: any) => {
      statsSummary.total += s.count
      if (s._id.severity) statsSummary[s._id.severity as keyof typeof statsSummary] += s.count
      if (s._id.resolved) statsSummary.resolved += s.count
      else statsSummary.unresolved += s.count
    })

    return NextResponse.json({
      success: true,
      errors: errors.map(e => ({
        _id: e._id,
        errorId: e.errorId,
        message: e.message,
        severity: e.severity,
        category: e.category,
        source: e.source,
        url: e.url,
        endpoint: e.endpoint,
        userId: e.userId,
        userEmail: e.userEmail,
        occurrences: e.occurrences,
        firstOccurrence: e.firstOccurrence,
        lastOccurrence: e.lastOccurrence,
        resolved: e.resolved,
        resolvedBy: e.resolvedBy,
        resolvedAt: e.resolvedAt,
        resolutionNotes: e.resolutionNotes
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: statsSummary
    })
  } catch (error) {
    console.error('Error fetching error logs:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch error logs' }, { status: 500 })
  }
}
