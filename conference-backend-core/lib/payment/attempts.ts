/**
 * Payment Attempt Tracking Service
 * Tracks ALL payment attempts (success/failure) for complete payment history
 */

import PaymentAttempt, { 
  PaymentMethod, 
  PaymentAttemptStatus, 
  IPaymentAttempt 
} from '../models/PaymentAttempt'
import { Types } from 'mongoose'
import crypto from 'crypto'

export interface DeviceInfo {
  ip: string
  browser?: string
  os?: string
  userAgent?: string
}

export interface RecordAttemptOptions {
  userId: string | Types.ObjectId
  userEmail: string
  registrationId: string
  amount: number
  currency?: string
  method: PaymentMethod
  device: DeviceInfo
  
  // Method-specific data
  razorpay?: {
    orderId: string
    idempotencyKey?: string
  }
  bankTransfer?: {
    utr: string
    bankName?: string
    accountNumber?: string
  }
  sponsor?: {
    sponsorId: string | Types.ObjectId
    sponsorName: string
    claimedBy: string
  }
}

export interface AttemptResult {
  success: boolean
  attemptId?: string
  attemptNumber?: number
  error?: string
}

/**
 * Generate idempotency key for Razorpay orders
 */
export function generateIdempotencyKey(registrationId: string, attemptNumber: number): string {
  const timestamp = Date.now()
  const content = `${registrationId}-${attemptNumber}-${timestamp}`
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 32)
}

/**
 * Get next attempt number for a registration
 */
export async function getNextAttemptNumber(registrationId: string): Promise<number> {
  const lastAttempt = await PaymentAttempt.findOne({ registrationId })
    .sort({ attemptNumber: -1 })
  return lastAttempt ? lastAttempt.attemptNumber + 1 : 1
}

/**
 * Record a new payment attempt
 */
