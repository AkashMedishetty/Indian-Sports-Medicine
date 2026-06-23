/**
 * Error Logging Service
 * Provides comprehensive error tracking with user context, device info, and aggregation
 */

import ErrorLog, { 
  ErrorSeverity, 
  ErrorCategory, 
  ErrorSource, 
  IErrorLog 
} from '../models/ErrorLog'
import { sendEmail } from '../email/smtp'
import { Types } from 'mongoose'
import crypto from 'crypto'

export interface LogErrorOptions {
  message: string
  stack?: string
  severity?: ErrorSeverity
  category?: ErrorCategory
  source?: ErrorSource
  
  // Request context
  url?: string
  endpoint?: string
  httpMethod?: string
  
  // User context
  userId?: string | Types.ObjectId
  userEmail?: string
  sessionId?: string
  
  // Metadata based on category
  metadata?: {
    orderId?: string
    paymentMethod?: string
    amount?: number
    razorpayError?: string
    formName?: string
    fieldName?: string
    invalidValue?: string
    validationErrors?: string[]
    fileName?: string
    fileSize?: number
    fileType?: string
    requestBody?: Record<string, any>
    responseStatus?: number
    responseBody?: Record<string, any>
    additionalInfo?: Record<string, any>
  }
  
  // Device info
  device?: {
    browser?: string
    browserVersion?: string
    os?: string
    osVersion?: string
    ip?: string
    userAgent?: string
    screenResolution?: string
  }
}

export interface ErrorLogResult {
  success: boolean
  errorId?: string
  isNewError: boolean
  occurrences: number
  error?: string
}

/**
 * Generate fingerprint for error deduplication
 */
function generateFingerprint(message: string, stack?: string, category?: string): string {
  const content = `${message}|${stack?.split('\n')[0] || ''}|${category || ''}`
  return crypto.createHash('md5').update(content).digest('hex')
}

/**
 * Log an error with full context and aggregation
 */
