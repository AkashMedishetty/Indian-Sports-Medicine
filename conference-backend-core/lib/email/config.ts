import { conferenceConfig } from '../../config/conference.config'

// Email template configuration
export const emailTemplateConfig = {
  // Enable/disable specific email templates
  templates: {
    registration: {
      enabled: true,
      subject: `Application Received - ${conferenceConfig.shortName}`
    },
    payment: {
      enabled: true,
      subject: `Payment Confirmation - ${conferenceConfig.shortName}`
    },
    paymentReminder: {
      enabled: true,
      subject: `Payment Reminder - ${conferenceConfig.shortName}`
    },
    customMessage: {
      enabled: true,
      subject: `Message from ${conferenceConfig.shortName} Team`
    },
    test: {
      enabled: true, 
      subject: `Test Email - ${conferenceConfig.shortName}`
    },
    passwordReset: {
      enabled: true,
      subject: `Password Reset - ${conferenceConfig.shortName}`
    },
    bulkEmail: {
      enabled: true,
      subject: `Important Update - ${conferenceConfig.shortName}`
    }
  },

  // Global email settings
  settings: {
    fromName: conferenceConfig.shortName,
    fromEmail: process.env.SMTP_USER || conferenceConfig.contact.email,
    replyTo: process.env.SMTP_USER || conferenceConfig.contact.email,
    enableTracking: true,
    enableAutoResponder: true
  }
}

export function isTemplateEnabled(templateType: string): boolean {
  return emailTemplateConfig.templates[templateType as keyof typeof emailTemplateConfig.templates]?.enabled || false
}

export function getTemplateSubject(templateType: string): string {
  return emailTemplateConfig.templates[templateType as keyof typeof emailTemplateConfig.templates]?.subject || conferenceConfig.shortName
}