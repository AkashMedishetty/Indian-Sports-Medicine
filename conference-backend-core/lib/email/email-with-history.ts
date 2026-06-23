/**
 * Email service wrapper that saves full email content to history
 * Use this instead of direct sendEmail for full tracking
 */

import { sendEmail } from './smtp'
import EmailHistory, { EmailCategory, IEmailHistory } from '../models/EmailHistory'
import { Types } from 'mongoose'

export interface SendEmailWithHistoryOptions {
  to: string
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType: string
  }>
  // Tracking metadata
  userId?: Types.ObjectId | string
  userName?: string
  templateName: string
  templateData?: Record<string, any>
  category: EmailCategory
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  emailHistoryId?: string
  error?: string
}

/**
 * Send email and save complete content to EmailHistory
 */
export async function sendEmailWithHistory(options: SendEmailWithHistoryOptions): Promise<SendEmailResult> {
  const {
    to,
    subject,
    html,
    text,
    attachments,
    userId,
    userName,
    templateName,
    templateData,
    category
  } = options

  // Prepare attachment metadata (don't store actual content in history)
  const attachmentMeta = attachments?.map(a => ({
    filename: a.filename,
    contentType: a.contentType,
    size: a.content.length
  }))

  try {
    // Send the email
    const result = await sendEmail({
      to,
      subject,
      html,
      text,
      attachments
    })

    // Create history record with full content
    const historyRecord = await EmailHistory.create({
      recipient: {
        userId: userId ? new Types.ObjectId(userId.toString()) : undefined,
        email: to,
        name: userName || to.split('@')[0]
      },
      subject,
      htmlContent: html,
      plainTextContent: text || '',
      templateName,
      templateData: templateData || {},
      category,
      attachments: attachmentMeta,
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId,
      error: result.error,
      sentAt: new Date(),
      tracking: {
        openCount: 0,
        clicks: []
      }
    })

    return {
      success: result.success,
      messageId: result.messageId,
      emailHistoryId: historyRecord.emailId,
      error: result.error
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Still try to save to history even if send failed
    try {
      await EmailHistory.create({
        recipient: {
          userId: userId ? new Types.ObjectId(userId.toString()) : undefined,
          email: to,
          name: userName || to.split('@')[0]
        },
        subject,
        htmlContent: html,
        plainTextContent: text || '',
        templateName,
        templateData: templateData || {},
        category,
        attachments: attachmentMeta,
        status: 'failed',
        error: errorMessage,
        sentAt: new Date()
      })
    } catch (historyError) {
      console.error('Failed to save email history:', historyError)
    }

    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Get email history for a user
 */
export async function getEmailHistoryForUser(
  userId: string,
  options?: {
    limit?: number
    skip?: number
    category?: EmailCategory
    status?: 'sent' | 'failed' | 'bounced'
    email?: string // Optional email for fallback search
  }
): Promise<{ emails: IEmailHistory[], total: number }> {
  // Search by userId OR by email (for older records without userId)
  const query: any = {
    $or: [
      { 'recipient.userId': new Types.ObjectId(userId) }
    ]
  }
  
  // Add email fallback if provided
  if (options?.email) {
    query.$or.push({ 'recipient.email': options.email.toLowerCase() })
  }
  
  if (options?.category) {
    query.category = options.category
  }
  if (options?.status) {
    query.status = options.status
  }

  const [emails, total] = await Promise.all([
    EmailHistory.find(query)
      .sort({ sentAt: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 50),
    EmailHistory.countDocuments(query)
  ])

  return { emails, total }
}

/**
 * Get email history by email address (for users without userId)
 */
export async function getEmailHistoryByEmail(
  email: string,
  options?: {
    limit?: number
    skip?: number
    category?: EmailCategory
  }
): Promise<{ emails: IEmailHistory[], total: number }> {
  const query: any = { 'recipient.email': email.toLowerCase() }
  
  if (options?.category) {
    query.category = options.category
  }

  const [emails, total] = await Promise.all([
    EmailHistory.find(query)
      .sort({ sentAt: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 50),
    EmailHistory.countDocuments(query)
  ])

  return { emails, total }
}

/**
 * Get single email with full content
 */
export async function getEmailById(emailId: string): Promise<IEmailHistory | null> {
  return EmailHistory.findOne({ emailId })
}

/**
 * Get email statistics
 */
export async function getEmailStats(options?: {
  userId?: string
  startDate?: Date
  endDate?: Date
}): Promise<{
  total: number
  sent: number
  failed: number
  opened: number
  byCategory: Record<string, number>
}> {
  const matchStage: any = {}
  
  if (options?.userId) {
    matchStage['recipient.userId'] = new Types.ObjectId(options.userId)
  }
  if (options?.startDate || options?.endDate) {
    matchStage.sentAt = {}
    if (options?.startDate) matchStage.sentAt.$gte = options.startDate
    if (options?.endDate) matchStage.sentAt.$lte = options.endDate
  }

  const [statusStats, categoryStats] = await Promise.all([
    EmailHistory.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),
    EmailHistory.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ])
  ])

  const openedCount = await EmailHistory.countDocuments({
    ...matchStage,
    'tracking.openCount': { $gt: 0 }
  })

  const stats = {
    total: 0,
    sent: 0,
    failed: 0,
    opened: openedCount,
    byCategory: {} as Record<string, number>
  }

  statusStats.forEach((s: any) => {
    if (s._id === 'sent') stats.sent = s.count
    else if (s._id === 'failed') stats.failed = s.count
    stats.total += s.count
  })

  categoryStats.forEach((c: any) => {
    stats.byCategory[c._id] = c.count
  })

  return stats
}

export default {
  sendEmailWithHistory,
  getEmailHistoryForUser,
  getEmailHistoryByEmail,
  getEmailById,
  getEmailStats
}
