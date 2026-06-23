import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/lib/email/service'
import { conferenceConfig, getEmailSubject } from '@/config/conference.config'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, type = 'test' } = body

  if (!email) {
    return NextResponse.json({
      success: false,
      message: 'Email is required'
    }, { status: 400 })
  }

  try {

    let result

    switch (type) {
      case 'registration':
        result = await EmailService.sendRegistrationConfirmation({
          email,
          name: 'Test User',
          registrationId: 'TEST-001',
          registrationType: 'regular',
          registrationTypeLabel: 'Regular Delegate',
          workshopSelections: [{id: 'test-ws', name: 'Test Workshop'}],
          accompanyingPersons: [{name: 'John Doe', age: 35, relationship: 'Spouse'}]
        })
        break

      case 'payment':
        result = await EmailService.sendPaymentConfirmation({
          email,
          name: 'Test User',
          registrationId: 'TEST-001',
          amount: 15000,
          currency: 'INR',
          transactionId: 'TEST-TXN-001',
          paymentDate: new Date().toISOString(),
          breakdown: {
            registrationType: 'regular',
            baseAmount: 15000,
            workshopFees: [],
            accompanyingPersonFees: 0,
            discountsApplied: []
          }
        })
        break

      default:
        // Simple test email
        const { sendEmail } = await import('@/lib/email/smtp')
        result = await sendEmail({
          to: email,
          subject: getEmailSubject('Test Email'),
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: ${conferenceConfig.theme.primary};">Email Test Successful!</h2>
              <p>Hello,</p>
              <p>This is a test email from your ${conferenceConfig.shortName} Conference platform.</p>
              <p>If you received this email, your SMTP configuration is working correctly!</p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>System Information:</h3>
                <ul>
                  <li><strong>Timestamp:</strong> ${new Date().toLocaleString()}</li>
                  <li><strong>Server:</strong> localhost:3001</li>
                  <li><strong>Environment:</strong> Development</li>
                </ul>
              </div>
              <p>Best regards,<br>
              <strong>${conferenceConfig.shortName} Team</strong></p>
            </div>
          `,
          text: `Email Test Successful! This is a test email from ${conferenceConfig.shortName} Conference platform. Timestamp: ${new Date().toLocaleString()}`
        })
    }

    return NextResponse.json({
      success: true,
      message: `Test email (${type}) sent successfully`,
      result
    })

  } catch (error) {
    console.error('Test email error:', error)
    // Check if template is enabled
    const { isTemplateEnabled } = await import('@/lib/email/config')
    
    if (!isTemplateEnabled(type)) {
      return NextResponse.json({
        success: false,
        message: `Email template '${type}' is disabled. Enable it in email config.`
      })
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to send test email',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}