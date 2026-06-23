import mongoose, { Document, Schema } from 'mongoose'

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId
  registrationId: string
  type?: 'registration' | 'workshop-addon'
  razorpayOrderId?: string
  razorpayPaymentId?: string
  razorpaySignature?: string
  workshopIds?: string[]
  workshops?: Array<{
    workshopId: string
    workshopName: string
    price: number
  }>
  amount: {
    registration: number
    workshops: number
    accompanyingPersons: number
    discount: number
    total: number
    currency: string
  }
  breakdown: {
    registrationType: string
    registrationTypeLabel?: string
    baseAmount: number
    workshopFees: Array<{
      name: string
      amount: number
    }>
    accompanyingPersonCount?: number
    accompanyingPersonDetails?: Array<{
      name: string
      age: number
    }>
    accompanyingPersonFees: number
    discountsApplied: Array<{
      type: string
      code?: string
      percentage: number
      amount: number
    }>
    paymentMethod?: string
  }
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  paymentMethod?: string
  transactionDate: Date
  invoiceGenerated: boolean
  invoicePath?: string
  createdAt: Date
  updatedAt: Date
}

const PaymentSchema = new Schema<IPayment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registrationId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['registration', 'workshop-addon'],
    default: 'registration'
  },
  razorpayOrderId: {
    type: String,
    unique: true,
    sparse: true  // Allow null/undefined values - not required initially
  },
  workshopIds: [String],
  workshops: [{
    workshopId: String,
    workshopName: String,
    price: Number
  }],
  razorpayPaymentId: String,
  razorpaySignature: String,
  amount: {
    registration: { type: Number, default: 0 },
    workshops: { type: Number, default: 0 },
    accompanyingPersons: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, required: true, default: 'INR' }
  },
  breakdown: {
    registrationType: String,
    registrationTypeLabel: String,
    baseAmount: { type: Number, default: 0 },
    workshopFees: [{
      name: { type: String, required: true },
      amount: { type: Number, required: true }
    }],
    accompanyingPersonCount: { type: Number, default: 0 },
    accompanyingPersonDetails: [{
      name: String,
      age: Number
    }],
    accompanyingPersonFees: { type: Number, default: 0 },
    discountsApplied: [{
      type: { type: String, required: true },
      code: String,
      percentage: { type: Number, required: true },
      amount: { type: Number, required: true }
    }],
    paymentMethod: String
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: String,
  transactionDate: {
    type: Date,
    default: Date.now
  },
  invoiceGenerated: {
    type: Boolean,
    default: false
  },
  invoicePath: String
}, {
  timestamps: true
})

// Create indexes for better performance
PaymentSchema.index({ userId: 1 })
PaymentSchema.index({ registrationId: 1 })
// razorpayOrderId index is automatically created due to unique: true
PaymentSchema.index({ status: 1 })
PaymentSchema.index({ transactionDate: -1 })

// Clear existing model to force schema refresh (for development)
if (mongoose.models.Payment) {
  delete mongoose.models.Payment
}

export default mongoose.model<IPayment>('Payment', PaymentSchema)