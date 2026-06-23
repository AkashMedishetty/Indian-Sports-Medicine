import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export type AuditAction = 
  // User actions
  | 'user.created' | 'user.updated' | 'user.deleted' | 'user.login' | 'user.logout' | 'user.password_changed'
  // Registration actions
  | 'registration.created' | 'registration.updated' | 'registration.cancelled' | 'registration.confirmed'
  // Payment actions
  | 'payment.initiated' | 'payment.completed' | 'payment.failed' | 'payment.verified' | 'payment.refunded'
  // Abstract actions
  | 'abstract.submitted' | 'abstract.updated' | 'abstract.deleted' | 'abstract.assigned' | 'abstract.reviewed' | 'abstract.decision' | 'abstract.viewed'
  // Sponsor actions
  | 'sponsor.created' | 'sponsor.updated' | 'sponsor.deactivated' | 'sponsor.allocation_changed' | 'sponsor.password_reset'
  | 'sponsor.delegate_registered' | 'sponsor.delegate_claimed' | 'sponsor.bulk_upload'
  // Admin actions
  | 'admin.config_changed' | 'admin.user_role_changed' | 'admin.bulk_email' | 'admin.export'
  // Email actions
  | 'email.sent' | 'email.failed' | 'email.resent'
  // Error actions
  | 'error.resolved' | 'error.alert_sent'
  // Reviewer actions
  | 'reviewer.login' | 'reviewer.abstract_viewed' | 'reviewer.review_submitted'
  // Generic
  | string

export type ResourceType = 
  | 'user' | 'registration' | 'payment' | 'abstract' | 'sponsor' | 'config' | 'email' | 'error' | 'review'

export interface IAuditLog extends Document {
  auditId: string
  timestamp: Date
  
  // Actor info
  actor: {
    userId: Types.ObjectId
    email: string
    role: string
    name?: string
  }
  
  // Action details
  action: AuditAction
  resourceType: ResourceType
  resourceId: string
  resourceName?: string
  
  // Changes (before/after for updates)
  changes?: {
    before: Record<string, any>
    after: Record<string, any>
    fields?: string[]
  }
  
  // Request metadata
  metadata: {
    ip: string
    userAgent: string
    sessionId?: string
    requestId?: string
  }
  
  // Additional context
  description?: string
  tags?: string[]
  
  createdAt: Date
}

const AuditLogSchema = new Schema<IAuditLog>({
  auditId: {
    type: String,
    required: true,
    unique: true,
    default: () => `AUD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  actor: {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    role: {
      type: String,
      required: true
    },
    name: { type: String }
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  resourceType: {
    type: String,
    enum: ['user', 'registration', 'payment', 'abstract', 'sponsor', 'config', 'email', 'error', 'review'],
    required: true,
    index: true
  },
  resourceId: {
    type: String,
    required: true,
    index: true
  },
  resourceName: { type: String },
  changes: {
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    fields: [{ type: String }]
  },
  metadata: {
    ip: {
      type: String,
      required: true,
      default: 'unknown'
    },
    userAgent: {
      type: String,
      default: 'unknown'
    },
    sessionId: { type: String },
    requestId: { type: String }
  },
  description: { type: String },
  tags: [{ type: String }]
}, {
  timestamps: { createdAt: true, updatedAt: false } // Append-only: no updates
})

// Compound indexes for efficient querying
AuditLogSchema.index({ 'actor.userId': 1, timestamp: -1 })
AuditLogSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 })
AuditLogSchema.index({ action: 1, timestamp: -1 })
AuditLogSchema.index({ timestamp: -1, action: 1 })

// CRITICAL: Make collection append-only by disabling update and delete operations
AuditLogSchema.pre('updateOne', function() {
  throw new Error('AuditLog is append-only. Updates are not allowed.')
})

AuditLogSchema.pre('updateMany', function() {
  throw new Error('AuditLog is append-only. Updates are not allowed.')
})

AuditLogSchema.pre('findOneAndUpdate', function() {
  throw new Error('AuditLog is append-only. Updates are not allowed.')
})

AuditLogSchema.pre('findOneAndDelete', function() {
  throw new Error('AuditLog is append-only. Deletes are not allowed.')
})

AuditLogSchema.pre('deleteOne', function() {
  throw new Error('AuditLog is append-only. Deletes are not allowed.')
})

AuditLogSchema.pre('deleteMany', function() {
  throw new Error('AuditLog is append-only. Deletes are not allowed.')
})

const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)

export default AuditLog
