import { getConferenceConfig } from '@/lib/config'
import { conferenceConfig } from '../../config/conference.config'

// Base email template with conference branding
export function getBaseTemplate(content: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${conferenceConfig.shortName}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background-color: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #015189;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          background: linear-gradient(45deg, #015189, #0066b3);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #666;
          font-size: 14px;
        }
        .content {
          margin: 20px 0;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: linear-gradient(45deg, #015189, #0066b3);
          color: white;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          margin: 10px 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        .highlight {
          background-color: #f0f8ff;
          padding: 15px;
          border-left: 4px solid #015189;
          margin: 15px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">${conferenceConfig.shortName}</div>
          <div class="subtitle">${conferenceConfig.name}</div>
          <div class="subtitle">${conferenceConfig.eventDate.start} to ${conferenceConfig.eventDate.end} | ${conferenceConfig.venue.city}, ${conferenceConfig.venue.state}</div>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>
            <strong>${conferenceConfig.shortName}</strong><br>
            ${conferenceConfig.venue.name}<br>
            ${conferenceConfig.venue.city}, ${conferenceConfig.venue.state}, ${conferenceConfig.venue.country}<br>
            Email: ${conferenceConfig.contact.email} | Phone: ${conferenceConfig.contact.phone}
          </p>
          <p>
            This is an automated email. Please do not reply to this email address.
          </p>
          <p style="margin-top: 8px; color: #4b5563;">
            Powered by <a href="https://purplehatevents.in" style="color: #015189; text-decoration: none; font-weight: 600;">PurpleHat Events</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Registration confirmation email template
export function getRegistrationConfirmationTemplate(userData: {
  name: string
  email: string
  registrationId: string
  registrationType: string
  registrationTypeLabel: string
  workshopSelections?: Array<{id: string, name: string}>
  accompanyingPersons?: Array<{name: string, age: number, relationship: string}>
  accommodation?: { required: boolean, roomType: string, checkIn: string, checkOut: string, nights: number, totalAmount: number }
  paymentMethod?: string
}) {
  const isPaymentGateway = userData.paymentMethod === 'payment_gateway'
  
  const content = `
    <h2>Registration ${isPaymentGateway ? 'Confirmed' : 'Application Received'}</h2>
    <p>Dear ${userData.name},</p>
    
    <p>Thank you for ${isPaymentGateway ? 'registering for' : 'submitting your registration application for'} <strong>${conferenceConfig.shortName}</strong>! ${isPaymentGateway ? 'Your registration has been confirmed.' : 'We have received your application and bank transfer details.'}</p>
    
    <div class="highlight">
      <h3>Your ${isPaymentGateway ? 'Registration' : 'Application'} Details:</h3>
      <table>
        <tr><th>Registration ID</th><td><strong>${userData.registrationId}</strong></td></tr>
        <tr><th>Registration Type</th><td>${userData.registrationTypeLabel}</td></tr>
        <tr><th>Email</th><td>${userData.email}</td></tr>
        <tr><th>Status</th><td><span style="color: ${isPaymentGateway ? '#16a34a' : '#ffa500'};">${isPaymentGateway ? '✓ Confirmed' : 'Pending Verification'}</span></td></tr>
        ${userData.workshopSelections && userData.workshopSelections.length > 0 ? 
          `<tr><th>Workshops</th><td>${userData.workshopSelections.map(w => typeof w === 'string' ? w : w.name).join(', ')}</td></tr>` : ''}
        ${userData.accompanyingPersons && userData.accompanyingPersons.length > 0 ? 
          `<tr><th>Accompanying Persons</th><td>${userData.accompanyingPersons.map(p => `${p.name} (${p.age} years, ${p.relationship})`).join(', ')}</td></tr>` : ''}
        ${userData.accommodation?.required ? 
          `<tr><th>Hotel Accommodation</th><td>${userData.accommodation.roomType === 'single' ? 'Single Room' : 'Sharing Room'} — ${userData.accommodation.nights} night(s)<br/>Check-in: ${userData.accommodation.checkIn} | Check-out: ${userData.accommodation.checkOut}<br/>Amount: ₹${userData.accommodation.totalAmount?.toLocaleString('en-IN')} (+ 18% GST)</td></tr>` : ''}
      </table>
    </div>
    
    ${isPaymentGateway ? `
    <div style="background-color: #e8f5e9; padding: 15px; border-left: 4px solid #16a34a; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #2e7d32;">✓ Registration Confirmed!</h4>
      <ul style="margin-bottom: 0;">
        <li>Your payment has been processed successfully</li>
        <li>You now have full access to your conference dashboard</li>
        <li>Conference materials and updates will be shared via email</li>
        <li>Your event badge and certificate will be available in your dashboard</li>
      </ul>
    </div>
    ` : `
    <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffa500; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #856404;">What happens next?</h4>
      <ul style="margin-bottom: 0;">
        <li>Our team will verify your bank transfer within <strong>10 business days</strong></li>
        <li>You will receive a confirmation email once your payment is verified</li>
        <li>Your registration will be confirmed and full access will be activated</li>
        <li>Conference materials and updates will be shared via email</li>
      </ul>
    </div>
    
    <p><strong>Important:</strong> Please allow up to 10 business days for payment verification. You will receive another email once your registration is confirmed.</p>
    `}
    
    <p>If you have any questions about your ${isPaymentGateway ? 'registration' : 'application'}, please contact us at <a href="mailto:${conferenceConfig.contact.email}">${conferenceConfig.contact.email}</a></p>
    
    <p>Thank you for your patience!</p>
    
    <p>Best regards,<br>
    <strong>${conferenceConfig.shortName} Organising Committee</strong></p>
  `
  
  return getBaseTemplate(content)
}

// Payment confirmation and invoice email template
export function getPaymentConfirmationTemplate(paymentData: {
  name: string
  registrationId: string
  amount: number
  currency: string
  transactionId: string
  paymentDate: string
  breakdown: any
}) {
  const content = `
    <h2>Payment Confirmation & Invoice</h2>
    <p>Dear ${paymentData.name},</p>
    
    <p>Thank you for your payment! Your registration for <strong>${conferenceConfig.shortName}</strong> is now confirmed.</p>
    
    <div class="highlight">
      <h3>Payment Details:</h3>
      <table>
        <tr><th>Registration ID</th><td><strong>${paymentData.registrationId}</strong></td></tr>
        <tr><th>Transaction ID</th><td>${paymentData.transactionId}</td></tr>
        <tr><th>Amount Paid</th><td><strong>${paymentData.currency} ${paymentData.amount}</strong></td></tr>
        <tr><th>Payment Date</th><td>${paymentData.paymentDate}</td></tr>
        <tr><th>Payment Method</th><td>${paymentData.breakdown.paymentMethod === 'payment_gateway' ? 'Online Payment' : 'Bank Transfer'}</td></tr>
        <tr><th>Status</th><td><span style="color: green; font-weight: bold;">PAID</span></td></tr>
      </table>
    </div>
    
    <div class="highlight">
      <h3>Payment Breakdown:</h3>
      <table>
        <tr>
          <th style="width: 60%;">Item</th>
          <th style="width: 40%; text-align: right;">Amount</th>
        </tr>
        <tr>
          <td><strong>Registration Fee</strong></td>
          <td style="text-align: right;"><strong>${paymentData.currency} ${paymentData.breakdown.baseAmount || paymentData.breakdown.registration || 0}</strong></td>
        </tr>
        <tr>
          <td colspan="2" style="font-size: 13px; color: #666; padding-left: 20px;">
            ${paymentData.breakdown.registrationTypeLabel || paymentData.breakdown.registrationType} Registration
          </td>
        </tr>
        ${paymentData.breakdown.workshopFees && paymentData.breakdown.workshopFees.length > 0 ? 
          `<tr><td><strong>Workshop Fees</strong></td><td style="text-align: right;"><strong>${paymentData.currency} ${paymentData.breakdown.workshops || 0}</strong></td></tr>
          ${paymentData.breakdown.workshopFees.map((w: any) => 
            `<tr><td colspan="2" style="font-size: 13px; color: #666; padding-left: 20px;">• ${w.name} - ${paymentData.currency} ${w.amount}</td></tr>`
          ).join('')}` : ''}
        ${paymentData.breakdown.accompanyingPersonCount > 0 ? 
          `<tr><td><strong>Accompanying Person Fees (${paymentData.breakdown.accompanyingPersonCount})</strong></td><td style="text-align: right;"><strong>${paymentData.currency} ${paymentData.breakdown.accompanyingPersonFees || paymentData.breakdown.accompanyingPersons || 0}</strong></td></tr>
          ${paymentData.breakdown.accompanyingPersonDetails ? 
            paymentData.breakdown.accompanyingPersonDetails.map((p: any) => 
              `<tr><td colspan="2" style="font-size: 13px; color: #666; padding-left: 20px;">• ${p.name} - ${p.age} years old</td></tr>`
            ).join('') : ''}` : ''}
        ${paymentData.breakdown.accommodation?.required ? 
          `<tr><td><strong>Hotel Accommodation</strong></td><td style="text-align: right;"><strong>${paymentData.currency} ${paymentData.breakdown.accommodationFees || paymentData.breakdown.accommodation.totalAmount || 0}</strong></td></tr>
          <tr><td colspan="2" style="font-size: 13px; color: #666; padding-left: 20px;">• ${paymentData.breakdown.accommodation.roomType === 'single' ? 'Single Room' : 'Sharing Room'} × ${paymentData.breakdown.accommodation.nights} night(s) (${paymentData.breakdown.accommodation.checkIn} to ${paymentData.breakdown.accommodation.checkOut})</td></tr>` : ''}
        ${paymentData.breakdown.discount > 0 ? 
          `<tr><td>Discount Applied</td><td style="color: green; text-align: right;">-${paymentData.currency} ${paymentData.breakdown.discount}</td></tr>` : ''}
        <tr style="border-top: 2px solid #015189; font-weight: bold; font-size: 16px;">
          <td>TOTAL PAID</td>
          <td style="text-align: right;">${paymentData.currency} ${paymentData.amount.toLocaleString('en-IN')}</td>
        </tr>
      </table>
    </div>
    
    <p><strong>What's Next:</strong></p>
    <ul>
      <li>Save this email as your payment receipt</li>
      <li>You will receive conference updates and program details closer to the event</li>
      <li>Access your dashboard for registration details and updates</li>
    </ul>
    
    <p style="text-align: center;">
      <a href="${process.env.APP_URL}/dashboard" class="button">View Your Dashboard</a>
    </p>
    
    <p>We look forward to welcoming you to ${conferenceConfig.shortName}!</p>
    
    <p>Best regards,<br>
    <strong>${conferenceConfig.shortName} Organising Committee</strong></p>
  `
  
  return getBaseTemplate(content)
}

// Password reset email template
export function getPasswordResetTemplate(resetData: {
  name: string
  resetLink: string
  expiryTime: string
}) {
  const content = `
    <h2>Password Reset Request</h2>
    <p>Dear ${resetData.name},</p>
    
    <p>We received a request to reset your password for your ${conferenceConfig.shortName} account.</p>
    
    <div class="highlight">
      <p><strong>Important:</strong> This link will expire in ${resetData.expiryTime}.</p>
    </div>
    
    <p style="text-align: center;">
      <a href="${resetData.resetLink}" class="button">Reset Your Password</a>
    </p>
    
    <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
    
    <p>For security reasons, please do not share this link with anyone.</p>
    
    <p>If you're having trouble clicking the button, copy and paste the following link into your browser:</p>
    <p style="word-break: break-all; color: #666; font-size: 12px;">${resetData.resetLink}</p>
    
    <p>Best regards,<br>
    <strong>${conferenceConfig.shortName} Support Team</strong></p>
  `
  
  return getBaseTemplate(content)
}

// Payment reminder email template
export function getPaymentReminderTemplate(userData: {
  name: string
  registrationId: string
  registrationType: string
  email: string
  daysOverdue?: number
  amount?: number
  currency?: string
}) {
  const content = `
    <h2>Payment Reminder</h2>
    <p>Dear ${userData.name},</p>
    
    <p>This is a friendly reminder regarding your registration payment for <strong>${conferenceConfig.shortName}</strong>.</p>
    
    <div class="highlight">
      <h3>Your Registration Details:</h3>
      <table>
        <tr><th>Registration ID</th><td><strong>${userData.registrationId}</strong></td></tr>
        <tr><th>Registration Type</th><td>${userData.registrationType}</td></tr>
        <tr><th>Email</th><td>${userData.email}</td></tr>
        ${userData.amount && userData.currency ? 
          `<tr><th>Amount Due</th><td><strong>${userData.currency} ${userData.amount}</strong></td></tr>` : ''}
        ${userData.daysOverdue ? 
          `<tr><th>Days Overdue</th><td><span style="color: #dc2626;">${userData.daysOverdue} days</span></td></tr>` : ''}
      </table>
    </div>
    
    <p><strong>Payment Options:</strong></p>
    <ul>
      <li>Online payment through our secure portal</li>
      <li>Bank transfer (details provided upon request)</li>
      <li>Payment at the conference venue</li>
    </ul>
    
    <p>Please complete your payment at your earliest convenience to secure your spot at the conference.</p>
    
    <p>If you have already made the payment, please ignore this reminder or contact us with your payment details.</p>
    
    <p><strong>Conference Details:</strong></p>
    <ul>
      <li><strong>Dates:</strong> ${conferenceConfig.eventDate.start} to ${conferenceConfig.eventDate.end}</li>
      <li><strong>Venue:</strong> ${conferenceConfig.venue.name}, ${conferenceConfig.venue.city}, ${conferenceConfig.venue.state}</li>
    </ul>
    
    <p>For any payment-related queries, please contact us at <a href="mailto:${conferenceConfig.contact.email}">${conferenceConfig.contact.email}</a></p>
    
    <p>Thank you for your understanding.</p>
    
    <p>Best regards,<br>
    <strong>${conferenceConfig.shortName} Finance Team</strong></p>
  `
  
  return getBaseTemplate(content)
}

// Custom message template for admin communications
export function getCustomMessageTemplate(messageData: {
  subject: string
  content: string
  recipientName: string
  senderName?: string
}) {
  const content = `
    <h2>${messageData.subject}</h2>
    <p>Dear ${messageData.recipientName},</p>
    
    <div style="margin: 20px 0; line-height: 1.6;">
      ${messageData.content.replace(/\n/g, '<br>')}
    </div>
    
    <p>Best regards,<br>
    <strong>${messageData.senderName || conferenceConfig.shortName + ' Team'}</strong></p>
  `
  
  return getBaseTemplate(content)
}

// Registration acceptance and confirmation email template
export function getRegistrationAcceptanceTemplate(userData: {
  name: string
  registrationId: string
  registrationType: string
  email: string
  amount: number
  currency?: string
  transactionId?: string
  workshopSelections?: string[]
  accompanyingPersons?: number
  accommodation?: { required: boolean, roomType: string, checkIn: string, checkOut: string, nights: number, totalAmount: number }
  qrCodeDataURL?: string
  password?: string
}) {
  const content = `
    <h2 style="color: #16a34a;">Registration Confirmed - Welcome to ${conferenceConfig.shortName}!</h2>
    <p>Dear ${userData.name},</p>
    
    <p>Congratulations! We are pleased to inform you that your registration for <strong>${conferenceConfig.shortName}</strong> has been successfully verified and confirmed.</p>
    
    <div style="background-color: #dcfce7; padding: 15px; border-left: 4px solid #16a34a; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #166534;">Your registration is now ACTIVE</h4>
      <p style="margin-bottom: 0; color: #166534;">Your payment has been verified and your spot at the conference is secured!</p>
    </div>
    
    ${userData.qrCodeDataURL ? `
    <div style="text-align: center; background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #015189;">Your Registration QR Code</h3>
      <img src="cid:qr-code-embedded" alt="Registration QR Code" style="max-width: 250px; border: 4px solid #015189; border-radius: 8px; padding: 10px; background: white;" onerror="this.src='${userData.qrCodeDataURL}'" />
      <p style="margin-bottom: 0; font-size: 14px; color: #666;">
        <strong>Please present this QR code at the registration desk</strong><br>
        Registration ID: <strong>${userData.registrationId}</strong>
      </p>
    </div>
    ` : ''}
    
    <div class="highlight">
      <h3>Your Confirmed Registration Details:</h3>
      <table>
        <tr><th>Registration ID</th><td><strong>${userData.registrationId}</strong></td></tr>
        <tr><th>Registration Type</th><td>${userData.registrationType}</td></tr>
        <tr><th>Email</th><td>${userData.email}</td></tr>
        <tr><th>Amount Paid</th><td><strong>${userData.currency || 'INR'} ${userData.amount}</strong></td></tr>
        ${userData.transactionId ? 
          `<tr><th>Transaction ID</th><td>${userData.transactionId}</td></tr>` : ''}
        <tr><th>Status</th><td><span style="color: #16a34a; font-weight: bold;">CONFIRMED</span></td></tr>
        ${userData.workshopSelections && userData.workshopSelections.length > 0 ? 
          `<tr><th>Workshops</th><td>${userData.workshopSelections.join(', ')}</td></tr>` : ''}
        ${userData.accompanyingPersons && userData.accompanyingPersons > 0 ? 
          `<tr><th>Accompanying Persons</th><td>${userData.accompanyingPersons}</td></tr>` : ''}
        ${userData.accommodation?.required ? 
          `<tr><th>Hotel Accommodation</th><td>${userData.accommodation.roomType === 'single' ? 'Single Room' : 'Sharing Room'} — ${userData.accommodation.nights} night(s)<br/>Check-in: ${userData.accommodation.checkIn} | Check-out: ${userData.accommodation.checkOut}<br/>Amount: ₹${userData.accommodation.totalAmount?.toLocaleString('en-IN')} (+ 18% GST)</td></tr>` : ''}
      </table>
    </div>

    ${userData.password ? `
    <div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #92400e;">Your Login Credentials</h4>
      <table style="width: 100%;">
        <tr><th style="text-align: left; padding: 5px;">Email:</th><td style="padding: 5px;"><strong>${userData.email}</strong></td></tr>
        <tr><th style="text-align: left; padding: 5px;">Password:</th><td style="padding: 5px;"><strong>${userData.password}</strong></td></tr>
      </table>
      <p style="margin-bottom: 0; color: #92400e; font-size: 14px;">
        <strong>Please save these credentials safely.</strong> You can use them to log in to your dashboard and update your profile.
      </p>
    </div>
    ` : ''}
    
    <div style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #0284c7; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #0c4a6e;">Conference Details</h4>
      <ul style="margin-bottom: 0;">
        <li><strong>Dates:</strong> ${new Date(conferenceConfig.eventDate.start).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${new Date(conferenceConfig.eventDate.end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</li>
        <li><strong>Venue:</strong> ${conferenceConfig.venue.name}, ${conferenceConfig.venue.city}, ${conferenceConfig.venue.state}</li>
        <li><strong>Contact:</strong> ${conferenceConfig.contact.email} | ${conferenceConfig.contact.phone}</li>
      </ul>
    </div>
    
    <div style="background-color: #fff7ed; padding: 15px; border-left: 4px solid #f97316; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #9a3412;">What's Next?</h4>
      <ul style="margin-bottom: 0;">
        <li>Your invoice has been attached to this email for your records</li>
        <li>Conference program and schedule will be shared 2 weeks before the event</li>
        <li>You will receive further updates about workshops and sessions</li>
        <li>Access your dashboard anytime for registration details</li>
      </ul>
    </div>
    
    <p style="text-align: center; margin: 25px 0;">
      <a href="${process.env.APP_URL}/dashboard" class="button">Access Your Dashboard</a>
    </p>
    
    <p><strong>Important:</strong> Please save this email and the attached invoice. Bring a printed or digital copy of your invoice to the registration desk.</p>
    
    <p>If you have any questions, please don't hesitate to contact us at <a href="mailto:${conferenceConfig.contact.email}">${conferenceConfig.contact.email}</a></p>
    
    <p>We look forward to welcoming you to ${conferenceConfig.shortName}!</p>
    
    <p>Best regards,<br>
    <strong>${conferenceConfig.shortName} Organising Committee</strong></p>
  `
  
  return getBaseTemplate(content)
}

// Bulk email template for admin communications
export function getBulkEmailTemplate(emailData: {
  subject: string
  content: string
  senderName?: string
}) {
  const content = `
    <h2>${emailData.subject}</h2>
    
    <div style="margin: 20px 0;">
      ${emailData.content}
    </div>
    
    <p>Best regards,<br>
    <strong>${emailData.senderName || conferenceConfig.shortName + ' Team'}</strong></p>
  `
  
  return getBaseTemplate(content)
}

// Badge Ready Email Template
export function getBadgeReadyTemplate(userData: {
  name: string
  registrationId: string
  qrCodeCID?: string
}) {
  // Debug log
  console.log('📧 Badge email template - QR code CID provided:', !!userData.qrCodeCID)
  
  const content = `
    <h2>🏷️ Your Event Badge is Ready!</h2>
    <p>Dear ${userData.name},</p>
    
    <p>Great news! Your event badge for <strong>${conferenceConfig.shortName}</strong> is now ready!</p>
    
    <p><strong>Your event badge is attached to this email</strong> as a PDF file.</p>
    
    <div class="highlight">
      <h3>Your Badge Details:</h3>
      <table>
        <tr><th>Registration ID</th><td><strong>${userData.registrationId}</strong></td></tr>
        <tr><th>Badge Status</th><td><span style="color: green; font-weight: bold;">✓ READY</span></td></tr>
        <tr><th>Attachment</th><td><span style="color: #2196f3; font-weight: bold;">📎 Badge-${userData.registrationId}.pdf</span></td></tr>
      </table>
    </div>
    
    ${userData.qrCodeCID ? `
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #333;">📱 Your Quick Check-In QR Code</h3>
      <img src="cid:${userData.qrCodeCID}" alt="Registration QR Code" style="max-width: 200px; height: auto; border: 2px solid #ddd; padding: 10px; background: white;" />
      <p style="margin-bottom: 0; color: #666; font-size: 14px;">Scan this QR code at the venue for quick check-in</p>
      <p style="color: #999; font-size: 12px; margin-top: 5px;">Registration ID: ${userData.registrationId}</p>
    </div>
    ` : ''}
    
    <div style="background-color: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #2e7d32;">✓ Your Badge is Attached!</h4>
      <ul style="margin-bottom: 0;">
        <li>Check the email attachments for <strong>Badge-${userData.registrationId}.pdf</strong></li>
        <li>Your registration ID and QR code for quick check-in</li>
        <li>Your name and designation</li>
        <li>Conference event details</li>
      </ul>
    </div>
    
    <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #856404;">📋 How to Use Your Badge:</h4>
      <p style="margin-bottom: 8px;"><strong>Option 1 (Recommended):</strong> Print the attached PDF and bring it to the venue</p>
      <p style="margin-bottom: 0;"><strong>Option 2:</strong> Save the PDF to your mobile device and show it at registration</p>
    </div>
    
    <p><strong>Important:</strong> Please print your badge or save it to your mobile device before arriving at the venue.</p>
    
    <p>You can also access your badge anytime from your dashboard at <a href="${conferenceConfig.contact.website}/dashboard">${conferenceConfig.contact.website}/dashboard</a></p>
    
    <p>See you at the conference!</p>
    
    <p>Best regards,<br>
    <strong>${conferenceConfig.shortName} Team</strong></p>
  `
  
  return getBaseTemplate(content)
}

// Certificate Available Email Template
export function getCertificateAvailableTemplate(userData: {
  name: string
  registrationId: string
}) {
  const content = `
    <h2>🎓 Your Participation Certificate is Available</h2>
    <p>Dear ${userData.name},</p>
    
    <p>Thank you for participating in <strong>${conferenceConfig.shortName}</strong>!</p>
    
    <p><strong>Your certificate of participation is attached to this email</strong> as a PDF file.</p>
    
    <div class="highlight">
      <h3>Certificate Details:</h3>
      <table>
        <tr><th>Registration ID</th><td><strong>${userData.registrationId}</strong></td></tr>
        <tr><th>Certificate Type</th><td>Participation Certificate</td></tr>
        <tr><th>Status</th><td><span style="color: green; font-weight: bold;">✓ READY</span></td></tr>
        <tr><th>Attachment</th><td><span style="color: #2196f3; font-weight: bold;">📎 Certificate-${userData.registrationId}.pdf</span></td></tr>
      </table>
    </div>
    
    <div style="background-color: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #2e7d32;">✓ Your Certificate is Attached!</h4>
      <ul style="margin-bottom: 0;">
        <li>Check the email attachments for <strong>Certificate-${userData.registrationId}.pdf</strong></li>
        <li>PDF format - Ready for printing and official records</li>
        <li>High-quality, professional certificate</li>
        <li>Save it for your records</li>
      </ul>
    </div>
    
    <div style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #1565c0;">📥 How to Access Your Certificate:</h4>
      <p style="margin-bottom: 8px;"><strong>Option 1 (Recommended):</strong> Download the PDF attached to this email</p>
      <p style="margin-bottom: 0;"><strong>Option 2:</strong> Log in to your dashboard at <a href="${conferenceConfig.contact.website}/dashboard">${conferenceConfig.contact.website}/dashboard</a> to download additional formats (PNG)</p>
    </div>
    
    <p>This certificate serves as official proof of your attendance and participation in the conference.</p>
    
    <p>Thank you for being part of this event!</p>
    
    <p>Warm regards,<br>
    <strong>${conferenceConfig.shortName} Organizing Committee</strong></p>
  `
  
  return getBaseTemplate(content)
}

// Event Reminder Email Template
export function getEventReminderTemplate(userData: {
  name: string
  registrationId: string
  category: string
}) {
  const content = `
    <h2>⏰ See You Tomorrow at ${conferenceConfig.shortName}!</h2>
    <p>Dear ${userData.name},</p>
    
    <p>We're excited to welcome you to <strong>${conferenceConfig.shortName}</strong> starting tomorrow!</p>
    
    <div class="highlight">
      <h3>Your Registration Details:</h3>
      <table>
        <tr><th>Registration ID</th><td><strong>${userData.registrationId}</strong></td></tr>
        <tr><th>Category</th><td>${userData.category}</td></tr>
        <tr><th>Event Dates</th><td>April 25-26, 2026 (Saturday & Sunday)</td></tr>
        <tr><th>Venue</th><td>${conferenceConfig.venue.name}, ${conferenceConfig.venue.city}</td></tr>
      </table>
    </div>

    <div style="background-color: #f0fdf4; padding: 15px; border-left: 4px solid #16a34a; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #166534;">📍 Venue & Directions</h4>
      <p style="margin: 0 0 8px 0;"><strong>${conferenceConfig.venue.name}</strong><br>${conferenceConfig.venue.address || 'HICC Complex, Madhapur'}<br>${conferenceConfig.venue.city}, ${conferenceConfig.venue.state}</p>
      <p style="margin: 0;">
        <a href="https://share.google/45d0CJbIkGdUmrBxx" style="color: #015189; font-weight: bold; text-decoration: none;">📍 Get Directions on Google Maps →</a>
      </p>
    </div>
    
    <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #856404;">📌 Important Reminders:</h4>
      <ul style="margin-bottom: 0;">
        <li>Registration desk opens at <strong>8:00 AM</strong> on both days</li>
        <li>Carry your <strong>QR code</strong> (from your registration email) for quick check-in</li>
        <li>Review the <a href="https://www.isshmidtermcme2026.com/program-schedule" style="color: #015189;">scientific programme</a> before arriving</li>
        <li>If you are presenting, please arrive <strong>15 minutes early</strong> and carry your presentation on a USB drive</li>
        <li>Dress code: Business/Smart Casual</li>
      </ul>
    </div>

    <div style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #0284c7; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #0c4a6e;">📞 Need Help?</h4>
      <p style="margin: 0;">
        Email: <a href="mailto:${conferenceConfig.contact.email}" style="color: #015189;">${conferenceConfig.contact.email}</a><br>
        Phone: ${conferenceConfig.contact.phone}
      </p>
    </div>
    
    <div style="text-align: center; margin: 25px 0;">
      <a href="https://www.isshmidtermcme2026.com/program-schedule" class="button">
        View Programme Schedule
      </a>
    </div>
    
    <p>We look forward to seeing you tomorrow!</p>
    
    <p>Best regards,<br>
    <strong>${conferenceConfig.shortName} Organising Committee</strong></p>
  `
  
  return getBaseTemplate(content)
}

// Custom Announcement Email Template
export function getAnnouncementTemplate(userData: {
  name: string
}, announcementContent: string) {
  const content = `
    <h2>📢 Important Update - ${conferenceConfig.shortName}</h2>
    <p>Dear ${userData.name},</p>
    
    <p>We have an important update regarding <strong>${conferenceConfig.shortName}</strong>.</p>
    
    <div class="highlight">
      ${announcementContent.replace(/\n/g, '<br>')}
    </div>
    
    <p>For questions or concerns, please contact:</p>
    <p style="text-align: center;">
      <strong>Email:</strong> <a href="mailto:${conferenceConfig.contact.email}">${conferenceConfig.contact.email}</a><br>
      <strong>Phone:</strong> ${conferenceConfig.contact.phone}
    </p>
    
    <p>Thank you for your attention.</p>
    
    <p>Best regards,<br>
    <strong>${conferenceConfig.shortName} Organizing Committee</strong></p>
  `
  
  return getBaseTemplate(content)
}

// Workshop Reminder Email Template
export function getWorkshopReminderTemplate(userData: {
  name: string
  registrationId: string
  workshop: string
}) {
  const content = `
    <h2>🎯 Workshop Reminder - ${conferenceConfig.shortName}</h2>
    <p>Dear ${userData.name},</p>
    
    <p>This is a reminder about your registered workshop at <strong>${conferenceConfig.shortName}</strong>!</p>
    
    <div class="highlight">
      <h3>Workshop Details:</h3>
      <table>
        <tr><th>Registration ID</th><td><strong>${userData.registrationId}</strong></td></tr>
        <tr><th>Workshop</th><td><strong>${userData.workshop}</strong></td></tr>
        <tr><th>Conference Dates</th><td>${conferenceConfig.eventDate.start} to ${conferenceConfig.eventDate.end}</td></tr>
        <tr><th>Venue</th><td>${conferenceConfig.venue.name}, ${conferenceConfig.venue.city}</td></tr>
      </table>
    </div>
    
    <div style="background-color: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #2e7d32;">Workshop Preparation:</h4>
      <ul style="margin-bottom: 0;">
        <li>✓ Please arrive 15 minutes before the workshop start time</li>
        <li>✓ Bring any required materials mentioned in the workshop description</li>
        <li>✓ Workshop materials will be provided at the venue</li>
        <li>✓ Certificate of attendance will be issued after completion</li>
      </ul>
    </div>
    
    <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #856404;">Important Notes:</h4>
      <ul style="margin-bottom: 0;">
        <li>Workshop registration is confirmed</li>
        <li>Seats are limited - please be punctual</li>
        <li>Hands-on sessions require active participation</li>
        <li>Contact us immediately if you cannot attend</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 25px 0;">
      <a href="${conferenceConfig.contact.website}/dashboard" class="button">
        View Workshop Details
      </a>
    </div>
    
    <p>We look forward to your participation!</p>
    
    <p>Best regards,<br>
    <strong>${conferenceConfig.shortName} Workshop Committee</strong></p>
  `
  
  return getBaseTemplate(content)
}

// Abstract Submission Reminder Email Template
export function getAbstractReminderTemplate(userData: {
  name: string
  registrationId: string
  deadline: string
  submittedCount: number
  maxAllowed: number
}) {
  const content = `
    <h2>📝 Abstract Submission Reminder - ${conferenceConfig.shortName}</h2>
    <p>Dear ${userData.name},</p>
    
    <p>This is a reminder about abstract submission for <strong>${conferenceConfig.shortName}</strong>.</p>
    
    <div class="highlight">
      <h3>Submission Status:</h3>
      <table>
        <tr><th>Registration ID</th><td><strong>${userData.registrationId}</strong></td></tr>
        <tr><th>Abstracts Submitted</th><td><strong>${userData.submittedCount}</strong> of ${userData.maxAllowed} allowed</td></tr>
        <tr><th>Submission Deadline</th><td style="color: #d32f2f; font-weight: bold;">${userData.deadline}</td></tr>
        <tr><th>Status</th><td>${userData.submittedCount > 0 ? '<span style="color: #4caf50;">✓ Submitted</span>' : '<span style="color: #ffa500;">Pending</span>'}</td></tr>
      </table>
    </div>
    
    ${userData.submittedCount < userData.maxAllowed ? `
    <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #856404;">Don't miss this opportunity!</h4>
      <p style="margin-bottom: 0; color: #856404;">
        You can submit up to <strong>${userData.maxAllowed} abstracts</strong>. You have submitted <strong>${userData.submittedCount}</strong> so far. 
        Submit your research before the deadline on <strong>${userData.deadline}</strong>!
      </p>
    </div>
    ` : ''}
    
    <div style="text-align: center; margin: 25px 0;">
      <a href="${conferenceConfig.contact.website}/dashboard" class="button">
        ${userData.submittedCount < userData.maxAllowed ? 'Submit Abstract' : 'View Submitted Abstracts'}
      </a>
    </div>
    
    <div style="background-color: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #2e7d32;">Submission Guidelines:</h4>
      <ul style="margin-bottom: 0;">
        <li>Maximum word count: 300 words</li>
        <li>Structured format: Background, Methods, Results, Conclusion</li>
        <li>All abstracts will undergo peer review</li>
        <li>Acceptance notifications will be sent via email</li>
      </ul>
    </div>
    
    <p>For questions about abstract submission, contact: <a href="mailto:${conferenceConfig.contact.abstractsEmail || conferenceConfig.contact.email}">${conferenceConfig.contact.abstractsEmail || conferenceConfig.contact.email}</a></p>
    
    <p>Best regards,<br>
    <strong>${conferenceConfig.shortName} Scientific Committee</strong></p>
  `
  
  return getBaseTemplate(content)
}