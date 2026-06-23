import mongoose, { Document, Model, Schema, Types } from 'mongoose'

// Email categories for filtering
export type EmailCategory = 'registration' | 'payment' | 'abstract' | 'system' | 'reminder' | 'custom' | 'sponsor'

export interface IEmailHistory extends Document {
  // Unique identifier
  emailId: string
  
  // Recipient info
  recipient: {
    userId?: Types.ObjectId
    email: string
    name: string
  }
  
  // Email content - FULL tracking
  subject: string
  htmlContent: string
  plainTextContent: string
  
  // Template info
  templateName: string
  templateData: Record<string, any>
  category: EmailCategory
  
  // Attachments metadata (content not stored, just metadata)
  attachments?: Array<{
    filename: string
    contentType: string
    size: number
  }>
  
  // Status
  status: 'sent' | 'failed' | 'bounced'
  messageId?: string
  error?: string
  
  // Timestamps
  sentAt: Date
  createdAt: Date
  updatedAt: Date
  
  // Tracking (optional - requires tracking pixel/redirect setup)
  tracking?: {
    openedAt?: Date
    openCount: number
    lastOpenedAt?: Date
    clicks: Array<{
      url: string
      clickedAt: Date
    }>
  }
  
  // Legacy fields for backward compatibility with bulk emails
  sentBy?: string
  recipientCount?: number
  successCount?: number
  failureCount?: number
  recipients?: Array<{
    email: string
    name: string
    status: 'sent' | 'failed'
  }>
  errorMessages?: string[]
}

const EmailHistorySchema = new Schema<IEmailHistory>({
  emailId: {
    type: String,
    required: true,
    unique: true,
    default: () => `EH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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
  subject: {
    type: String,
    required: true
  },
  htmlContent: {
    type: String,
    required: true
  },
  plainTextContent: {
    type: String,
    default: ''
  },
  templateName: {
    type: String,
    required: true,
    index: true
  },
  templateData: {
    type: Schema.Types.Mixed,
    default: {}
  },
  category: {
    type: String,
    enum: ['registration', 'payment', 'abstract', 'system', 'reminder', 'custom', 'sponsor'],
    default: 'system',
    index: true
  },
  attachments: [{
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true }
  }],
  status: {
    type: String,
    enum: ['sent', 'failed', 'bounced'],
    default: 'sent',
    index: true
  },
  messageId: {
    type: String
  },
  error: {
    type: String
  },
  sentAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  tracking: {
    openedAt: { type: Date },
    openCount: { type: Number, default: 0 },
    lastOpenedAt: { type: Date },
    clicks: [{
      url: { type: String, required: true },
      clickedAt: { type: Date, required: true }
    }]
  },
  // Legacy fields for backward compatibility
  sentBy: { type: String },
  recipientCount: { type: Number },
  successCount: { type: Number },
  failureCount: { type: Number },
  recipients: [{
    email: String,
    name: String,
    status: {
      type: String,
      enum: ['sent', 'failed']
    }
  }],
  errorMessages: [String]
}, {
  timestamps: true
})

// Indexes for efficient querying
EmailHistorySchema.index({ 'recipient.userId': 1, sentAt: -1 })
EmailHistorySchema.index({ 'recipient.email': 1, sentAt: -1 })
EmailHistorySchema.index({ category: 1, sentAt: -1 })
EmailHistorySchema.index({ status: 1, sentAt: -1 })

// Clear existing model to force schema refresh
if (mongoose.models.EmailHistory) {
  delete mongoose.models.EmailHistory
}

const EmailHistory: Model<IEmailHistory> = mongoose.model<IEmailHistory>('EmailHistory', EmailHistorySchema)

export default EmailHistory