export async function logError(options: LogErrorOptions): Promise<ErrorLogResult> {
  const {
    message,
    stack,
    severity = 'error',
    category = 'system',
    source = 'backend',
    url,
    endpoint,
    httpMethod,
    userId,
    userEmail,
    sessionId,
    metadata,
    device
  } = options

  try {
    const fingerprint = generateFingerprint(message, stack, category)
    const now = new Date()

    // Check for existing unresolved error with same fingerprint
    const existingError = await ErrorLog.findOne({
      fingerprint,
      resolved: false
    })

    if (existingError) {
      // Aggregate: increment occurrences and update lastOccurrence
      existingError.occurrences += 1
      existingError.lastOccurrence = now
      
      // Update user context if not set
      if (!existingError.userId && userId) {
        existingError.userId = new Types.ObjectId(userId.toString())
      }
      if (!existingError.userEmail && userEmail) {
        existingError.userEmail = userEmail
      }
      
      await existingError.save()

      // Send alert for critical errors reaching threshold
      if (severity === 'critical' && existingError.occurrences % 10 === 0 && !existingError.alertSent) {
        await sendCriticalErrorAlert(existingError)
      }

      return {
        success: true,
        errorId: existingError.errorId,
        isNewError: false,
        occurrences: existingError.occurrences
      }
    }

    // Create new error log
    const errorLog = await ErrorLog.create({
      message,
      stack,
      severity,
      category,
      source,
      url,
      endpoint,
      httpMethod,
      userId: userId ? new Types.ObjectId(userId.toString()) : undefined,
      userEmail,
      sessionId,
      metadata,
      device: {
        browser: device?.browser || 'unknown',
        browserVersion: device?.browserVersion,
        os: device?.os || 'unknown',
        osVersion: device?.osVersion,
        ip: device?.ip || 'unknown',
        userAgent: device?.userAgent || '',
        screenResolution: device?.screenResolution
      },
      fingerprint,
      occurrences: 1,
      firstOccurrence: now,
      lastOccurrence: now
    })

    // Send immediate alert for critical errors
    if (severity === 'critical') {
      await sendCriticalErrorAlert(errorLog)
    }

    return {
      success: true,
      errorId: errorLog.errorId,
      isNewError: true,
      occurrences: 1
    }
  } catch (error) {
    console.error('Failed to log error:', error)
    return {
      success: false,
      isNewError: false,
      occurrences: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}


/**
 * Send critical error alert email to admins
 */
async function sendCriticalErrorAlert(errorLog: IErrorLog): Promise<void> {
  try {
    const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.SMTP_USER
    if (!adminEmail) {
      console.warn('No admin email configured for critical error alerts')
      return
    }

    await sendEmail({
      to: adminEmail,
      subject: `🚨 CRITICAL ERROR: ${errorLog.category} - ${errorLog.message.substring(0, 50)}`,
      html: `
        <h2>Critical Error Alert</h2>
        <p><strong>Error ID:</strong> ${errorLog.errorId}</p>
        <p><strong>Category:</strong> ${errorLog.category}</p>
        <p><strong>Message:</strong> ${errorLog.message}</p>
        <p><strong>Occurrences:</strong> ${errorLog.occurrences}</p>
        <p><strong>First Occurrence:</strong> ${errorLog.firstOccurrence}</p>
        <p><strong>Last Occurrence:</strong> ${errorLog.lastOccurrence}</p>
        ${errorLog.userEmail ? `<p><strong>User:</strong> ${errorLog.userEmail}</p>` : ''}
        ${errorLog.url ? `<p><strong>URL:</strong> ${errorLog.url}</p>` : ''}
        ${errorLog.stack ? `<pre style="background:#f5f5f5;padding:10px;overflow:auto;">${errorLog.stack}</pre>` : ''}
      `,
      text: `Critical Error: ${errorLog.errorId}\nCategory: ${errorLog.category}\nMessage: ${errorLog.message}\nOccurrences: ${errorLog.occurrences}`
    })

    // Mark alert as sent
    errorLog.alertSent = true
    errorLog.alertSentAt = new Date()
    await errorLog.save()
  } catch (alertError) {
    console.error('Failed to send critical error alert:', alertError)
  }
}

/**
 * Get errors for a specific user
 */
export async function getErrorsForUser(
  userId: string,
  options?: {
    limit?: number
    skip?: number
    category?: ErrorCategory
    severity?: ErrorSeverity
    resolved?: boolean
  }
): Promise<{ errors: IErrorLog[], total: number }> {
  const query: any = { userId: new Types.ObjectId(userId) }
  
  if (options?.category) query.category = options.category
  if (options?.severity) query.severity = options.severity
  if (options?.resolved !== undefined) query.resolved = options.resolved

  const [errors, total] = await Promise.all([
    ErrorLog.find(query)
      .sort({ lastOccurrence: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 50),
    ErrorLog.countDocuments(query)
  ])

  return { errors, total }
}

/**
 * Get errors by email (for users without userId)
 */
export async function getErrorsByEmail(
  email: string,
  options?: {
    limit?: number
    skip?: number
    category?: ErrorCategory
  }
): Promise<{ errors: IErrorLog[], total: number }> {
  const query: any = { userEmail: email.toLowerCase() }
  
  if (options?.category) query.category = options.category

  const [errors, total] = await Promise.all([
    ErrorLog.find(query)
      .sort({ lastOccurrence: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 50),
    ErrorLog.countDocuments(query)
  ])

  return { errors, total }
}

/**
 * Get all errors with filtering
 */
export async function getErrors(options?: {
  limit?: number
  skip?: number
  category?: ErrorCategory
  severity?: ErrorSeverity
  resolved?: boolean
  source?: ErrorSource
  startDate?: Date
  endDate?: Date
}): Promise<{ errors: IErrorLog[], total: number }> {
  const query: any = {}
  
  if (options?.category) query.category = options.category
  if (options?.severity) query.severity = options.severity
  if (options?.resolved !== undefined) query.resolved = options.resolved
  if (options?.source) query.source = options.source
  
  if (options?.startDate || options?.endDate) {
    query.lastOccurrence = {}
    if (options?.startDate) query.lastOccurrence.$gte = options.startDate
    if (options?.endDate) query.lastOccurrence.$lte = options.endDate
  }

  const [errors, total] = await Promise.all([
    ErrorLog.find(query)
      .sort({ lastOccurrence: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 50),
    ErrorLog.countDocuments(query)
  ])

  return { errors, total }
}

/**
 * Resolve an error
 */
export async function resolveError(
  errorId: string,
  resolvedBy: string,
  notes?: string
): Promise<IErrorLog | null> {
  const error = await ErrorLog.findOne({ errorId })
  if (!error) return null

  error.resolved = true
  error.resolvedBy = new Types.ObjectId(resolvedBy)
  error.resolvedAt = new Date()
  if (notes) error.resolutionNotes = notes

  await error.save()
  return error
}

/**
 * Get error statistics
 */
export async function getErrorStats(options?: {
  userId?: string
  startDate?: Date
  endDate?: Date
}): Promise<{
  total: number
  critical: number
  error: number
  warning: number
  info: number
  resolved: number
  unresolved: number
  byCategory: Record<string, number>
}> {
  const matchStage: any = {}
  
  if (options?.userId) {
    matchStage.userId = new Types.ObjectId(options.userId)
  }
  if (options?.startDate || options?.endDate) {
    matchStage.lastOccurrence = {}
    if (options?.startDate) matchStage.lastOccurrence.$gte = options.startDate
    if (options?.endDate) matchStage.lastOccurrence.$lte = options.endDate
  }

  const [severityStats, categoryStats, resolvedStats] = await Promise.all([
    ErrorLog.aggregate([
      { $match: matchStage },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]),
    ErrorLog.aggregate([
      { $match: matchStage },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]),
    ErrorLog.aggregate([
      { $match: matchStage },
      { $group: { _id: '$resolved', count: { $sum: 1 } } }
    ])
  ])

  const stats = {
    total: 0,
    critical: 0,
    error: 0,
    warning: 0,
    info: 0,
    resolved: 0,
    unresolved: 0,
    byCategory: {} as Record<string, number>
  }

  severityStats.forEach((s: any) => {
    stats[s._id as keyof typeof stats] = s.count
    stats.total += s.count
  })

  categoryStats.forEach((c: any) => {
    stats.byCategory[c._id] = c.count
  })

  resolvedStats.forEach((r: any) => {
    if (r._id === true) stats.resolved = r.count
    else stats.unresolved = r.count
  })

  return stats
}

/**
 * Log payment error with specific context
 */
export async function logPaymentError(
  message: string,
  options: {
    userId?: string
    userEmail?: string
    orderId?: string
    paymentMethod?: string
    amount?: number
    razorpayError?: string
    device?: LogErrorOptions['device']
    stack?: string
  }
): Promise<ErrorLogResult> {
  return logError({
    message,
    stack: options.stack,
    severity: 'error',
    category: 'payment',
    source: 'backend',
    userId: options.userId,
    userEmail: options.userEmail,
    metadata: {
      orderId: options.orderId,
      paymentMethod: options.paymentMethod,
      amount: options.amount,
      razorpayError: options.razorpayError
    },
    device: options.device
  })
}

/**
 * Log form validation error
 */
export async function logFormError(
  message: string,
  options: {
    userId?: string
    userEmail?: string
    formName: string
    fieldName?: string
    invalidValue?: string
    validationErrors?: string[]
    device?: LogErrorOptions['device']
  }
): Promise<ErrorLogResult> {
  return logError({
    message,
    severity: 'warning',
    category: 'form_validation',
    source: 'frontend',
    userId: options.userId,
    userEmail: options.userEmail,
    metadata: {
      formName: options.formName,
      fieldName: options.fieldName,
      invalidValue: options.invalidValue,
      validationErrors: options.validationErrors
    },
    device: options.device
  })
}

/**
 * Log API error
 */
export async function logApiError(
  message: string,
  options: {
    endpoint: string
    httpMethod: string
    userId?: string
    userEmail?: string
    requestBody?: Record<string, any>
    responseStatus?: number
    responseBody?: Record<string, any>
    stack?: string
    device?: LogErrorOptions['device']
  }
): Promise<ErrorLogResult> {
  return logError({
    message,
    stack: options.stack,
    severity: 'error',
    category: 'api',
    source: 'backend',
    endpoint: options.endpoint,
    httpMethod: options.httpMethod,
    userId: options.userId,
    userEmail: options.userEmail,
    metadata: {
      requestBody: options.requestBody,
      responseStatus: options.responseStatus,
      responseBody: options.responseBody
    },
    device: options.device
  })
}

export default {
  logError,
  logPaymentError,
  logFormError,
  logApiError,
  getErrorsForUser,
  getErrorsByEmail,
  getErrors,
  resolveError,
  getErrorStats
}
