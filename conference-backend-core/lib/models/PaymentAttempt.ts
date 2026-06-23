import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export type PaymentMethod = 'razorpay' | 'bank_transfer' | 'sponsored' | 'complimentary'
export type PaymentAttemptStatus = 'initiated' | 'processing' | 'success' | 'failed' | 'cancelled' | 'refunded'

export interface IPaymentAttempt extends Document {
  attemptId: string
  userId: Types.ObjectId
  userEmail: string
  registrationId: string
  attemptNumber: number
  
  // Payment details
  amount: number
  currency: string
  method: PaymentMethod
  
  // Razorpay-specific
  razorpay?: {
    orderId: string
    paymentId?: string
    signature?: string
    idempotencyKey?: string
  }
  
  // Bank transfer specific
  bankTransfer?: {
    utr: string
    bankName?: string
    accountNumber?: string
    verifiedBy?: string
    verifiedAt?: Date
  }
  
  // Sponsor specific
  sponsor?: {
    sponsorId: Types.ObjectId
    sponsorName: string
    claimedBy: string
  }
  
  // Status
  status: PaymentAttemptStatus
  error?: string
  errorCode?: string
  
  // Device/session info
  device: {
    ip: string
    browser: string
    os: string
    userAgent: string
  }
  
  // Timestamps
  initiatedAt: Date
  completedAt?: Date
  
  // Webhook data (for debugging)
  webhookData?: Record<string, any>
  
  createdAt: Date
  updatedAt: Date
}

const PaymentAttemptSchema = new Schema<IPaymentAttempt>({
  attemptId: {
    type: String,
    required: true,
    unique: true,
    default: () => `PA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  registrationId: {
    type: String,
    required: true,
    index: true
  },
  attemptNumber: {
    type: Number,
    required: true,
    default: 1
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'INR'
  },
  method: {
    type: String,
    enum: ['razorpay', 'bank_transfer', 'sponsored', 'complimentary'],
    required: true
  },
  razorpay: {
    orderId: { type: String },
    paymentId: { type: String },
    signature: { type: String },
    idempotencyKey: { type: String, index: true }
  },
  bankTransfer: {
    utr: { type: String },
    bankName: { type: String },
    accountNumber: { type: String },
    verifiedBy: { type: String },
    verifiedAt: { type: Date }
  },
  sponsor: {
    sponsorId: { type: Schema.Types.ObjectId, ref: 'User' },
    sponsorName: { type: String },
    claimedBy: { type: String }
  },
  status: {
    type: String,
    enum: ['initiated', 'processing', 'success', 'failed', 'cancelled', 'refunded'],
    default: 'initiated',
    index: true
  },
  error: { type: String },
  errorCode: { type: String },
  device: {
    ip: { type: String, default: 'unknown' },
    browser: { type: String, default: 'unknown' },
    os: { type: String, default: 'unknown' },
    userAgent: { type: String, default: '' }
  },
  initiatedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  completedAt: { type: Date },
  webhookData: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
})

// Compound indexes for efficient querying
PaymentAttemptSchema.index({ userId: 1, initiatedAt: -1 })
PaymentAttemptSchema.index({ registrationId: 1, attemptNumber: 1 })
PaymentAttemptSchema.index({ status: 1, initiatedAt: -1 })
PaymentAttemptSchema.index({ 'razorpay.orderId': 1 })

// Static method to get next attempt number for a registration
PaymentAttemptSchema.statics.getNextAttemptNumber = async function(registrationId: string): Promise<number> {
  const lastAttempt = await this.findOne({ registrationId }).sort({ attemptNumber: -1 })
  return lastAttempt ? lastAttempt.attemptNumber + 1 : 1
}

const PaymentAttempt: Model<IPaymentAttempt> = mongoose.models.PaymentAttempt || mongoose.model<IPaymentAttempt>('PaymentAttempt', PaymentAttemptSchema)

export default PaymentAttempt
