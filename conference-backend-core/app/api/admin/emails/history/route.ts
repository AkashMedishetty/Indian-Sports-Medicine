import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import EmailHistory from '@/conference-backend-core/lib/models/EmailHistory'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const query: any = {}
    if (userId) query['recipient.userId'] = userId
    if (email) {
      // Escape special regex characters to prevent invalid regex patterns
      const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      query['recipient.email'] = { $regex: escapedEmail, $options: 'i' }
    }
    if (status && status !== 'all') query.status = status

    const [emails, total] = await Promise.all([
      EmailHistory.find(query)
        .sort({ sentAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      EmailHistory.countDocuments(query)
    ])

    return NextResponse.json({
      success: true,
      emails: emails.map(e => ({
        _id: e._id,
        emailId: e.emailId,
        recipient: e.recipient,
        subject: e.subject,
        templateName: e.templateName,
        status: e.status,
        messageId: e.messageId,
        sentAt: e.sentAt,
        tracking: e.tracking,
        error: e.error,
        createdAt: e.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching email history:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch email history' }, { status: 500 })
  }
}
