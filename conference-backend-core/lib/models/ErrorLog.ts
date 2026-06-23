import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info'
export type ErrorCategory = 'payment' | 'form_validation' | 'api' | 'auth' | 'system' | 'email' | 'file_upload' | 'database'
export type ErrorSource = 'frontend' | 'backend' | 'api' | 'webhook'

export interface IErrorLog extends Document {
  errorId: string
  message: string
  stack?: string
  severity: ErrorSeverity
  category: ErrorCategory
  source: ErrorSource
  
  // Request context
  url?: string
  endpoint?: string
  httpMethod?: string
  
  // User context
  userId?: Types.ObjectId
  userEmail?: string
  sessionId?: string
  
  // Detailed metadata based on category
  metadata?: {
    // Payment-specific
    orderId?: string
    paymentMethod?: string
    amount?: number
    razorpayError?: string
    
    // Form-specific
    formName?: string
    fieldName?: string
    invalidValue?: string
    validationErrors?: string[]
    
    // File-specific
    fileName?: string
    fileSize?: number
    fileType?: string
    
    // API-specific
    requestBody?: Record<string, any>
    responseStatus?: number
    responseBody?: Record<string, any>
    
    // Generic
    additionalInfo?: Record<string, any>
  }
  
  // Device info
  device?: {
    browser: string
    browserVersion?: string
    os: string
    osVersion?: string
    ip: string
    userAgent: string
    screenResolution?: string
  }
  
  // Aggregation for duplicate errors
  fingerprint: string
  occurrences: number
  firstOccurrence: Date
  lastOccurrence: Date
  
  // Resolution
  resolved: boolean
  resolvedBy?: Types.ObjectId
  resolvedAt?: Date
  resolutionNotes?: string
  
  // Alert tracking
  alertSent: boolean
  alertSentAt?: Date
  
  createdAt: Date
  updatedAt: Date
}

const ErrorLogSchema = new Schema<IErrorLog>({
  errorId: {
    type: String,
    required: true,
    unique: true,
    default: () => `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  message: {
    type: String,
    required: true
  },
  stack: { type: String },
  severity: {
    type: String,
    enum: ['critical', 'error', 'warning', 'info'],
    required: true,
    default: 'error',
    index: true
  },
  category: {
    type: String,
    enum: ['payment', 'form_validation', 'api', 'auth', 'system', 'email', 'file_upload', 'database'],
    required: true,
    default: 'system',
    index: true
  },
  source: {
    type: String,
    enum: ['frontend', 'backend', 'api', 'webhook'],
    required: true,
    default: 'backend'
  },
  url: { type: String },
  endpoint: { type: String },
  httpMethod: { type: String },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  userEmail: {
    type: String,
    lowercase: true,
    trim: true,
    index: true
  },
  sessionId: { type: String },
  metadata: {
    // Payment
    orderId: { type: String },
    paymentMethod: { type: String },
    amount: { type: Number },
    razorpayError: { type: String },
    // Form
    formName: { type: String },
    fieldName: { type: String },
    invalidValue: { type: String },
    validationErrors: [{ type: String }],
    // File
    fileName: { type: String },
    fileSize: { type: Number },
    fileType: { type: String },
    // API
    requestBody: { type: Schema.Types.Mixed },
    responseStatus: { type: Number },
    responseBody: { type: Schema.Types.Mixed },
    // Generic
    additionalInfo: { type: Schema.Types.Mixed }
  },
  device: {
    browser: { type: String, default: 'unknown' },
    browserVersion: { type: String },
    os: { type: String, default: 'unknown' },
    osVersion: { type: String },
    ip: { type: String, default: 'unknown' },
    userAgent: { type: String, default: '' },
    screenResolution: { type: String }
  },
  fingerprint: {
    type: String,
    required: true,
    index: true
  },
  occurrences: {
    type: Number,
    default: 1
  },
  firstOccurrence: {
    type: Date,
    required: true,
    default: Date.now
  },
  lastOccurrence: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  resolved: {
    type: Boolean,
    default: false,
    index: true
  },
  resolvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: { type: Date },
  resolutionNotes: { type: String },
  alertSent: {
    type: Boolean,
    default: false
  },
  alertSentAt: { type: Date }
}, {
  timestamps: true
})

// Compound indexes for efficient querying
ErrorLogSchema.index({ userId: 1, lastOccurrence: -1 })
ErrorLogSchema.index({ category: 1, severity: 1, resolved: 1 })
ErrorLogSchema.index({ resolved: 1, lastOccurrence: -1 })
ErrorLogSchema.index({ fingerprint: 1, resolved: 1 })

// Static method to generate fingerprint for error deduplication
ErrorLogSchema.statics.generateFingerprint = function(message: string, stack?: string, category?: string): string {
  const crypto = require('crypto')
  const content = `${message}|${stack?.split('\n')[0] || ''}|${category || ''}`
  return crypto.createHash('md5').update(content).digest('hex')
}

const ErrorLog: Model<IErrorLog> = mongoose.models.ErrorLog || mongoose.model<IErrorLog>('ErrorLog', ErrorLogSchema)

export default ErrorLog
