import { sendEmail, sendBulkEmails } from './smtp'
import { 
  getRegistrationConfirmationTemplate, 
  getPaymentConfirmationTemplate, 
  getPasswordResetTemplate,
  getBulkEmailTemplate,
  getPaymentReminderTemplate,
  getCustomMessageTemplate,
  getRegistrationAcceptanceTemplate
} from './templates'
import { getEmailConfig } from '@/lib/config'
import { emailTemplateConfig } from './config'
import { conferenceConfig } from '../../config/conference.config'

/**
 * Generate ICS calendar file for conference
 */
function generateICS(userData: {
  name: string
  registrationId: string
  email: string
}): string {
  const startDate = new Date(conferenceConfig.eventDate.start)
  const endDate = new Date(conferenceConfig.eventDate.end)
  
  // Format dates for ICS (YYYYMMDDTHHMMSSZ)
  const formatICSDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }
  
  const now = new Date()
  const dtstamp = formatICSDate(now)
  const dtstart = formatICSDate(startDate)
  const dtend = formatICSDate(endDate)
  
  // Generate unique UID
  const uid = `${userData.registrationId}-${now.getTime()}@${conferenceConfig.contact.website.replace(/https?:\/\//, '')}`
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PurpleHat Events//Conference Registration//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${conferenceConfig.name}`,
    `DESCRIPTION:You are registered for ${conferenceConfig.name}.\\nRegistration ID: ${userData.registrationId}\\n\\nFor more information\\, visit: ${conferenceConfig.contact.website}`,
    `LOCATION:${conferenceConfig.venue.name}\\, ${conferenceConfig.venue.address}\\, ${conferenceConfig.venue.city}\\, ${conferenceConfig.venue.state} ${conferenceConfig.venue.pincode}\\, ${conferenceConfig.venue.country}`,
    `ORGANIZER;CN=${conferenceConfig.shortName}:mailto:${conferenceConfig.contact.email}`,
    `ATTENDEE;CN=${userData.name};RSVP=TRUE:mailto:${userData.email}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${conferenceConfig.name} starts tomorrow!`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')
  
  return icsContent
}

