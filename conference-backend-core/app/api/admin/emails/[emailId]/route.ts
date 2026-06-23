import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { getEmailById } from '@/conference-backend-core/lib/email/email-with-history'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ emailId: string }> }
) {
  try {
    const { emailId } = await params
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const email = await getEmailById(emailId)

    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'Email not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      email: {
        emailId: email.emailId,
        recipient: email.recipient,
        subject: email.subject,
        htmlContent: email.htmlContent,
        plainTextContent: email.plainTextContent,
        templateName: email.templateName,
        templateData: email.templateData,
        category: email.category,
        attachments: email.attachments,
        status: email.status,
        messageId: email.messageId,
        error: email.error,
        sentAt: email.sentAt,
        tracking: email.tracking
      }
    })
  } catch (error) {
    console.error('Error fetching email:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch email'
    }, { status: 500 })
  }
}
