import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import ReviewerConfig from '@/conference-backend-core/lib/models/ReviewerConfig'
import { EmailService } from '@/lib/email/service'
import { logAction } from '@/conference-backend-core/lib/audit/service'

// Default email templates (fallback if not configured in ReviewerConfig)
const DEFAULT_ACCEPTANCE_SUBJECT = 'Congratulations! Your Abstract {abstractId} Has Been Accepted - ISSH Midterm CME 2026'
const DEFAULT_ACCEPTANCE_BODY = `Dear {name},

Congratulations! We are pleased to inform you that your abstract titled "{title}" (ID: {abstractId}) has been ACCEPTED for presentation at ISSH Midterm CME 2026.

Presentation Type: {approvedFor}

Please log in to your dashboard to view the details and complete any required next steps for your final submission.

Dashboard: {dashboardUrl}

Best regards,
ISSH 2026 Organizing Committee`

const DEFAULT_REJECTION_SUBJECT = 'Update on Your Abstract Submission {abstractId} - ISSH Midterm CME 2026'
const DEFAULT_REJECTION_BODY = `Dear {name},

Thank you for submitting your abstract titled "{title}" (ID: {abstractId}) to ISSH Midterm CME 2026.

After careful review by our scientific committee, we regret to inform you that your abstract has not been selected for presentation at this year's conference.

We appreciate your interest in ISSH Midterm CME 2026 and encourage you to submit again in the future.

Best regards,
ISSH 2026 Organizing Committee`

// Helper to replace placeholders in email templates
function replacePlaceholders(template: string, data: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '')
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }

    await connectDB()

    // Get reviewer config with pending emails and email templates
    const reviewerConfig = await ReviewerConfig.findOne()
    if (!reviewerConfig || !reviewerConfig.pendingEmails?.length) {
      return NextResponse.json({ 
        success: true, 
        message: 'No pending emails to send',
        sentCount: 0 
      })
    }

    // Get email templates from ReviewerConfig (with fallbacks)
    const acceptanceSubject = reviewerConfig.acceptanceEmailSubject || DEFAULT_ACCEPTANCE_SUBJECT
    const acceptanceBody = reviewerConfig.acceptanceEmailBody || DEFAULT_ACCEPTANCE_BODY
    const rejectionSubject = reviewerConfig.rejectionEmailSubject || DEFAULT_REJECTION_SUBJECT
    const rejectionBody = reviewerConfig.rejectionEmailBody || DEFAULT_REJECTION_BODY

    const pendingEmails = [...reviewerConfig.pendingEmails]
    let sentCount = 0
    let failedCount = 0
    const errors: string[] = []

    for (const pending of pendingEmails) {
      try {
        // Find the abstract with user info
        const abstract = await Abstract.findOne({ abstractId: pending.abstractId }).populate('userId')
        
        if (!abstract || !abstract.userId) {
          errors.push(`Abstract ${pending.abstractId} not found or has no user`)
          failedCount++
          continue
        }

        const authorUser = abstract.userId as any
        const authorName = `${authorUser.profile?.firstName || authorUser.firstName || ''} ${authorUser.profile?.lastName || authorUser.lastName || ''}`.trim() || authorUser.email
        const dashboardUrl = `${process.env.APP_URL || process.env.NEXTAUTH_URL}/dashboard/abstracts`

        // Prepare placeholder data
        const placeholderData = {
          name: authorName,
          title: abstract.title,
          abstractId: abstract.abstractId,
          approvedFor: abstract.approvedFor || 'presentation',
          dashboardUrl
        }

        if (pending.type === 'acceptance') {
          // Send acceptance email using ReviewerConfig templates
          const emailSubject = replacePlaceholders(acceptanceSubject, placeholderData)
          const emailBody = replacePlaceholders(acceptanceBody, placeholderData)
          
          await EmailService.sendCustomMessage({
            email: authorUser.email,
            recipientName: authorName,
            subject: emailSubject,
            content: emailBody
          })
          
          console.log(`✅ Acceptance email sent to ${authorUser.email} for abstract ${abstract.abstractId}`)
          sentCount++
        } else if (pending.type === 'rejection') {
          // Send rejection email using ReviewerConfig templates
          const emailSubject = replacePlaceholders(rejectionSubject, placeholderData)
          const emailBody = replacePlaceholders(rejectionBody, placeholderData)
          
          await EmailService.sendCustomMessage({
            email: authorUser.email,
            recipientName: authorName,
            subject: emailSubject,
            content: emailBody
          })
          
          console.log(`✅ Rejection email sent to ${authorUser.email} for abstract ${abstract.abstractId}`)
          sentCount++
        }
      } catch (emailError) {
        console.error(`Failed to send email for ${pending.abstractId}:`, emailError)
        errors.push(`Failed to send email for ${pending.abstractId}`)
        failedCount++
      }
    }

    // Clear the pending emails queue
    await ReviewerConfig.findOneAndUpdate(
      {},
      { $set: { pendingEmails: [] } }
    )

    // Log the action
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || ''
    
    await logAction({
      actor: {
        userId: (session.user as any).id,
        email: session.user.email || '',
        role: 'admin',
        name: session.user.name || ''
      },
      action: 'emails.bulk_sent',
      resourceType: 'email',
      resourceId: 'pending-emails',
      resourceName: 'Pending Review Emails',
      metadata: { ip, userAgent },
      changes: {
        before: { pendingCount: pendingEmails.length },
        after: { sentCount, failedCount }
      },
      description: `Admin sent ${sentCount} pending review notification emails (${failedCount} failed)`
    })

    return NextResponse.json({ 
      success: true, 
      message: `Successfully sent ${sentCount} emails${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
      sentCount,
      failedCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Error sending pending emails:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// GET - Get pending emails count and details
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }

    await connectDB()

    const reviewerConfig = await ReviewerConfig.findOne()
    const pendingEmails = reviewerConfig?.pendingEmails || []

    return NextResponse.json({ 
      success: true, 
      data: {
        count: pendingEmails.length,
        emails: pendingEmails
      }
    })

  } catch (error) {
    console.error('Error fetching pending emails:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
