import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export interface IEmailQueue extends Document {
  emailId: string
  recipient: {
    userId?: Types.ObjectId
    email: string
    name: string
  }
  template: string
  templateData: Record<string, any>
  subject: string
  priority: 'high' | 'normal' | 'low'
  status: 'queued' | 'processing' | 'sent' | 'failed' | 'dead'
  attempts: number
  maxAttempts: number
  lastAttempt?: Date
  nextRetry?: Date
  error?: string
  sentAt?: Date
  createdAt: Date
  updatedAt: Date
}

const EmailQueueSchema = new Schema<IEmailQueue>({
  emailId: {
    type: String,
    required: true,
    unique: true,
    default: () => `EQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  recipient: {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    }
  },
  template: {
    type: String,
    required: true
  },
  templateData: {
    type: Schema.Types.Mixed,
    default: {}
  },
  subject: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['high', 'normal', 'low'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: ['queued', 'processing', 'sent', 'failed', 'dead'],
    default: 'queued',
    index: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 4
  },
  lastAttempt: {
    type: Date
  },
  nextRetry: {
    type: Date,
    index: true
  },
  error: {
    type: String
  },
  sentAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Compound indexes for queue processing
EmailQueueSchema.index({ status: 1, nextRetry: 1 })
EmailQueueSchema.index({ status: 1, priority: -1, createdAt: 1 })
EmailQueueSchema.index({ 'recipient.email': 1 })

// Static method to get retry delay based on attempt number
EmailQueueSchema.statics.getRetryDelay = function(attemptNumber: number): number {
  // Retry schedule: 1min, 5min, 30min, 2hr
  const delays = [60000, 300000, 1800000, 7200000]
  return delays[Math.min(attemptNumber - 1, delays.length - 1)] || delays[delays.length - 1]
}

const EmailQueue: Model<IEmailQueue> = mongoose.models.EmailQueue || mongoose.model<IEmailQueue>('EmailQueue', EmailQueueSchema)

export default EmailQueue
