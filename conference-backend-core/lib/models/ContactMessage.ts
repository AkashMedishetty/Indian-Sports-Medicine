import mongoose, { Document, Schema } from 'mongoose'

export interface IContactMessage extends Document {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  status: 'new' | 'read' | 'replied' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  adminNotes?: string
  createdAt: Date
  updatedAt: Date
  lastReadAt?: Date
  repliedAt?: Date
}

const ContactMessageSchema = new Schema<IContactMessage>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxLength: 100
  },
  phone: {
    type: String,
    trim: true,
    maxLength: 15
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxLength: 1000
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'resolved'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  adminNotes: {
    type: String,
    trim: true,
    maxLength: 500
  },
  lastReadAt: {
    type: Date
  },
  repliedAt: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'contact_messages'
})

// Index for efficient querying
ContactMessageSchema.index({ status: 1, createdAt: -1 })
ContactMessageSchema.index({ email: 1 })
ContactMessageSchema.index({ subject: 1 })

const ContactMessage = mongoose.models.ContactMessage || mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema)

export default ContactMessage