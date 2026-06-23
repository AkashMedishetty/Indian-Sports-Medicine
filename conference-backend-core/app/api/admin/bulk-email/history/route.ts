import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import EmailHistory from '@/lib/models/EmailHistory'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    // Get email history
    const emailHistory = await EmailHistory.find({})
      .sort({ sentAt: -1 })
      .limit(50)
      .lean()

    const formattedHistory = emailHistory.map((item: any) => ({
      _id: item._id.toString(),
      subject: item.subject || 'No Subject',
      template: item.template || 'custom',
      sentAt: item.sentAt,
      recipientCount: item.recipientCount || 0,
      successCount: item.successCount || 0,
      failureCount: item.failureCount || 0,
      sentBy: item.sentBy || 'Unknown'
    }))

    return NextResponse.json({
      success: true,
      data: formattedHistory
    })

  } catch (error) {
    console.error('Error fetching email history:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch email history',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
