import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import EmailQueue from '@/conference-backend-core/lib/models/EmailQueue'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const query: any = {}
    if (status && status !== 'all') {
      query.status = status
    }

    const [emails, total, stats] = await Promise.all([
      EmailQueue.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      EmailQueue.countDocuments(query),
      EmailQueue.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ])

    const statusCounts = stats.reduce((acc: any, s) => {
      acc[s._id] = s.count
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      emails: emails.map(e => ({
        _id: e._id,
        emailId: e.emailId,
        recipient: e.recipient,
        subject: e.subject,
        template: e.template,
        status: e.status,
        priority: e.priority,
        attempts: e.attempts,
        lastAttempt: e.lastAttempt,
        nextRetry: e.nextRetry,
        error: e.error,
        sentAt: e.sentAt,
        createdAt: e.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        queued: statusCounts.queued || 0,
        processing: statusCounts.processing || 0,
        sent: statusCounts.sent || 0,
        failed: statusCounts.failed || 0,
        dead: statusCounts.dead || 0
      }
    })
  } catch (error) {
    console.error('Error fetching email queue:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch email queue' }, { status: 500 })
  }
}
