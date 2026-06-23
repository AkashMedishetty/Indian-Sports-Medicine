import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import { EmailService } from '@/lib/email/service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is admin
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    const adminUser = await User.findById((session.user as any).id)
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 })
    }

    const body = await request.json()
    const { subject, content, recipients, senderName } = body

    if (!subject || !content) {
      return NextResponse.json({
        success: false,
        message: 'Subject and content are required'
      }, { status: 400 })
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'At least one recipient is required'
      }, { status: 400 })
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = recipients.filter(email => !emailRegex.test(email))
    
    if (invalidEmails.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Invalid email addresses: ${invalidEmails.join(', ')}`
      }, { status: 400 })
    }

    // Send bulk email
    const result = await EmailService.sendBulkEmail({
      recipients,
      subject,
      content,
      senderName: senderName || `${adminUser.profile.firstName} ${adminUser.profile.lastName}`
    })

    if ((result as any).success) {
      // Count successful and failed sends
      const results = result as any
      let sent = 0
      let failed = 0
      const errors: string[] = []

      if (Array.isArray(results)) {
        results.forEach((res: any) => {
          if (res.status === 'fulfilled' && res.value?.success) {
            sent++
          } else {
            failed++
            if (res.reason || res.value?.error) {
              errors.push(res.reason?.message || res.value?.error || 'Unknown error')
            }
          }
        })
      } else {
        sent = recipients.length
      }

      return NextResponse.json({
        success: true,
        message: `Email sent successfully to ${sent} recipients`,
        sent,
        failed,
        errors: errors.slice(0, 5) // Limit error messages
      })
    } else {
      return NextResponse.json({
        success: false,
        message: (result as any).error || 'Failed to send bulk email',
        sent: 0,
        failed: recipients.length,
        errors: [(result as any).error || 'Unknown error']
      })
    }

  } catch (error) {
    console.error('Bulk email error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}