export async function recordAttempt(options: RecordAttemptOptions): Promise<AttemptResult> {
  const {
    userId,
    userEmail,
    registrationId,
    amount,
    currency = 'INR',
    method,
    device,
    razorpay,
    bankTransfer,
    sponsor
  } = options

  try {
    const attemptNumber = await getNextAttemptNumber(registrationId)
    
    // Generate idempotency key for Razorpay if not provided
    let razorpayData = razorpay
    if (method === 'razorpay' && razorpay && !razorpay.idempotencyKey) {
      razorpayData = {
        ...razorpay,
        idempotencyKey: generateIdempotencyKey(registrationId, attemptNumber)
      }
    }

    const attempt = await PaymentAttempt.create({
      userId: new Types.ObjectId(userId.toString()),
      userEmail,
      registrationId,
      attemptNumber,
      amount,
      currency,
      method,
      razorpay: razorpayData,
      bankTransfer,
      sponsor: sponsor ? {
        sponsorId: new Types.ObjectId(sponsor.sponsorId.toString()),
        sponsorName: sponsor.sponsorName,
        claimedBy: sponsor.claimedBy
      } : undefined,
      status: 'initiated',
      device: {
        ip: device.ip || 'unknown',
        browser: device.browser || 'unknown',
        os: device.os || 'unknown',
        userAgent: device.userAgent || ''
      },
      initiatedAt: new Date()
    })

    return {
      success: true,
      attemptId: attempt.attemptId,
      attemptNumber: attempt.attemptNumber
    }
  } catch (error) {
    console.error('Failed to record payment attempt:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update attempt status to processing
 */
export async function markAttemptProcessing(attemptId: string): Promise<IPaymentAttempt | null> {
  return PaymentAttempt.findOneAndUpdate(
    { attemptId },
    { status: 'processing' },
    { new: true }
  )
}

/**
 * Mark attempt as successful
 */
export async function markAttemptSuccess(
  attemptId: string,
  razorpayPaymentId?: string,
  razorpaySignature?: string
): Promise<IPaymentAttempt | null> {
  const updateData: any = {
    status: 'success',
    completedAt: new Date()
  }
  
  if (razorpayPaymentId) {
    updateData['razorpay.paymentId'] = razorpayPaymentId
  }
  if (razorpaySignature) {
    updateData['razorpay.signature'] = razorpaySignature
  }

  return PaymentAttempt.findOneAndUpdate(
    { attemptId },
    updateData,
    { new: true }
  )
}

/**
 * Mark attempt as failed
 */
export async function markAttemptFailed(
  attemptId: string,
  error: string,
  errorCode?: string
): Promise<IPaymentAttempt | null> {
  return PaymentAttempt.findOneAndUpdate(
    { attemptId },
    {
      status: 'failed',
      error,
      errorCode,
      completedAt: new Date()
    },
    { new: true }
  )
}

/**
 * Mark attempt as cancelled
 */
export async function markAttemptCancelled(attemptId: string): Promise<IPaymentAttempt | null> {
  return PaymentAttempt.findOneAndUpdate(
    { attemptId },
    {
      status: 'cancelled',
      completedAt: new Date()
    },
    { new: true }
  )
}


/**
 * Store webhook data for debugging
 */
export async function storeWebhookData(
  attemptId: string,
  webhookData: Record<string, any>
): Promise<IPaymentAttempt | null> {
  return PaymentAttempt.findOneAndUpdate(
    { attemptId },
    { webhookData },
    { new: true }
  )
}

/**
 * Find attempt by Razorpay order ID
 */
export async function findByRazorpayOrderId(orderId: string): Promise<IPaymentAttempt | null> {
  return PaymentAttempt.findOne({ 'razorpay.orderId': orderId })
}

/**
 * Find attempt by idempotency key
 */
export async function findByIdempotencyKey(key: string): Promise<IPaymentAttempt | null> {
  return PaymentAttempt.findOne({ 'razorpay.idempotencyKey': key })
}

/**
 * Get all attempts for a user
 */
export async function getAttemptsForUser(
  userId: string,
  options?: {
    limit?: number
    skip?: number
    status?: PaymentAttemptStatus
    method?: PaymentMethod
  }
): Promise<{ attempts: IPaymentAttempt[], total: number }> {
  const query: any = { userId: new Types.ObjectId(userId) }
  
  if (options?.status) query.status = options.status
  if (options?.method) query.method = options.method

  const [attempts, total] = await Promise.all([
    PaymentAttempt.find(query)
      .sort({ initiatedAt: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 50),
    PaymentAttempt.countDocuments(query)
  ])

  return { attempts, total }
}

/**
 * Get all attempts for a registration
 */
export async function getAttemptsForRegistration(
  registrationId: string,
  options?: {
    limit?: number
    skip?: number
  }
): Promise<{ attempts: IPaymentAttempt[], total: number }> {
  const query = { registrationId }

  const [attempts, total] = await Promise.all([
    PaymentAttempt.find(query)
      .sort({ attemptNumber: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 50),
    PaymentAttempt.countDocuments(query)
  ])

  return { attempts, total }
}

/**
 * Get successful attempt for a registration
 */
export async function getSuccessfulAttempt(registrationId: string): Promise<IPaymentAttempt | null> {
  return PaymentAttempt.findOne({
    registrationId,
    status: 'success'
  })
}

/**
 * Get payment attempt statistics
 */
export async function getPaymentStats(options?: {
  userId?: string
  startDate?: Date
  endDate?: Date
}): Promise<{
  total: number
  success: number
  failed: number
  cancelled: number
  processing: number
  byMethod: Record<string, number>
  totalAmount: number
  successAmount: number
}> {
  const matchStage: any = {}
  
  if (options?.userId) {
    matchStage.userId = new Types.ObjectId(options.userId)
  }
  if (options?.startDate || options?.endDate) {
    matchStage.initiatedAt = {}
    if (options?.startDate) matchStage.initiatedAt.$gte = options.startDate
    if (options?.endDate) matchStage.initiatedAt.$lte = options.endDate
  }

  const [statusStats, methodStats, amountStats] = await Promise.all([
    PaymentAttempt.aggregate([
      { $match: matchStage },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    PaymentAttempt.aggregate([
      { $match: matchStage },
      { $group: { _id: '$method', count: { $sum: 1 } } }
    ]),
    PaymentAttempt.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          successAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, '$amount', 0] }
          }
        }
      }
    ])
  ])

  const stats = {
    total: 0,
    success: 0,
    failed: 0,
    cancelled: 0,
    processing: 0,
    byMethod: {} as Record<string, number>,
    totalAmount: amountStats[0]?.totalAmount || 0,
    successAmount: amountStats[0]?.successAmount || 0
  }

  statusStats.forEach((s: any) => {
    stats[s._id as keyof typeof stats] = s.count
    stats.total += s.count
  })

  methodStats.forEach((m: any) => {
    stats.byMethod[m._id] = m.count
  })

  return stats
}

