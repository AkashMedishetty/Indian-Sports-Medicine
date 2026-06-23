import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import { sendEmailWithHistory } from '@/conference-backend-core/lib/email/email-with-history'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const admin = await User.findById((session.user as any).id)
    if (!admin || admin.role !== 'admin') return NextResponse.json({ success: false, message: 'Admin required' }, { status: 403 })

    const { subject, message, facultyIds } = await request.json()

    if (!subject || !message) {
      return NextResponse.json({ success: false, message: 'Subject and message are required' }, { status: 400 })
    }

    // Get faculty members
    const query: any = { 'registration.type': 'faculty', role: 'user' }
    if (facultyIds && facultyIds.length > 0) {
      query._id = { $in: facultyIds }
    }

    const facultyMembers = await User.find(query).select('email profile._id').lean()

    if (facultyMembers.length === 0) {
      return NextResponse.json({ success: false, message: 'No faculty members found' }, { status: 404 })
    }

    let sent = 0
    let failed = 0

    for (const member of facultyMembers) {
      try {
        const name = `${member.profile?.firstName || ''} ${member.profile?.lastName || ''}`.trim()
        const personalizedMessage = message
          .replace(/\{name\}/g, name || 'Faculty Member')
          .replace(/\{email\}/g, member.email)

        await sendEmailWithHistory({
          to: member.email,
          subject,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#1a365d;">${conferenceConfig.shortName}</h2>
            <div>${personalizedMessage}</div>
            <hr style="margin:20px 0;border:none;border-top:1px solid #e2e8f0;" />
            <p style="color:#718096;font-size:12px;">${conferenceConfig.shortName} Team</p>
          </div>`,
          text: personalizedMessage.replace(/<[^>]*>/g, ''),
          userId: (member as any)._id,
          userName: name,
          templateName: 'faculty-custom-email',
          category: 'custom'
        })
        sent++
      } catch {
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Email sent to ${sent} faculty members${failed > 0 ? `, ${failed} failed` : ''}`,
      data: { sent, failed, total: facultyMembers.length }
    })
  } catch (error) {
    console.error('Faculty email error:', error)
    return NextResponse.json({ success: false, message: 'Failed to send emails' }, { status: 500 })
  }
}
