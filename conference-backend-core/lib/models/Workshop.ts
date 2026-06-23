import mongoose, { Document, Schema } from 'mongoose'

export interface IWorkshop extends Document {
  id: string
  name: string
  description?: string
  instructor?: string
  duration?: string
  price: number
  currency: string
  maxSeats: number  // 0 = unlimited
  bookedSeats: number
  availableSeats: number
  registrationStart?: Date
  registrationEnd?: Date
  workshopDate?: Date
  workshopTime?: string
  venue?: string
  prerequisites?: string
  materials?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const WorkshopSchema = new Schema<IWorkshop>({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  instructor: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  duration: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    enum: ['INR', 'USD'],
    default: 'INR'
  },
  maxSeats: {
    type: Number,
    required: true,
    min: 0,  // 0 = unlimited
    default: 0
  },
  bookedSeats: {
    type: Number,
    default: 0,
    min: 0
  },
  registrationStart: {
    type: Date,
    required: false
  },
  registrationEnd: {
    type: Date,
    required: false
  },
  workshopDate: {
    type: Date,
    required: false
  },
  workshopTime: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  venue: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  prerequisites: {
    type: String,
    trim: true
  },
  materials: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Virtual for available seats (0 maxSeats = unlimited)
WorkshopSchema.virtual('availableSeats').get(function() {
  if (this.maxSeats === 0) return Infinity  // Unlimited
  return this.maxSeats - this.bookedSeats
})

// Virtual for registration status
WorkshopSchema.virtual('registrationStatus').get(function() {
  if (!this.registrationStart || !this.registrationEnd) return 'open'
  const now = new Date()
  if (now < this.registrationStart) return 'not-started'
  if (now > this.registrationEnd) return 'closed'
  if (this.maxSeats > 0 && this.bookedSeats >= this.maxSeats) return 'full'
  return 'open'
})

// Virtual for is full (0 maxSeats = never full)
WorkshopSchema.virtual('isFull').get(function() {
  if (this.maxSeats === 0) return false  // Unlimited = never full
  return this.bookedSeats >= this.maxSeats
})

// Virtual for can register (0 maxSeats = always can register if dates valid)
WorkshopSchema.virtual('canRegister').get(function() {
  const now = new Date()
  const seatsAvailable = this.maxSeats === 0 || this.bookedSeats < this.maxSeats
  const withinDates = !this.registrationStart || !this.registrationEnd || 
    (now >= this.registrationStart && now <= this.registrationEnd)
  return this.isActive && withinDates && seatsAvailable
})

// Index for efficient queries
WorkshopSchema.index({ isActive: 1, registrationStart: 1, registrationEnd: 1 })
// Note: id field already has unique: true which creates an index automatically

export default mongoose.models.Workshop || mongoose.model<IWorkshop>('Workshop', WorkshopSchema)