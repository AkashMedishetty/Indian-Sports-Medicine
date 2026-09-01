import nodemailer from 'nodemailer'
import { conferenceConfig } from '../../config/conference.config'
import connectDB from '../mongodb'

// Create reusable transporter object using SMTP
export async function createSMTPTransporter() {
  // Always use environment variables for SMTP configuration
  // Check if SMTP is configured
  const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS
  
  // Only simulate when SMTP is genuinely NOT configured. We intentionally do NOT
  // fall back to simulation on a live SMTP *error* — a real send failure must
  // surface (recorded as 'failed'), not be silently disguised as 'sent'.
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('⚠️ SMTP not configured (SMTP_HOST/USER/PASS missing) — emails will be SIMULATED, not sent.')
    return {
      sendMail: async (mailOptions: any) => {
        console.log('📧 EMAIL SIMULATION (SMTP not configured) — To:', mailOptions.to, '| Subject:', mailOptions.subject)
        return { messageId: 'simulated-' + Date.now() }
      },
      verify: async () => true
    }
  }

  // Create the transporter and return it directly. We deliberately skip the
  // pre-send transporter.verify() call: it performs a full extra AUTH handshake
  // before every message, and providers like GoDaddy Professional Email throttle
  // bursts of logins with a "535 Authentication Failed" even when the credentials
  // are correct. sendMail() authenticates on its own; if it fails, the error
  // propagates to the caller (and is logged + recorded as 'failed').
  return nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false
    }
  })
}

// Send email function
export async function sendEmail({
  to,
  subject,
  html,
  text,
  attachments = [],
  // Optional tracking metadata
  userId,
  userName,
  templateName,
  category
}: {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  attachments?: any[]
  // Optional tracking metadata
  userId?: string
  userName?: string
  templateName?: string
  category?: 'registration' | 'payment' | 'abstract' | 'system' | 'reminder' | 'custom' | 'sponsor'
}) {
  try {
    const transporter = await createSMTPTransporter()
    
    // Use environment variables for SMTP settings, fallback to conferenceConfig
    const fromEmail = process.env.SMTP_USER || process.env.EMAIL_USER || conferenceConfig.contact.email
    const fromName = process.env.APP_NAME || conferenceConfig.email.fromName

    console.log(`📧 Sending email using SMTP: ${fromEmail}`)

    const mailOptions = {
      from: {
        name: fromName,
        address: fromEmail
      },
      to: Array.isArray(to) ? to.join(', ') : to,
      replyTo: fromEmail,
      subject,
      html,
      text,
      attachments
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', result.messageId)

    // Save to EmailHistory for tracking
    try {
      await connectDB()
      const EmailHistory = (await import('../models/EmailHistory')).default
      
      const recipientEmail = Array.isArray(to) ? to[0] : to
      const attachmentMeta = attachments?.map((a: any) => ({
        filename: a.filename || 'attachment',
        contentType: a.contentType || 'application/octet-stream',
        size: a.content?.length || 0
      }))

      await EmailHistory.create({
        recipient: {
          userId: userId || undefined,
          email: recipientEmail.toLowerCase(),
          name: userName || recipientEmail.split('@')[0]
        },
        subject,
        htmlContent: html || '',
        plainTextContent: text || '',
        templateName: templateName || 'direct-email',
        templateData: {},
        category: category || 'system',
        attachments: attachmentMeta,
        status: 'sent',
        messageId: result.messageId,
        sentAt: new Date()
      })
      console.log('📝 Email recorded to history')
    } catch (historyError) {
      console.warn('⚠️ Failed to save email to history (non-blocking):', historyError)
      // Don't fail the email send if history save fails
    }

    return {
      success: true,
      messageId: result.messageId
    }
  } catch (error) {
    console.error('Email sending error:', error)
    
    // Try to save failed email to history
    try {
      await connectDB()
      const EmailHistory = (await import('../models/EmailHistory')).default
      
      const recipientEmail = Array.isArray(to) ? to[0] : to
      await EmailHistory.create({
        recipient: {
          userId: userId || undefined,
          email: recipientEmail.toLowerCase(),
          name: userName || recipientEmail.split('@')[0]
        },
        subject,
        htmlContent: html || '',
        plainTextContent: text || '',
        templateName: templateName || 'direct-email',
        templateData: {},
        category: category || 'system',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        sentAt: new Date()
      })
    } catch (historyError) {
      console.warn('⚠️ Failed to save failed email to history:', historyError)
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Send bulk emails with rate limiting
export async function sendBulkEmails({
  recipients,
  subject,
  html,
  text,
  batchSize = 10,
  delay = 1000
}: {
  recipients: string[]
  subject: string
  html?: string
  text?: string
  batchSize?: number
  delay?: number
}) {
  const results = []
  
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize)
    
    const batchPromises = batch.map(email => 
      sendEmail({ to: email, subject, html, text })
    )
    
    const batchResults = await Promise.allSettled(batchPromises)
    results.push(...batchResults)
    
    // Add delay between batches to avoid rate limiting
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  return results
}