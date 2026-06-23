import EmailQueue, { IEmailQueue } from '../models/EmailQueue'
import EmailHistory, { EmailCategory } from '../models/EmailHistory'
import { sendEmail } from './smtp'
import { Types } from 'mongoose'

// Retry schedule in milliseconds: 1min, 5min, 30min, 2hr
const RETRY_DELAYS = [60000, 300000, 1800000, 7200000]
const DEFAULT_CONCURRENCY = 5
const MAX_ATTEMPTS = 4

export interface QueueEmailOptions {
  recipient: {
    userId?: Types.ObjectId | string
    email: string
    name: string
  }
  template: string
  templateData: Record<string, any>
  subject: string
  htmlContent: string
  plainTextContent?: string
  category?: EmailCategory
  priority?: 'high' | 'normal' | 'low'
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType: string
  }>
}

/**
 * Add an email to the queue instead of sending directly
 */
export async function addToQueue(options: QueueEmailOptions): Promise<IEmailQueue> {
  const emailQueue = new EmailQueue({
    recipient: {
      userId: options.recipient.userId ? new Types.ObjectId(options.recipient.userId.toString()) : undefined,
      email: options.recipient.email,
      name: options.recipient.name
    },
    template: options.template,
    templateData: {
      ...options.templateData,
      htmlContent: options.htmlContent,
      plainTextContent: options.plainTextContent || '',
      category: options.category || 'system',
      attachments: options.attachments?.map(a => ({
        filename: a.filename,
        contentType: a.contentType,
        size: a.content.length
      }))
    },
    subject: options.subject,
    priority: options.priority || 'normal',
    status: 'queued',
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS
  })

  await emailQueue.save()
  return emailQueue
}

/**
 * Process a single email from the queue
 */
async function processEmail(queueItem: IEmailQueue): Promise<boolean> {
  try {
    // Mark as processing
    queueItem.status = 'processing'
    queueItem.lastAttempt = new Date()
    queueItem.attempts += 1
    await queueItem.save()

    // Extract email content from templateData
    const { htmlContent, plainTextContent, category, attachments: attachmentMeta } = queueItem.templateData

    // Send the email
    const result = await sendEmail({
      to: queueItem.recipient.email,
      subject: queueItem.subject,
      html: htmlContent,
      text: plainTextContent || '',
      // Note: Attachments would need to be reconstructed if stored
    })

    if (result.success) {
      // Mark as sent
      queueItem.status = 'sent'
      queueItem.sentAt = new Date()
      await queueItem.save()

      // Save to EmailHistory for full tracking
      await EmailHistory.create({
        recipient: {
          userId: queueItem.recipient.userId,
          email: queueItem.recipient.email,
          name: queueItem.recipient.name
        },
        subject: queueItem.subject,
        htmlContent: htmlContent,
        plainTextContent: plainTextContent || '',
        templateName: queueItem.template,
        templateData: queueItem.templateData,
        category: category || 'system',
        attachments: attachmentMeta,
        status: 'sent',
        messageId: result.messageId,
        sentAt: new Date(),
        tracking: {
          openCount: 0,
          clicks: []
        }
      })

      return true
    } else {
      throw new Error(result.error || 'Email send failed')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    queueItem.error = errorMessage

    if (queueItem.attempts >= MAX_ATTEMPTS) {
      // Move to dead letter queue
      queueItem.status = 'dead'
      
      // Save failed email to history
      await EmailHistory.create({
        recipient: {
          userId: queueItem.recipient.userId,
          email: queueItem.recipient.email,
          name: queueItem.recipient.name
        },
        subject: queueItem.subject,
        htmlContent: queueItem.templateData.htmlContent || '',
        plainTextContent: queueItem.templateData.plainTextContent || '',
        templateName: queueItem.template,
        templateData: queueItem.templateData,
        category: queueItem.templateData.category || 'system',
        status: 'failed',
        error: errorMessage,
        sentAt: new Date()
      })
    } else {
      // Schedule retry
      queueItem.status = 'failed'
      const retryDelay = RETRY_DELAYS[Math.min(queueItem.attempts - 1, RETRY_DELAYS.length - 1)]
      queueItem.nextRetry = new Date(Date.now() + retryDelay)
    }

    await queueItem.save()
    return false
  }
}

/**
 * Process the email queue with configurable concurrency
 */
export async function processQueue(concurrency: number = DEFAULT_CONCURRENCY): Promise<{
  processed: number
  succeeded: number
  failed: number
}> {
  const stats = { processed: 0, succeeded: 0, failed: 0 }

  // Get emails ready to process (queued or failed with nextRetry in the past)
  const emailsToProcess = await EmailQueue.find({
    $or: [
      { status: 'queued' },
      { status: 'failed', nextRetry: { $lte: new Date() } }
    ]
  })
    .sort({ priority: -1, createdAt: 1 }) // High priority first, then oldest
    .limit(concurrency)

  // Process emails concurrently
  const results = await Promise.allSettled(
    emailsToProcess.map(email => processEmail(email))
  )

  results.forEach(result => {
    stats.processed++
    if (result.status === 'fulfilled' && result.value) {
      stats.succeeded++
    } else {
      stats.failed++
    }
  })

  return stats
}

/**
 * Retry a specific dead-lettered email
 */
export async function retryDeadLetter(emailId: string): Promise<boolean> {
  const email = await EmailQueue.findOne({ emailId, status: 'dead' })
  if (!email) {
    throw new Error('Email not found or not in dead letter queue')
  }

  // Reset for retry
  email.status = 'queued'
  email.attempts = 0
  email.error = undefined
  email.nextRetry = undefined
  await email.save()

  return true
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  queued: number
  processing: number
  sent: number
  failed: number
  dead: number
  total: number
}> {
  const [queued, processing, sent, failed, dead] = await Promise.all([
    EmailQueue.countDocuments({ status: 'queued' }),
    EmailQueue.countDocuments({ status: 'processing' }),
    EmailQueue.countDocuments({ status: 'sent' }),
    EmailQueue.countDocuments({ status: 'failed' }),
    EmailQueue.countDocuments({ status: 'dead' })
  ])

  return {
    queued,
    processing,
    sent,
    failed,
    dead,
    total: queued + processing + sent + failed + dead
  }
}

/**
 * Get emails for a specific user
 */
export async function getUserEmails(userId: string, options?: {
  limit?: number
  skip?: number
  category?: EmailCategory
}): Promise<{ emails: any[], total: number }> {
  const query: any = { 'recipient.userId': new Types.ObjectId(userId) }
  
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
 * Get a single email with full content
 */
export async function getEmailContent(emailId: string): Promise<any> {
  return EmailHistory.findOne({ emailId })
}

/**
 * Track email open (called from tracking pixel endpoint)
 */
export async function trackEmailOpen(emailId: string): Promise<void> {
  await EmailHistory.updateOne(
    { emailId },
    {
      $set: { 'tracking.lastOpenedAt': new Date() },
      $inc: { 'tracking.openCount': 1 },
      $setOnInsert: { 'tracking.openedAt': new Date() }
    }
  )
}

/**
 * Track link click (called from redirect endpoint)
 */
export async function trackLinkClick(emailId: string, url: string): Promise<void> {
  await EmailHistory.updateOne(
    { emailId },
    {
      $push: {
        'tracking.clicks': {
          url,
          clickedAt: new Date()
        }
      }
    }
  )
}

export default {
  addToQueue,
  processQueue,
  retryDeadLetter,
  getQueueStats,
  getUserEmails,
  getEmailContent,
  trackEmailOpen,
  trackLinkClick
}