export class EmailService {
  /**
   * Send registration confirmation email
   */
  static async sendRegistrationConfirmation(userData: {
    userId?: string
    email: string
    name: string
    registrationId: string
    registrationType: string
    registrationTypeLabel: string
    workshopSelections?: Array<{id: string, name: string}>
    accompanyingPersons?: Array<{name: string, age: number, relationship: string}>
    accommodation?: { required: boolean, roomType: string, checkIn: string, checkOut: string, nights: number, totalAmount: number }
    paymentMethod?: 'bank_transfer' | 'payment_gateway'
  }) {
    try {
      // Use static config by default, but allow database override for template content
      let template = emailTemplateConfig.templates.registration
      
      try {
        const dbEmailConfig = await getEmailConfig()
        if (dbEmailConfig?.templates?.registration) {
          template = { ...template, ...dbEmailConfig.templates.registration }
        }
      } catch (error) {
        console.log('Using static email config - database config unavailable')
      }
      
      if (!template?.enabled) {
        console.log('Registration email template is disabled')
        return { success: false, message: 'Email template disabled' }
      }

      const html = getRegistrationConfirmationTemplate({
        name: userData.name,
        registrationId: userData.registrationId,
        registrationType: userData.registrationType,
        registrationTypeLabel: userData.registrationTypeLabel,
        email: userData.email,
        workshopSelections: userData.workshopSelections,
        accompanyingPersons: userData.accompanyingPersons,
        accommodation: userData.accommodation,
        paymentMethod: userData.paymentMethod || 'bank_transfer'
      })
      
      // Generate ICS calendar file
      const icsContent = generateICS({
        name: userData.name,
        registrationId: userData.registrationId,
        email: userData.email
      })
      
      return await sendEmail({
        to: userData.email,
        subject: template.subject || `Application Received - ${conferenceConfig.shortName}`,
        html,
        text: `Registration confirmation for ${userData.name}. Registration ID: ${userData.registrationId}`,
        attachments: [
          {
            filename: `${conferenceConfig.shortName.replace(/\s+/g, '-')}-${userData.registrationId}.ics`,
            content: Buffer.from(icsContent, 'utf-8'),
            contentType: 'text/calendar; charset=utf-8; method=REQUEST'
          }
        ],
        userId: userData.userId,
        userName: userData.name,
        templateName: 'registration-confirmation',
        category: 'registration'
      })
    } catch (error) {
      console.error('Error sending registration confirmation:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Send payment confirmation and invoice email
   */
  static async sendPaymentConfirmation(paymentData: {
    userId?: string
    email: string
    name: string
    registrationId: string
    amount: number
    verificationDate?: Date
    currency?: string
    transactionId?: string
    paymentDate?: string
    breakdown?: any
  }) {
    try {
      // Use static config by default, but allow database override for template content
      let template = emailTemplateConfig.templates.payment
      
      try {
        const dbEmailConfig = await getEmailConfig()
        if (dbEmailConfig?.templates?.payment) {
          template = { ...template, ...dbEmailConfig.templates.payment }
        }
      } catch (error) {
        console.log('Using static email config - database config unavailable')
      }
      
      if (!template?.enabled) {
        console.log('Payment email template is disabled')
        return { success: false, message: 'Email template disabled' }
      }

      const html = getPaymentConfirmationTemplate({
        ...paymentData,
        currency: paymentData.currency || 'INR',
        transactionId: paymentData.transactionId || 'N/A',
        paymentDate: paymentData.paymentDate || new Date().toLocaleDateString(),
        breakdown: paymentData.breakdown || {}
      })

      // Generate PDF invoice for email attachment
      let pdfBuffer: Buffer | null = null
      try {
        const { InvoiceGenerator } = await import('@/lib/pdf/invoice-generator')
        
        // Get current pricing tier dynamically
        let currentTierName = 'Regular'
        try {
          const { getCurrentTierPricing } = await import('@/config/pricing.config')
          const currentTier = getCurrentTierPricing()
          currentTierName = currentTier.name || 'Regular'
        } catch (error) {
          console.log('Could not fetch pricing tier, using default')
        }
        
        // Parse workshop selections from breakdown
        const workshopSelections = paymentData.breakdown?.workshopFees?.map((w: any) => w.name) || []
        
        // Parse accompanying persons from breakdown
        const accompanyingPersons = paymentData.breakdown?.accompanyingPersonDetails?.map((p: any) => ({
          name: p.name,
          relationship: `Age: ${p.age}`
        })) || []
        
        // Determine payment method dynamically
        let paymentMethod = 'Online Payment'
        if (paymentData.breakdown?.paymentMethod) {
          switch (paymentData.breakdown.paymentMethod) {
            case 'payment_gateway':
            case 'online':
            case 'razorpay':
              paymentMethod = 'Online Payment'
              break
            case 'bank_transfer':
            case 'bank-transfer':
              paymentMethod = 'Bank Transfer'
              break
            case 'netbanking':
              paymentMethod = 'Net Banking'
              break
            case 'upi':
              paymentMethod = 'UPI'
              break
            default:
              paymentMethod = paymentData.breakdown.paymentMethod
          }
        }
        
        // Create user object with actual breakdown data
        const userDataForPDF = {
          profile: {
            name: paymentData.name,
            email: paymentData.email,
            phone: '',
            address: '',
            mciNumber: ''
          },
          email: paymentData.email,
          registration: {
            registrationId: paymentData.registrationId,
            type: paymentData.breakdown?.registrationType || 'non-member',
            tier: currentTierName,
            workshopSelections: workshopSelections,
            accompanyingPersons: accompanyingPersons
          },
          payment: {
            amount: paymentData.amount,
            status: 'completed',
            method: paymentMethod,
            utr: paymentData.transactionId,
            transactionId: paymentData.transactionId,
            paidAt: paymentData.paymentDate || new Date().toISOString(),
            breakdown: {
              registration: paymentData.breakdown?.baseAmount || paymentData.breakdown?.registration || 0,
              gst: paymentData.breakdown?.gst || 0,
              workshops: paymentData.breakdown?.workshops || 0,
              accompanyingPersons: paymentData.breakdown?.accompanyingPersonFees || paymentData.breakdown?.accompanyingPersons || 0,
              accommodation: paymentData.breakdown?.accommodation || paymentData.breakdown?.accommodationFees || 0,
              discount: paymentData.breakdown?.discount || 0
            }
          }
        }
        
        pdfBuffer = await InvoiceGenerator.generatePDFFromUser(userDataForPDF)
      } catch (pdfError) {
        console.error('PDF generation failed for email:', pdfError)
      }

      const fileName = `${paymentData.registrationId}-INV-${conferenceConfig.shortName.replace(/\s+/g, '')}.pdf`
      
      return await sendEmail({
        to: paymentData.email,
        subject: template.subject || `Payment Confirmation & Invoice - ${conferenceConfig.shortName}`,
        html,
        text: `Payment confirmation for ${paymentData.name}. Amount: ${paymentData.currency} ${paymentData.amount}`,
        attachments: pdfBuffer ? [
          {
            filename: fileName,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ] : [],
        userId: paymentData.userId,
        userName: paymentData.name,
        templateName: 'payment-confirmation',
        category: 'payment'
      })
    } catch (error) {
      console.error('Error sending payment confirmation:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Send registration acceptance email with invoice
   */
  static async sendRegistrationAcceptance(acceptanceData: {
    userId?: string
    email: string
    name: string
    registrationId: string
    registrationType: string
    amount: number
    currency?: string
    transactionId?: string
    workshopSelections?: string[]
    accompanyingPersons?: number
    accompanyingPersonsDetails?: Array<{ name: string; relationship: string }>
    accommodation?: { required: boolean, roomType: string, checkIn: string, checkOut: string, nights: number, totalAmount: number }
    breakdown?: {
      registration: number
      workshops: number
      accompanyingPersons: number
      discount: number
    }
    tier?: string
    paymentMethod?: string
    paymentDate?: Date | string
    phone?: string
    address?: string
    mciNumber?: string
    password?: string
  }) {
    try {
      // Use static config by default
      let template = emailTemplateConfig.templates.registration
      
      try {
        const dbEmailConfig = await getEmailConfig()
        if (dbEmailConfig?.templates?.registration) {
          template = { ...template, ...dbEmailConfig.templates.registration }
        }
      } catch (error) {
        console.log('Using static email config - database config unavailable')
      }
      
      if (!template?.enabled) {
        console.log('Registration acceptance email template is disabled')
        return { success: false, message: 'Email template disabled' }
      }

      // Generate QR code for registration
      let qrCodeDataURL: string | undefined
      let qrCodeBuffer: Buffer | undefined
      try {
        const { QRCodeGenerator } = await import('@/lib/utils/qrcode-generator')
        qrCodeDataURL = await QRCodeGenerator.generateRegistrationQR({
          registrationId: acceptanceData.registrationId,
          name: acceptanceData.name,
          email: acceptanceData.email,
          type: acceptanceData.registrationType
        })
        qrCodeBuffer = await QRCodeGenerator.generateRegistrationQRBuffer({
          registrationId: acceptanceData.registrationId,
          name: acceptanceData.name,
          email: acceptanceData.email,
          type: acceptanceData.registrationType
        })
        console.log('QR Code generated successfully:', qrCodeDataURL ? 'Data URL created' : 'No data URL')
        console.log('QR Buffer generated:', qrCodeBuffer ? `${qrCodeBuffer.length} bytes` : 'No buffer')
      } catch (qrError) {
        console.error('Failed to generate QR code:', qrError)
        // Continue without QR code
      }

      const html = getRegistrationAcceptanceTemplate({
        ...acceptanceData,
        currency: acceptanceData.currency || 'INR',
        qrCodeDataURL,
        password: acceptanceData.password
      })

      // Generate PDF invoice for email attachment
      let pdfBuffer: Buffer | null = null
      try {
        const { InvoiceGenerator } = await import('@/lib/pdf/invoice-generator')
        
        // If breakdown is provided, use it; otherwise try to calculate from data
        const breakdown = (acceptanceData as any).breakdown || {
          registration: acceptanceData.amount,
          gst: 0,
          workshops: 0,
          accompanyingPersons: 0,
          accommodation: 0,
          discount: 0
        };
        
        // Parse accompanying persons
        let accompanyingPersons: Array<{ name: string; relationship: string }> = [];
        if ((acceptanceData as any).accompanyingPersonsDetails && Array.isArray((acceptanceData as any).accompanyingPersonsDetails)) {
          accompanyingPersons = (acceptanceData as any).accompanyingPersonsDetails;
        } else if (acceptanceData.accompanyingPersons && typeof acceptanceData.accompanyingPersons === 'number' && acceptanceData.accompanyingPersons > 0) {
          // Create placeholder entries if only count is provided
          for (let i = 0; i < acceptanceData.accompanyingPersons; i++) {
            accompanyingPersons.push({ name: `Accompanying Person ${i + 1}`, relationship: 'Guest' });
          }
        }
        
        // Create a mock user object for PDF generation
        const mockUser = {
          profile: {
            name: acceptanceData.name,
            email: acceptanceData.email,
            phone: (acceptanceData as any).phone || '',
            address: (acceptanceData as any).address || '',
            mciNumber: (acceptanceData as any).mciNumber || ''
          },
          email: acceptanceData.email,
          registration: {
            registrationId: acceptanceData.registrationId,
            type: acceptanceData.registrationType,
            tier: (acceptanceData as any).tier || 'Standard',
            workshopSelections: acceptanceData.workshopSelections || [],
            accompanyingPersons: accompanyingPersons,
            accommodation: acceptanceData.accommodation || undefined
          },
          payment: {
            amount: acceptanceData.amount,
            status: 'verified',
            method: (acceptanceData as any).paymentMethod || 'Bank Transfer',
            utr: acceptanceData.transactionId,
            transactionId: acceptanceData.transactionId,
            paidAt: (acceptanceData as any).paymentDate || new Date().toISOString(),
            paymentDate: (acceptanceData as any).paymentDate || new Date().toISOString(),
            breakdown: breakdown
          }
        }
        
        pdfBuffer = await InvoiceGenerator.generatePDFFromUser(mockUser)
      } catch (pdfError) {
        console.error('PDF generation failed for acceptance email:', pdfError)
      }

      const fileName = `${acceptanceData.registrationId}-INV-${conferenceConfig.shortName.replace(/\s+/g, '')}.pdf`
      const qrFileName = `${acceptanceData.registrationId}-QR.png`
      
      const attachments: any[] = []
      
      // Add invoice PDF
      if (pdfBuffer) {
        attachments.push({
          filename: fileName,
          content: pdfBuffer,
          contentType: 'application/pdf'
        })
      }
      
      // Add QR code image as both attachment and embedded image
      if (qrCodeBuffer) {
        attachments.push({
          filename: qrFileName,
          content: qrCodeBuffer,
          contentType: 'image/png'
        })
        
        // Also add as embedded image for email display
        attachments.push({
          filename: 'qr-code-embedded.png',
          content: qrCodeBuffer,
          contentType: 'image/png',
          cid: 'qr-code-embedded' // This allows us to reference it in HTML as src="cid:qr-code-embedded"
        })
      }
      
      return await sendEmail({
        to: acceptanceData.email,
        subject: `Registration Confirmed - Welcome to ${conferenceConfig.shortName}`,
        html,
        text: `Registration confirmed for ${acceptanceData.name}. Registration ID: ${acceptanceData.registrationId}`,
        attachments,
        userId: acceptanceData.userId,
        userName: acceptanceData.name,
        templateName: 'registration-acceptance',
        category: 'registration'
      })
    } catch (error) {
      console.error('Error sending registration acceptance:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Send payment rejection email
   */
  static async sendPaymentRejection(rejectionData: {
    userId?: string
    email: string
    name: string
    registrationId: string
    reason: string
    rejectionDate: Date
  }) {
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Payment Verification Failed - ${conferenceConfig.shortName}</h2>
          <p>Dear ${rejectionData.name},</p>
          <p>We regret to inform you that your payment verification for ${conferenceConfig.shortName} has not been successful.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #dc3545; margin: 20px 0;">
            <strong>Registration ID:</strong> ${rejectionData.registrationId}<br>
            <strong>Rejection Date:</strong> ${rejectionData.rejectionDate.toLocaleDateString()}<br>
            <strong>Reason:</strong> ${rejectionData.reason}
          </div>
          <p>Please contact our team at <a href="mailto:contact@gmail.com">contact@gmail.com</a> if you believe this is an error or need assistance.</p>
          <p>Best regards,<br>${conferenceConfig.shortName} Team</p>
        </div>
      `;
      
      return await sendEmail({
        to: rejectionData.email,
        subject: `Payment Verification Failed - ${conferenceConfig.shortName}`,
        html,
        text: `Payment verification failed for registration ${rejectionData.registrationId}. Reason: ${rejectionData.reason}`,
        userId: rejectionData.userId,
        userName: rejectionData.name,
        templateName: 'payment-rejection',
        category: 'payment'
      })
    } catch (error) {
      console.error('Error sending payment rejection:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(resetData: {
    userId?: string
    email: string
    name: string
    resetLink: string
    expiryTime: string
  }) {
    try {
      // Use static config by default, but allow database override for template content
      let template = emailTemplateConfig.templates.passwordReset
      
      try {
        const dbEmailConfig = await getEmailConfig()
        if (dbEmailConfig?.templates?.passwordReset) {
          template = { ...template, ...dbEmailConfig.templates.passwordReset }
        }
      } catch (error) {
        console.log('Using static email config - database config unavailable')
      }
      
      if (!template?.enabled) {
        console.log('Password reset email template is disabled')
        return { success: false, message: 'Email template disabled' }
      }

      const html = getPasswordResetTemplate(resetData)
      
      return await sendEmail({
        to: resetData.email,
        subject: template.subject || `Password Reset - ${conferenceConfig.shortName}`,
        html,
        text: `Password reset request for ${resetData.name}. Reset link: ${resetData.resetLink}`,
        userId: resetData.userId,
        userName: resetData.name,
        templateName: 'password-reset',
        category: 'system'
      })
    } catch (error) {
      console.error('Error sending password reset email:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Send bulk email to multiple recipients
   */
  static async sendBulkEmail(emailData: {
    recipients: Array<{ email: string; userId?: string; name?: string }> | string[]
    subject: string
    content: string
    senderName?: string
  }) {
    try {
      // Use static config by default, but allow database override for template content
      let template = emailTemplateConfig.templates.bulkEmail
      let rateLimiting = {}
      
      try {
        const dbEmailConfig = await getEmailConfig()
        if (dbEmailConfig?.templates?.bulkEmail) {
          template = { ...template, ...dbEmailConfig.templates.bulkEmail }
        }
        rateLimiting = dbEmailConfig?.rateLimiting || {}
      } catch (error) {
        console.log('Using static email config - database config unavailable')
      }
      
      if (!template?.enabled) {
        console.log('Bulk email template is disabled')
        return { success: false, message: 'Email template disabled' }
      }

      const html = getBulkEmailTemplate(emailData)
      
      // Normalize recipients to array of objects
      const normalizedRecipients = emailData.recipients.map(r => 
        typeof r === 'string' ? { email: r } : r
      )
      
      // Send emails individually to track userId
      const results = []
      const batchSize = (rateLimiting as any).batchSize || 10
      const delay = (rateLimiting as any).delayBetweenBatches || 1000
      
      for (let i = 0; i < normalizedRecipients.length; i += batchSize) {
        const batch = normalizedRecipients.slice(i, i + batchSize)
        
        const batchPromises = batch.map(recipient => 
          sendEmail({
            to: recipient.email,
            subject: emailData.subject,
            html,
            text: emailData.content,
            userId: recipient.userId,
            userName: recipient.name,
            templateName: 'bulk-email',
            category: 'custom'
          })
        )
        
        const batchResults = await Promise.allSettled(batchPromises)
        results.push(...batchResults)
        
        // Add delay between batches
        if (i + batchSize < normalizedRecipients.length) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
      
      return { success: true, results }
    } catch (error) {
      console.error('Error sending bulk email:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Send payment reminder email
   */
  static async sendPaymentReminder(userData: {
    userId?: string
    email: string
    name: string
    registrationId: string
    registrationType: string
    daysOverdue?: number
    amount?: number
    currency?: string
  }) {
    try {
      // Use static config by default, but allow database override for template content
      let template = emailTemplateConfig.templates.paymentReminder
      
      try {
        const dbEmailConfig = await getEmailConfig()
        if (dbEmailConfig?.templates?.paymentReminder) {
          template = { ...template, ...dbEmailConfig.templates.paymentReminder }
        }
      } catch (error) {
        console.log('Using static email config - database config unavailable')
      }
      
      if (!template?.enabled) {
        console.log('Payment reminder email template is disabled')
        return { success: false, message: 'Email template disabled' }
      }

      const html = getPaymentReminderTemplate(userData)
      
      return await sendEmail({
        to: userData.email,
        subject: template.subject || `Payment Reminder - ${conferenceConfig.shortName}`,
        html,
        text: `Payment reminder for ${userData.name}. Registration ID: ${userData.registrationId}`,
        userId: userData.userId,
        userName: userData.name,
        templateName: 'payment-reminder',
        category: 'reminder'
      })
    } catch (error) {
      console.error('Error sending payment reminder:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Send custom message email
   */
  static async sendCustomMessage(messageData: {
    userId?: string
    email: string
    recipientName: string
    subject: string
    content: string
    senderName?: string
  }) {
    try {
      // Use static config by default, but allow database override for template content
      let template = emailTemplateConfig.templates.customMessage
      
      try {
        const dbEmailConfig = await getEmailConfig()
        if (dbEmailConfig?.templates?.customMessage) {
          template = { ...template, ...dbEmailConfig.templates.customMessage }
        }
      } catch (error) {
        console.log('Using static email config - database config unavailable')
      }
      
      if (!template?.enabled) {
        console.log('Custom message email template is disabled')
        return { success: false, message: 'Email template disabled' }
      }

      const html = getCustomMessageTemplate(messageData)
      
      return await sendEmail({
        to: messageData.email,
        subject: messageData.subject,
        html,
        text: messageData.content,
        userId: messageData.userId,
        userName: messageData.recipientName,
        templateName: 'custom-message',
        category: 'custom'
      })
    } catch (error) {
      console.error('Error sending custom message:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Send abstract submission confirmation email
   */
  static async sendAbstractSubmissionConfirmation(abstractData: {
    userId?: string
    email: string
    name: string
    registrationId: string
    abstractId: string
    title: string
    track: string
    authors: string[]
    submittedAt: string
  }) {
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #059669; margin-bottom: 10px;">Abstract Submission Confirmed</h1>
            <h2 style="color: #374151; font-weight: normal;">${conferenceConfig.shortName}</h2>
          </div>
          
          <p style="color: #374151; font-size: 16px;">Dear ${abstractData.name},</p>
          
          <p style="color: #374151; font-size: 16px;">
            Thank you for submitting your abstract to ${conferenceConfig.shortName}. We have successfully received your submission and it will be reviewed by our scientific committee.
          </p>
          
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #059669; margin-top: 0; margin-bottom: 15px;">Submission Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold; width: 140px;">Abstract ID:</td>
                <td style="padding: 8px 0; color: #059669; font-weight: bold;">${abstractData.abstractId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">Title:</td>
                <td style="padding: 8px 0; color: #374151;">${abstractData.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">Track:</td>
                <td style="padding: 8px 0; color: #374151;">${abstractData.track}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">Authors:</td>
                <td style="padding: 8px 0; color: #374151;">${abstractData.authors.join(', ')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">Submitted:</td>
                <td style="padding: 8px 0; color: #374151;">${new Date(abstractData.submittedAt).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">Registration ID:</td>
                <td style="padding: 8px 0; color: #374151;">${abstractData.registrationId}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin: 25px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Important:</strong> Please save your Abstract ID (${abstractData.abstractId}) for future reference. You will need it to track your submission status.
            </p>
          </div>
          
          <h3 style="color: #374151; margin-top: 30px;">What's Next?</h3>
          <ul style="color: #374151; font-size: 16px; line-height: 1.6;">
            <li>Your abstract will be reviewed by our scientific committee</li>
            <li>You will receive an email notification about the review decision</li>
            <li>If accepted, you'll be invited to submit your final presentation</li>
            <li>You can track your submission status in your dashboard</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL}/dashboard/abstracts" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View My Abstracts Dashboard
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you have any questions, please contact us at 
            <a href="mailto:${conferenceConfig.contact.abstractsEmail}" style="color: #059669;">${conferenceConfig.contact.abstractsEmail}</a>
          </p>
          
          <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Best regards,<br>
              <strong>${conferenceConfig.shortName} Scientific Committee</strong><br>
              ${conferenceConfig.venue.name}, ${conferenceConfig.venue.city}
            </p>
          </div>
        </div>
      `;
      
      return await sendEmail({
        to: abstractData.email,
        subject: `Abstract Submission Confirmed - ${abstractData.abstractId} | ${conferenceConfig.shortName}`,
        html,
        text: `Abstract submission confirmed. Abstract ID: ${abstractData.abstractId}. Title: ${abstractData.title}. Track: ${abstractData.track}.`,
        userId: abstractData.userId,
        userName: abstractData.name,
        templateName: 'abstract-submission-confirmation',
        category: 'abstract'
      })
    } catch (error) {
      console.error('Error sending abstract submission confirmation:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Send abstract acceptance notification email
   */
  static async sendAbstractAcceptance(acceptanceData: {
    userId?: string
    email: string
    name: string
    registrationId: string
    abstractId: string
    title: string
    track: string
    authors: string[]
    reviewedAt: string
    approvedFor?: string
  }) {
    try {
      const approvedForLabel = acceptanceData.approvedFor 
        ? acceptanceData.approvedFor.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        : 'Presentation'

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #059669; margin-bottom: 10px;">🎉 Abstract Accepted!</h1>
            <h2 style="color: #374151; font-weight: normal;">${conferenceConfig.shortName}</h2>
          </div>
          
          <p style="color: #374151; font-size: 16px;">Dear ${acceptanceData.name},</p>
          
          <p style="color: #374151; font-size: 16px;">
            Congratulations! We are pleased to inform you that your abstract has been <strong style="color: #059669;">ACCEPTED</strong> for <strong>${approvedForLabel}</strong> at ${conferenceConfig.shortName}.
          </p>
          
          <div style="background-color: #f0fdf4; border: 2px solid #059669; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #059669; margin-top: 0; margin-bottom: 15px;">✅ Accepted Abstract Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold; width: 140px;">Abstract ID:</td>
                <td style="padding: 8px 0; color: #059669; font-weight: bold;">${acceptanceData.abstractId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">Title:</td>
                <td style="padding: 8px 0; color: #374151;">${acceptanceData.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">Accepted For:</td>
                <td style="padding: 8px 0; color: #059669; font-weight: bold;">${approvedForLabel}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">Track:</td>
                <td style="padding: 8px 0; color: #374151;">${acceptanceData.track}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">Authors:</td>
                <td style="padding: 8px 0; color: #374151;">${acceptanceData.authors.join(', ')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">Decision Date:</td>
                <td style="padding: 8px 0; color: #374151;">${new Date(acceptanceData.reviewedAt).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">Registration ID:</td>
                <td style="padding: 8px 0; color: #374151;">${acceptanceData.registrationId}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #dbeafe; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 15px;">📤 Final Presentation Submission is NOW OPEN</h3>
            <p style="color: #374151; font-size: 14px; margin-bottom: 15px;">
              Please submit your final presentation through your dashboard. Use the official template provided below.
            </p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.NEXTAUTH_URL || process.env.APP_URL}/abstracts" 
                 style="background-color: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; margin: 5px;">
                📤 Submit Final Presentation
              </a>
              <br><br>
              <a href="${process.env.NEXTAUTH_URL || process.env.APP_URL}/Paper Template..pptx" 
                 style="background-color: #25406b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; margin: 5px;">
                📥 Paper Template (.pptx)
              </a>
              <a href="${process.env.NEXTAUTH_URL || process.env.APP_URL}/Poster Template.pptx" 
                 style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; margin: 5px;">
                📥 Poster Template (.pptx)
              </a>
            </div>
            <p style="color: #6b7280; font-size: 13px; text-align: center; margin-bottom: 0;">
              Login to your account on the abstracts page → Find your accepted abstract → Click "Submit Final Version"
            </p>
          </div>
          
          <div style="background-color: #f0f9ff; border: 1px solid #0284c7; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #0c4a6e; margin-top: 0; margin-bottom: 15px;">📋 Presentation Guidelines</h3>
            <ul style="color: #374151; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>Use the official PowerPoint template (.pptx) provided above</li>
              <li>Accepted file formats: .ppt, .pptx, .pdf</li>
              <li>Maximum file size: 10 MB</li>
              <li>Ensure your name and abstract ID are on the first slide</li>
              <li>Presentation duration: <strong>${approvedForLabel === 'Award Paper' ? '10 minutes' : '7 minutes'}</strong> including Q&A</li>
              <li>Please carry a backup copy on USB drive to the venue</li>
            </ul>
          </div>
          
          <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin: 25px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>📅 Important Dates:</strong><br>
              • Final Presentation Deadline: <strong>April 20, 2026</strong><br>
              • Conference Dates: April 25-26, 2026<br>
              • Venue: ${conferenceConfig.venue.name}, ${conferenceConfig.venue.city}
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you have any questions about your presentation or the conference, please contact us at 
            <a href="mailto:${conferenceConfig.contact.abstractsEmail}" style="color: #059669;">${conferenceConfig.contact.abstractsEmail}</a>
          </p>
          
          <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Congratulations once again!<br>
              <strong>${conferenceConfig.shortName} Scientific Committee</strong><br>
              ${conferenceConfig.venue.name}, ${conferenceConfig.venue.city}
            </p>
          </div>
        </div>
      `;
      
      return await sendEmail({
        to: acceptanceData.email,
        subject: `🎉 Abstract Accepted - ${acceptanceData.abstractId} | ${conferenceConfig.shortName}`,
        html,
        text: `Congratulations! Your abstract "${acceptanceData.title}" (ID: ${acceptanceData.abstractId}) has been accepted for ${conferenceConfig.shortName}.`,
        userId: acceptanceData.userId,
        userName: acceptanceData.name,
        templateName: 'abstract-acceptance',
        category: 'abstract'
      })
    } catch (error) {
      console.error('Error sending abstract acceptance email:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Send final submission confirmation email
   */
  static async sendFinalSubmissionConfirmation(submissionData: {
    userId?: string
    email: string
    name: string
    registrationId: string
    abstractId: string
    finalDisplayId: string
    title: string
    track: string
    authors: string[]
    submittedAt: string
    fileName: string
  }) {
    try {
      const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #059669; margin-bottom: 10px;">📤 Final Submission Received!</h1>
            <h2 style="color: #374151; font-weight: normal;">${conferenceConfig.shortName}</h2>
          </div>
          
          <p style="color: #374151; font-size: 16px;">Dear ${submissionData.name},</p>
          
          <p style="color: #374151; font-size: 16px;">
            Thank you for submitting your final presentation materials for ${conferenceConfig.shortName}. We have successfully received your submission and it is now ready for the conference.
          </p>
          
          <div style="background-color: #f0fdf4; border: 2px solid #059669; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #059669; margin-top: 0; margin-bottom: 15px;">✅ Final Submission Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold; width: 140px;">Abstract ID:</td>
                <td style="padding: 8px 0; color: #059669; font-weight: bold;">${submissionData.abstractId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">Final ID:</td>
                <td style="padding: 8px 0; color: #059669; font-weight: bold;">${submissionData.finalDisplayId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">Title:</td>
                <td style="padding: 8px 0; color: #374151;">${submissionData.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">Track:</td>
                <td style="padding: 8px 0; color: #374151;">${submissionData.track}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">Authors:</td>
                <td style="padding: 8px 0; color: #374151;">${submissionData.authors.join(', ')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">Submitted:</td>
                <td style="padding: 8px 0; color: #374151;">${new Date(submissionData.submittedAt).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">File:</td>
                <td style="padding: 8px 0; color: #374151;">${submissionData.fileName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #374151; font-weight: bold;">Registration ID:</td>
                <td style="padding: 8px 0; color: #374151;">${submissionData.registrationId}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 15px;">🎯 What's Next?</h3>
            <ul style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 10px;"><strong>Confirmation:</strong> Your final presentation is now in our system</li>
              <li style="margin-bottom: 10px;"><strong>Review:</strong> Our team will review your submission for technical requirements</li>
              <li style="margin-bottom: 10px;"><strong>Conference:</strong> Be ready to present at ${conferenceConfig.shortName}</li>
              <li style="margin-bottom: 10px;"><strong>Updates:</strong> We'll contact you if any changes are needed</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL}/dashboard/abstracts" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              📋 View My Abstracts Dashboard
            </a>
          </div>
          
          <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin: 25px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Conference Details:</strong><br>
              • Conference Dates: ${formatDate(conferenceConfig.eventDate.start)} - ${formatDate(conferenceConfig.eventDate.end)}<br>
              • Venue: ${conferenceConfig.venue.name}, ${conferenceConfig.venue.city}, ${conferenceConfig.venue.state}<br>
              • Your presentation slot will be communicated separately
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you have any questions about your presentation or need to make changes, please contact us at 
            <a href="mailto:${conferenceConfig.contact.email}" style="color: #059669;">${conferenceConfig.contact.email}</a>
          </p>
          
          <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Thank you for your contribution to ${conferenceConfig.shortName}!<br>
              <strong>${conferenceConfig.organizationName}</strong><br>
              ${conferenceConfig.venue.name}, ${conferenceConfig.venue.city}, ${conferenceConfig.venue.state}
            </p>
          </div>
        </div>
      `;
      
      return await sendEmail({
        to: submissionData.email,
        subject: `📤 Final Submission Received - ${submissionData.finalDisplayId} | ${conferenceConfig.shortName}`,
        html,
        text: `Final submission received for "${submissionData.title}" (ID: ${submissionData.finalDisplayId}). Thank you for your contribution to ${conferenceConfig.shortName}.`,
        userId: submissionData.userId,
        userName: submissionData.name,
        templateName: 'final-submission-confirmation',
        category: 'abstract'
      })
    } catch (error) {
      console.error('Error sending final submission confirmation:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Send workshop addon payment confirmation email
   */
  static async sendWorkshopAddonConfirmation(paymentData: {
    email: string
    name: string
    registrationId: string
    amount: number
    currency?: string
    transactionId?: string
    paymentDate?: string
    userId?: string
    paymentId?: string
    workshops: Array<{
      workshopId: string
      workshopName: string
      price: number
    }>
  }) {
    try {
      // Generate PDF invoice for email attachment
      let pdfBuffer: Buffer | null = null
      if (paymentData.userId && paymentData.paymentId) {
        try {
          const User = (await import('@/lib/models/User')).default
          const Payment = (await import('@/lib/models/Payment')).default
          const { InvoiceGenerator } = await import('@/lib/pdf/invoice-generator')
          
          const user = await User.findById(paymentData.userId)
          const payment = await Payment.findById(paymentData.paymentId)
          
          if (user && payment) {
            pdfBuffer = await InvoiceGenerator.generatePDFFromPayment(user, payment)
          }
        } catch (pdfError) {
          console.error('PDF generation failed for workshop addon email:', pdfError)
        }
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .workshop-item { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #8b5cf6; }
            .total { background: #2563eb; color: white; padding: 15px; text-align: center; font-size: 20px; font-weight: bold; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Workshop Registration Confirmed!</h1>
            </div>
            
            <div class="content">
              <p>Dear ${paymentData.name},</p>
              
              <p>Your workshop addon registration has been confirmed for <strong>${conferenceConfig.shortName}</strong>.</p>
              
              <h3>Registration Details:</h3>
              <p><strong>Registration ID:</strong> ${paymentData.registrationId}</p>
              <p><strong>Transaction ID:</strong> ${paymentData.transactionId || 'Pending'}</p>
              <p><strong>Payment Date:</strong> ${paymentData.paymentDate || new Date().toLocaleDateString()}</p>
              
              <h3>Workshop Details:</h3>
              ${paymentData.workshops.map(workshop => `
                <div class="workshop-item">
                  <strong>${workshop.workshopName}</strong><br>
                  <small>Workshop ID: ${workshop.workshopId}</small><br>
                  <strong>Price:</strong> ${paymentData.currency === 'USD' ? '$' : '₹'}${workshop.price.toLocaleString()}
                </div>
              `).join('')}
              
              <div class="total">
                Total Amount Paid: ${paymentData.currency === 'USD' ? '$' : '₹'}${paymentData.amount.toLocaleString()}
              </div>
              
              <p style="margin-top: 20px;">Your workshop invoice has been attached to this email. Please keep it for your records.</p>
              
              <p>If you have any questions, please contact us at <a href="mailto:${conferenceConfig.contact.email}">${conferenceConfig.contact.email}</a></p>
              
              <p>We look forward to seeing you at the workshops!</p>
              
              <p>Best regards,<br>
              <strong>${conferenceConfig.organizationName}</strong></p>
            </div>
            
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>${conferenceConfig.contact.website}</p>
            </div>
          </div>
        </body>
        </html>
      `
      
      const emailOptions: any = {
        to: paymentData.email,
        subject: `Workshop Registration Confirmed - ${conferenceConfig.shortName}`,
        html,
        text: `Your workshop addon registration has been confirmed. Registration ID: ${paymentData.registrationId}. Total Amount: ${paymentData.currency === 'USD' ? '$' : '₹'}${paymentData.amount.toLocaleString()}`,
        userId: paymentData.userId,
        userName: paymentData.name,
        templateName: 'workshop-addon-confirmation',
        category: 'payment'
      }

      // Attach invoice PDF if generated
      if (pdfBuffer) {
        emailOptions.attachments = [{
          filename: `${paymentData.registrationId}-Workshop-Invoice.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }]
      }

      return await sendEmail(emailOptions)
    } catch (error) {
      console.error('Error sending workshop addon confirmation:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Send conference reminder email
   */
  static async sendConferenceReminder(userData: {
    userId?: string
    email: string
    name: string
    registrationId: string
    daysUntilConference: number
  }) {
    try {
      const emailConfig = await getEmailConfig()
      const template = emailConfig?.templates?.reminder
      
      if (!template?.enabled) {
        console.log('Reminder email template is disabled')
        return { success: false, message: 'Email template disabled' }
      }

      const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }

      const content = `
        <h2>Conference Reminder</h2>
        <p>Dear ${userData.name},</p>
        
        <p>This is a friendly reminder that <strong>${conferenceConfig.shortName}</strong> is just ${userData.daysUntilConference} days away!</p>
        
        <div class="highlight">
          <h3>Your Registration Details:</h3>
          <p><strong>Registration ID:</strong> ${userData.registrationId}</p>
          <p><strong>Conference Dates:</strong> ${formatDate(conferenceConfig.eventDate.start)} - ${formatDate(conferenceConfig.eventDate.end)}</p>
          <p><strong>Venue:</strong> ${conferenceConfig.venue.name}, ${conferenceConfig.venue.city}, ${conferenceConfig.venue.state}</p>
        </div>
        
        <p><strong>What to expect:</strong></p>
        <ul>
          <li>Cutting-edge presentations and keynote sessions</li>
          <li>Hands-on workshops and training sessions</li>
          <li>Networking opportunities with leading experts</li>
          <li>Latest research and clinical innovations</li>
        </ul>
        
        <p style="text-align: center;">
          <a href="${process.env.APP_URL}/dashboard" class="button">View Conference Details</a>
        </p>
        
        <p>We look forward to seeing you at the conference!</p>
        
        <p>Best regards,<br>
        <strong>${conferenceConfig.organizationName}</strong></p>
      `

      const html = getBulkEmailTemplate({
        subject: 'Conference Reminder',
        content,
        senderName: `${conferenceConfig.shortName} Team`
      })
      
      return await sendEmail({
        to: userData.email,
        subject: template.subject || `Conference Reminder - ${conferenceConfig.shortName}`,
        html,
        text: `Conference reminder for ${userData.name}. ${userData.daysUntilConference} days until ${conferenceConfig.shortName}!`,
        userId: userData.userId,
        userName: userData.name,
        templateName: 'conference-reminder',
        category: 'reminder'
      })
    } catch (error) {
      console.error('Error sending conference reminder:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Send bulk email with template support
   */
  static async sendBulkTemplateEmail(emailData: {
    to: string
    subject: string
    template: string
    userData: {
      name: string
      registrationId?: string
      category?: string
      userId?: string
      workshop?: string
    }
    content?: string
  }) {
    try {
      const { getBadgeReadyTemplate, getCertificateAvailableTemplate, getEventReminderTemplate, getAnnouncementTemplate, getBulkEmailTemplate, getWorkshopReminderTemplate } = await import('./templates')
      
      let html = ''
      const attachments: any[] = []
      
      // Use the appropriate template based on template type
      switch (emailData.template) {
        case 'badge':
          // Generate QR code as inline attachment (CID) for email compatibility
          let qrCodeCID: string | undefined
          try {
            console.log('📱 Attempting to generate QR code for:', emailData.userData.registrationId)
            const { QRCodeGenerator } = await import('@/lib/utils/qrcode-generator')
            
            // Generate QR code as buffer for inline attachment
            if (emailData.userData.registrationId) {
              const qrBuffer = await QRCodeGenerator.generateSimpleRegistrationQRBuffer(emailData.userData.registrationId)
              qrCodeCID = `qrcode-${emailData.userData.registrationId}@neurovascon.in`
              
              // Attach as inline image with CID
              attachments.push({
                filename: 'qrcode.png',
                content: qrBuffer,
                contentType: 'image/png',
                cid: qrCodeCID // Content-ID for inline embedding
              })
              
              console.log('✅ QR code generated and attached as inline image with CID:', qrCodeCID)
            } else {
              console.warn('⚠️ No registration ID provided for QR code')
            }
          } catch (qrError: any) {
            console.error('❌ Failed to generate QR code for email:', qrError?.message || qrError)
            console.error('Stack:', qrError?.stack)
          }
          
          html = getBadgeReadyTemplate({
            name: emailData.userData.name,
            registrationId: emailData.userData.registrationId || '',
            qrCodeCID: qrCodeCID // Pass CID instead of data URL
          })
          
          // Generate and attach badge PDF
          if (emailData.userData.userId) {
            try {
              console.log(`🏷️ Generating badge PDF for user: ${emailData.userData.userId}`)
              const { BadgeGenerator } = await import('@/lib/pdf/badge-generator')
              const User = (await import('@/lib/models/User')).default
              const Configuration = (await import('@/lib/models/Configuration')).default
              const connectDB = (await import('@/lib/mongodb')).default
              
              await connectDB()
              
              // Get user data
              const user = await User.findById(emailData.userData.userId)
                .select('profile registration email')
                .lean()
              
              if (!user) {
                console.error(`❌ User not found for badge generation with ID: ${emailData.userData.userId}`)
                break
              }
              
              // Get badge configuration
              const badgeConfig = await Configuration.findOne({
                type: 'badge',
                key: 'badge_config'
              })
              
              if (badgeConfig && badgeConfig.value && badgeConfig.value.enabled) {
                console.log('✅ Badge config found and enabled, generating PDF...')
                
                // Use optimized BadgeGenerator with browser pooling
                const pdfBuffer = await BadgeGenerator.generateBadgePDF({
                  user,
                  badgeConfig,
                  registrationId: emailData.userData.registrationId || 'BADGE'
                })
                
                // Attach badge PDF
                const filename = `Badge-${emailData.userData.registrationId || 'BADGE'}.pdf`
                attachments.push({
                  filename,
                  content: pdfBuffer,
                  contentType: 'application/pdf'
                })
                console.log(`✅ Badge PDF attached: ${filename} (${pdfBuffer.length} bytes)`)
              } else {
                console.warn('⚠️ Badge config not found or not enabled')
              }
            } catch (error) {
              console.error('❌ Failed to generate badge attachment:', error)
            }
          } else {
            console.warn('⚠️ No userId provided for badge generation')
          }
          break
        
        case 'certificate':
          html = getCertificateAvailableTemplate({
            name: emailData.userData.name,
            registrationId: emailData.userData.registrationId || ''
          })
          
          // Generate and attach certificate PDF
          if (emailData.userData.userId) {
            try {
              console.log(`🎓 Generating certificate PDF for user: ${emailData.userData.userId}`)
              const { CertificateGenerator } = await import('@/lib/pdf/certificate-generator')
              const User = (await import('@/lib/models/User')).default
              const Configuration = (await import('@/lib/models/Configuration')).default
              const connectDB = (await import('@/lib/mongodb')).default
              
              await connectDB()
              
              // Get user data
              const user = await User.findById(emailData.userData.userId)
                .select('profile registration email')
                .lean()
              
              if (!user) {
                console.error('❌ User not found for certificate generation')
                break
              }
              
              // Get certificate configuration
              const certificateConfig = await Configuration.findOne({
                type: 'certificate',
                key: 'certificate_config'
              })
              
              if (certificateConfig && certificateConfig.value && certificateConfig.value.enabled) {
                console.log('✅ Certificate config found and enabled, generating PDF...')
                
                // Use optimized CertificateGenerator with browser pooling
                const pdfBuffer = await CertificateGenerator.generateCertificatePDF({
                  user,
                  certificateConfig,
                  registrationId: emailData.userData.registrationId || 'CERT'
                })
                
                // Attach certificate PDF
                const filename = `Certificate-${emailData.userData.registrationId || 'CERT'}.pdf`
                attachments.push({
                  filename,
                  content: pdfBuffer,
                  contentType: 'application/pdf'
                })
                console.log(`✅ Certificate PDF attached: ${filename} (${pdfBuffer.length} bytes)`)
              } else {
                console.warn('⚠️ Certificate config not found or not enabled')
              }
            } catch (error) {
              console.error('❌ Failed to generate certificate attachment:', error)
            }
          } else {
            console.warn('⚠️ No userId provided for certificate generation')
          }
          break
        
        case 'reminder':
          html = getEventReminderTemplate({
            name: emailData.userData.name,
            registrationId: emailData.userData.registrationId || '',
            category: emailData.userData.category || ''
          })
          break
        
        case 'workshop':
          html = getWorkshopReminderTemplate({
            name: emailData.userData.name,
            registrationId: emailData.userData.registrationId || '',
            workshop: emailData.userData.workshop || 'Workshop'
          })
          break
        
        case 'announcement':
          html = getAnnouncementTemplate(
            { name: emailData.userData.name },
            emailData.content || ''
          )
          break
        
        case 'custom':
        default:
          html = getBulkEmailTemplate({
            subject: emailData.subject,
            content: emailData.content || '',
            senderName: `${conferenceConfig.shortName} Team`
          })
          break
      }
      
      // Log attachment status
      if (attachments.length > 0) {
        console.log(`📎 Sending email with ${attachments.length} attachment(s):`, attachments.map(a => a.filename).join(', '))
      } else {
        console.log('📧 Sending email without attachments')
      }
      
      return await sendEmail({
        to: emailData.to,
        subject: emailData.subject,
        html,
        text: `${emailData.subject} - Message from ${conferenceConfig.shortName}`,
        attachments: attachments.length > 0 ? attachments : undefined,
        userId: emailData.userData.userId,
        userName: emailData.userData.name,
        templateName: `bulk-${emailData.template}`,
        category: 'custom'
      })
    } catch (error) {
      console.error('Error sending bulk template email:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}