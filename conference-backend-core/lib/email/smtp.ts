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
  
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('SMTP configuration incomplete. Email functionality will be simulated.')
    console.log('Required variables: SMTP_HOST, SMTP_USER, SMTP_PASS')
    console.log('Current values:', { 
      host: smtpHost ? 'SET' : 'NOT SET', 
      user: smtpUser ? 'SET' : 'NOT SET', 
      pass: smtpPass ? 'SET' : 'NOT SET' 
    })
    
    // Return a mock transporter for development
    return {
      sendMail: async (mailOptions: any) => {
        console.log('📧 EMAIL SIMULATION - Would send email:')
        console.log('To:', mailOptions.to)
        console.log('Subject:', mailOptions.subject)
        console.log('Content:', mailOptions.text || 'HTML content provided')
        return { messageId: 'simulated-' + Date.now() }
      },
      verify: async () => true
    }
  }

  // SMTP configuration
  const smtpConfig = {
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
  }

  // Create transporter
  const transporter = nodemailer.createTransport(smtpConfig)

  // Verify connection configuration
  try {
    await transporter.verify()
    console.log('✅ SMTP server is ready to take our messages')
    return transporter
  } catch (error) {
    console.error('❌ SMTP connection error:', error)
    console.warn('⚠️ Falling back to email simulation mode')
    
    // Return mock transporter on error
    return {
      sendMail: async (mailOptions: any) => {
        console.log('📧 EMAIL SIMULATION (SMTP Error) - Would send email:')
        console.log('To:', mailOptions.to)
        console.log('Subject:', mailOptions.subject)
        console.log('Content:', mailOptions.text || 'HTML content provided')
        console.log('Error details:', error)
        return { messageId: 'simulated-error-' + Date.now() }
      },
      verify: async () => true
    }
  }
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