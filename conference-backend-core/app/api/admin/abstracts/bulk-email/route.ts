import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import { EmailService } from '@/lib/email/service'
import { logAction } from '@/conference-backend-core/lib/audit/service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const userRole = (session.user as any).role

    if (userRole !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }

    const { abstractIds, subject, message, emailType } = await request.json()

    if (!abstractIds || !Array.isArray(abstractIds) || abstractIds.length === 0) {
      return NextResponse.json({ success: false, message: 'Abstract IDs are required' }, { status: 400 })
    }

    if (!subject || !message) {
      return NextResponse.json({ success: false, message: 'Subject and message are required' }, { status: 400 })
    }

    await connectDB()

    // Get abstracts with user info
    const abstracts = await Abstract.find({ _id: { $in: abstractIds } }).populate('userId')

    let sentCount = 0
    const errors: string[] = []

    for (const abstract of abstracts) {
      try {
        const authorUser = abstract.userId as any
        if (!authorUser || !authorUser.email) {
          errors.push(`No email for abstract ${abstract.abstractId}`)
          continue
        }

        const authorName = `${authorUser.profile?.firstName || authorUser.firstName || ''} ${authorUser.profile?.lastName || authorUser.lastName || ''}`.trim() || authorUser.email

        // Replace placeholders in message
        const personalizedMessage = message
          .replace(/\{name\}/g, authorName)
          .replace(/\{abstractId\}/g, abstract.abstractId)
          .replace(/\{title\}/g, abstract.title)
          .replace(/\{status\}/g, abstract.status)
          .replace(/\{registrationId\}/g, authorUser.registration?.registrationId || 'N/A')

        const personalizedSubject = subject
          .replace(/\{abstractId\}/g, abstract.abstractId)
          .replace(/\{title\}/g, abstract.title)

        // Send custom email
        await EmailService.sendCustomMessage({
          email: authorUser.email,
          recipientName: authorName,
          subject: personalizedSubject,
          content: personalizedMessage
        })

        sentCount++
      } catch (emailError) {
        console.error(`Failed to send email for ${abstract.abstractId}:`, emailError)
        errors.push(`Failed to send email for ${abstract.abstractId}`)
      }
    }

    // Log the action
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || ''
    
    await logAction({
      actor: {
        userId,
        email: session.user.email || '',
        role: userRole,
        name: session.user.name || ''
      },
      action: 'abstracts.bulk_email',
      resourceType: 'email',
      resourceId: 'bulk',
      resourceName: `${abstractIds.length} abstracts`,
      metadata: { ip, userAgent },
      changes: {
        before: { targetCount: abstractIds.length },
        after: { sentCount, subject, errors }
      },
      description: `Admin sent bulk email to ${sentCount} abstract authors with subject: "${subject}"`
    })

    return NextResponse.json({ 
      success: true, 
      sentCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `${sentCount} emails sent successfully${errors.length > 0 ? `, ${errors.length} failed` : ''}`
    })

  } catch (error) {
    console.error('Error sending bulk emails:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
