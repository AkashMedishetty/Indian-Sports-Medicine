import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { EmailService } from '@/lib/email/service'
import { sendEmail } from '@/conference-backend-core/lib/email/smtp'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { testEmail, emailType } = body

    if (!testEmail) {
      return NextResponse.json({ success: false, message: 'testEmail is required' }, { status: 400 })
    }

    const results: Array<{ type: string; success: boolean; error?: string }> = []
    const typesToSend = emailType === 'all' 
      ? ['acceptance', 'schedule', 'sponsored'] 
      : [emailType]

    for (const type of typesToSend) {
      try {
        switch (type) {
          case 'acceptance': {
            await EmailService.sendAbstractAcceptance({
              email: testEmail,
              name: 'Dr. Test User',
              registrationId: 'ISSH2026-TEST',
              abstractId: 'ABS-TEST-001',
              title: 'A Novel Approach to Microsurgical Nerve Repair Using Biodegradable Conduits',
              track: 'Free Paper',
              authors: ['Dr. Test User', 'Dr. Co-Author', 'Prof. Senior Author'],
              reviewedAt: new Date().toISOString(),
              approvedFor: 'free-paper'
            })
            results.push({ type: 'acceptance (Free Paper)', success: true })

            await EmailService.sendAbstractAcceptance({
              email: testEmail,
              name: 'Dr. Test User',
              registrationId: 'ISSH2026-TEST',
              abstractId: 'ABS-TEST-002',
              title: 'Functional Outcomes of Tendon Transfer in Radial Nerve Palsy: A 5-Year Follow-Up',
              track: 'Award Paper',
              authors: ['Dr. Test User'],
              reviewedAt: new Date().toISOString(),
              approvedFor: 'award-paper'
            })
            results.push({ type: 'acceptance (Award Paper)', success: true })

            await EmailService.sendAbstractAcceptance({
              email: testEmail,
              name: 'Dr. Test User',
              registrationId: 'ISSH2026-TEST',
              abstractId: 'ABS-TEST-003',
              title: 'E-Poster: Rare Case of Giant Cell Tumor of Tendon Sheath in the Hand',
              track: 'E-Poster',
              authors: ['Dr. Test User', 'Dr. Another Author'],
              reviewedAt: new Date().toISOString(),
              approvedFor: 'e-poster'
            })
            results.push({ type: 'acceptance (E-Poster)', success: true })
            break
          }

          case 'schedule': {
            const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || ''
            const scheduleHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; background: linear-gradient(135deg, #25406b, #152843); color: white; padding: 30px; border-radius: 12px 12px 0 0;">
                  <h1 style="margin: 0 0 8px 0; font-size: 24px;">📋 Your Presentation Schedule</h1>
                  <h2 style="margin: 0; font-weight: normal; font-size: 16px; opacity: 0.9;">${conferenceConfig.shortName} — April 25-26, 2026</h2>
                </div>
                <div style="background: white; padding: 25px; border: 1px solid #e5e7eb; border-top: none;">
                  <p style="font-size: 16px; color: #374151;">Dear Dr. Test User,</p>
                  <p style="font-size: 15px; color: #374151;">We are pleased to share your presentation schedule for ${conferenceConfig.shortName}.</p>
                  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                      <tr style="background: #25406b; color: white;">
                        <th style="padding: 10px; border: 1px solid #25406b; text-align: left;">Time</th>
                        <th style="padding: 10px; border: 1px solid #25406b; text-align: left;">Title</th>
                        <th style="padding: 10px; border: 1px solid #25406b; text-align: center;">Category</th>
                        <th style="padding: 10px; border: 1px solid #25406b; text-align: center;">Hall</th>
                        <th style="padding: 10px; border: 1px solid #25406b; text-align: center;">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #25406b;">09:00AM - 09:07AM</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">A Novel Approach to Microsurgical Nerve Repair</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;"><span style="background: #dbeafe; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">Free Paper</span></td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">Hall-B</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">25/04/2026</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #25406b;">08:20AM - 08:30AM</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">Functional Outcomes of Tendon Transfer in Radial Nerve Palsy</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;"><span style="background: #fef3c7; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">Award Paper</span></td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">Hall-A</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">26/04/2026</td>
                      </tr>
                    </tbody>
                  </table>
                  <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                    <h4 style="margin: 0 0 8px 0; color: #0c4a6e;">📌 Important Reminders</h4>
                    <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
                      <li>Please arrive at the hall <strong>15 minutes before</strong> your scheduled time</li>
                      <li>Presentation duration is <strong>7 minutes</strong> including Q&A</li>
                      <li>Please carry your presentation on a USB drive as backup</li>
                    </ul>
                  </div>
                  <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                    <h4 style="margin: 0 0 8px 0; color: #166534;">🏨 Venue Details</h4>
                    <p style="margin: 0; color: #374151; font-size: 14px;"><strong>${conferenceConfig.venue.name}</strong><br>${conferenceConfig.venue.city}, ${conferenceConfig.venue.state}<br>April 25-26, 2026</p>
                  </div>
                  <p style="color: #374151; font-size: 14px;">Best regards,<br><strong>${conferenceConfig.shortName} Scientific Committee</strong></p>
                </div>
              </div>
            `
            await sendEmail({
              to: testEmail,
              subject: `📋 [TEST] Your Presentation Schedule — ${conferenceConfig.shortName}`,
              html: scheduleHtml,
              text: 'Test schedule email',
              templateName: 'test-schedule',
              category: 'system'
            })
            results.push({ type: 'schedule', success: true })
            break
          }

          case 'sponsored': {
            const { getRegistrationAcceptanceTemplate } = await import('@/conference-backend-core/lib/email/templates')
            const html = getRegistrationAcceptanceTemplate({
              name: 'Dr. Test User',
              registrationId: 'ISSH2026-TEST',
              registrationType: 'Sponsored by TestPharma Pvt Ltd',
              email: testEmail,
              amount: 0,
              currency: 'INR',
              password: '9876543210'
            })
            await sendEmail({
              to: testEmail,
              subject: `[TEST] ISSH Midterm CME 2026 - Registration Confirmed (Sponsored)`,
              html,
              text: 'Test sponsored registration email',
              templateName: 'test-sponsored',
              category: 'system'
            })
            results.push({ type: 'sponsored', success: true })
            break
          }

          default:
            results.push({ type, success: false, error: 'Unknown email type' })
        }
      } catch (err: any) {
        results.push({ type, success: false, error: err.message })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${results.filter(r => r.success).length} test emails to ${testEmail}`,
      data: results
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
