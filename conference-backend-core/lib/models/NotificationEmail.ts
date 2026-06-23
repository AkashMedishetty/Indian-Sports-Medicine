import mongoose, { Document, Schema } from 'mongoose'

export interface INotificationEmail extends Document {
  email: string
  source: 'program' | 'abstracts' | 'venue'
  isActive: boolean
  subscribedAt: Date
  notifiedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const NotificationEmailSchema = new Schema<INotificationEmail>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      },
      message: 'Please enter a valid email address'
    }
  },
  source: {
    type: String,
    required: true,
    enum: ['program', 'abstracts', 'venue']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  notifiedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Create compound index to prevent duplicate subscriptions
NotificationEmailSchema.index({ email: 1, source: 1 }, { unique: true })
NotificationEmailSchema.index({ isActive: 1 })
NotificationEmailSchema.index({ source: 1 })
NotificationEmailSchema.index({ subscribedAt: 1 })

const NotificationEmail = mongoose.models.NotificationEmail || mongoose.model<INotificationEmail>('NotificationEmail', NotificationEmailSchema)

export default NotificationEmail
export { NotificationEmail }