/**
 * Verify bank transfer and mark as success
 */
export async function verifyBankTransfer(
  attemptId: string,
  verifiedBy: string
): Promise<IPaymentAttempt | null> {
  return PaymentAttempt.findOneAndUpdate(
    { attemptId, method: 'bank_transfer' },
    {
      status: 'success',
      'bankTransfer.verifiedBy': verifiedBy,
      'bankTransfer.verifiedAt': new Date(),
      completedAt: new Date()
    },
    { new: true }
  )
}

/**
 * Record sponsored payment (instant success)
 */
export async function recordSponsoredPayment(options: {
  userId: string | Types.ObjectId
  userEmail: string
  registrationId: string
  amount: number
  sponsorId: string | Types.ObjectId
  sponsorName: string
  claimedBy: string
  device: DeviceInfo
}): Promise<AttemptResult> {
  const {
    userId,
    userEmail,
    registrationId,
    amount,
    sponsorId,
    sponsorName,
    claimedBy,
    device
  } = options

  try {
    const attemptNumber = await getNextAttemptNumber(registrationId)
    const now = new Date()

    const attempt = await PaymentAttempt.create({
      userId: new Types.ObjectId(userId.toString()),
      userEmail,
      registrationId,
      attemptNumber,
      amount,
      currency: 'INR',
      method: 'sponsored',
      sponsor: {
        sponsorId: new Types.ObjectId(sponsorId.toString()),
        sponsorName,
        claimedBy
      },
      status: 'success',
      device: {
        ip: device.ip || 'unknown',
        browser: device.browser || 'unknown',
        os: device.os || 'unknown',
        userAgent: device.userAgent || ''
      },
      initiatedAt: now,
      completedAt: now
    })

    return {
      success: true,
      attemptId: attempt.attemptId,
      attemptNumber: attempt.attemptNumber
    }
  } catch (error) {
    console.error('Failed to record sponsored payment:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Record complimentary registration (no payment)
 */
export async function recordComplimentaryRegistration(options: {
  userId: string | Types.ObjectId
  userEmail: string
  registrationId: string
  device: DeviceInfo
}): Promise<AttemptResult> {
  const { userId, userEmail, registrationId, device } = options

  try {
    const attemptNumber = await getNextAttemptNumber(registrationId)
    const now = new Date()

    const attempt = await PaymentAttempt.create({
      userId: new Types.ObjectId(userId.toString()),
      userEmail,
      registrationId,
      attemptNumber,
      amount: 0,
      currency: 'INR',
      method: 'complimentary',
      status: 'success',
      device: {
        ip: device.ip || 'unknown',
        browser: device.browser || 'unknown',
        os: device.os || 'unknown',
        userAgent: device.userAgent || ''
      },
      initiatedAt: now,
      completedAt: now
    })

    return {
      success: true,
      attemptId: attempt.attemptId,
      attemptNumber: attempt.attemptNumber
    }
  } catch (error) {
    console.error('Failed to record complimentary registration:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export default {
  generateIdempotencyKey,
  getNextAttemptNumber,
  recordAttempt,
  markAttemptProcessing,
  markAttemptSuccess,
  markAttemptFailed,
  markAttemptCancelled,
  storeWebhookData,
  findByRazorpayOrderId,
  findByIdempotencyKey,
  getAttemptsForUser,
  getAttemptsForRegistration,
  getSuccessfulAttempt,
  getPaymentStats,
  verifyBankTransfer,
  recordSponsoredPayment,
  recordComplimentaryRegistration
}
