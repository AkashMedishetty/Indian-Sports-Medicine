import mongoose, { Document, Schema } from 'mongoose'

// Admin-configurable conference settings stored in database
export interface IConferenceConfig extends Document {
  // Registration Configuration
  registration: {
    enabled: boolean
    startDate?: string
    endDate?: string
    
    // Admin can edit these
    formFields: {
      titles: string[]
      designations: string[]
      relationshipTypes: string[]
      paymentMethods: string[]
    }
    
    // Admin can add/remove/edit categories
    categories: Array<{
      key: string
      label: string
      description?: string
      requiresMembership?: boolean
      membershipField?: string
      isActive: boolean
      displayOrder: number
    }>
    
    workshopsEnabled: boolean
    maxWorkshopsPerUser: number
    
    accompanyingPersonEnabled: boolean
    maxAccompanyingPersons: number
  }
  
  // Payment Tiers (Admin can add/edit/delete)
  pricingTiers: Array<{
    name: string  // 'Early Bird', 'Regular', 'Late'
    key: string   // 'early-bird', 'regular', 'late'
    validFrom: Date
    validUntil: Date
    isActive: boolean
    displayOrder: number
    
    // Prices for each category
    pricing: Array<{
      categoryKey: string  // 'cvsi-member', 'non-member', etc.
      basePrice: number
      workshopPrice: number
      accompanyingPersonPrice: number
      currency: string
    }>
  }>
  
  // Workshops (Admin can add/edit/delete)
  workshops: Array<{
    title: string
    description?: string
    date: Date
    startTime?: string
    endTime?: string
    venue?: string
    facilitator?: string
    capacity: number
    registeredCount: number
    price: number
    isActive: boolean
    displayOrder: number
  }>
  
  // Email Settings
  email: {
    fromName: string
    replyTo: string
    supportEmail: string
  }
  
  // Other Settings
  currency: string
  currencySymbol: string
  
  createdAt: Date
  updatedAt: Date
}

const ConferenceConfigSchema = new Schema<IConferenceConfig>({
  registration: {
    enabled: { type: Boolean, default: true },
    startDate: String,
    endDate: String,
    
    formFields: {
      titles: {
        type: [String],
        default: ['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.']
      },
      designations: {
        type: [String],
        default: ['Consultant', 'PG/Student']
      },
      relationshipTypes: {
        type: [String],
        default: ['Spouse', 'Child', 'Parent', 'Friend', 'Colleague', 'Other']
      },
      paymentMethods: {
        type: [String],
        default: ['bank-transfer', 'online', 'cash']
      }
    },
    
    categories: [{
      key: { type: String, required: true },
      label: { type: String, required: true },
      description: String,
      requiresMembership: { type: Boolean, default: false },
      membershipField: String,
      isActive: { type: Boolean, default: true },
      displayOrder: { type: Number, default: 0 }
    }],
    
    workshopsEnabled: { type: Boolean, default: true },
    maxWorkshopsPerUser: { type: Number, default: 3 },
    
    accompanyingPersonEnabled: { type: Boolean, default: true },
    maxAccompanyingPersons: { type: Number, default: 2 }
  },
  
  pricingTiers: [{
    name: { type: String, required: true },
    key: { type: String, required: true },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    
    pricing: [{
      categoryKey: { type: String, required: true },
      basePrice: { type: Number, required: true },
      workshopPrice: { type: Number, default: 0 },
      accompanyingPersonPrice: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' }
    }]
  }],
  
  workshops: [{
    title: { type: String, required: true },
    description: String,
    date: { type: Date, required: true },
    startTime: String,
    endTime: String,
    venue: String,
    facilitator: String,
    capacity: { type: Number, required: true },
    registeredCount: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 }
  }],
  
  email: {
    fromName: { type: String, default: 'Conference Team' },
    replyTo: String,
    supportEmail: String
  },
  
  currency: { type: String, default: 'INR' },
  currencySymbol: { type: String, default: '₹' }
}, {
  timestamps: true
})

// Indexes
ConferenceConfigSchema.index({ 'registration.categories.key': 1 })
ConferenceConfigSchema.index({ 'pricingTiers.key': 1 })

export default mongoose.models.ConferenceConfig || 
  mongoose.model<IConferenceConfig>('ConferenceConfig', ConferenceConfigSchema)
