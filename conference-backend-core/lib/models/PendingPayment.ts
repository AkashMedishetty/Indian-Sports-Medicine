import mongoose, { Schema, Document } from 'mongoose'

export interface IPendingPayment extends Document {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
  amount: number
  currency: string
  pendingRegistration: any
  status: string
  error?: string
  resolved: boolean
  resolvedAt?: Date
  resolvedBy?: string
  createdAt: Date
}

const PendingPaymentSchema = new Schema({
  razorpayOrderId: {
    type: String,
    required: true,
    index: true
  },
  razorpayPaymentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  razorpaySignature: {
    type: String,
    required: true
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
  pendingRegistration: {
    type: Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: [
      'payment_successful_user_creation_failed',
      'resolved',
      'refunded',
      'manual_intervention_required'
    ],
    default: 'payment_successful_user_creation_failed'
  },
  error: {
    type: String
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
})

// Add compound index for efficient querying
PendingPaymentSchema.index({ resolved: 1, createdAt: -1 })

export default mongoose.models.PendingPayment || mongoose.model<IPendingPayment>('PendingPayment', PendingPaymentSchema)
