import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { getEmailHistoryForUser } from '@/conference-backend-core/lib/email/email-with-history'
import User from '@/lib/models/User'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || !['admin', 'manager'].includes(sessionUser.role)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    // Get user's email for fallback search
    const user = await User.findById(userId).select('email')
    const userEmail = user?.email

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = parseInt(searchParams.get('skip') || '0')
    const category = searchParams.get('category') || undefined

    const result = await getEmailHistoryForUser(userId, {
      limit,
      skip,
      category: category as any,
      email: userEmail // Pass email for fallback search
    })

    // Transform for frontend
    const emails = result.emails.map(email => ({
      emailId: email.emailId,
      subject: email.subject,
      category: email.category,
      status: email.status,
      sentAt: email.sentAt,
      tracking: email.tracking,
      hasAttachments: email.attachments && email.attachments.length > 0
    }))

    return NextResponse.json({
      success: true,
      emails,
      total: result.total
    })
  } catch (error) {
    console.error('Error fetching user emails:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch email history'
    }, { status: 500 })
  }
}
