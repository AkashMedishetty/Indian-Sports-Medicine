import mongoose, { Document, Schema } from 'mongoose'

export interface IBadgeElement {
  id: string
  type: 'text' | 'qrcode' | 'image' | 'field'
  x: number  // Position X (percentage or pixels)
  y: number  // Position Y (percentage or pixels)
  width: number
  height: number
  
  // Text-specific properties
  text?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  color?: string
  align?: 'left' | 'center' | 'right'
  
  // Field mapping (dynamic data)
  fieldName?: 'registrationId' | 'fullName' | 'institution' | 'designation' | 'email' | 'phone' | 'category'
  
  // QR Code specific
  qrData?: 'registrationId' | 'custom'
  
  // Image specific
  imageUrl?: string
  
  // Styling
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  rotation?: number
  opacity?: number
  zIndex?: number
}

export interface IBadgeTemplate extends Document {
  name: string
  description?: string
  
  // Template image (uploaded background)
  backgroundImage: {
    url: string
    originalName: string
    mimeType: string
    width: number
    height: number
    uploadedAt: Date
  }
  
  // Canvas dimensions
  dimensions: {
    width: number   // in pixels
    height: number  // in pixels
    unit: 'px' | 'mm' | 'in'
  }
  
  // Elements on the badge
  elements: IBadgeElement[]
  
  // Settings
  settings: {
    orientation: 'portrait' | 'landscape'
    printMargin: number
    backgroundColor?: string
    showGrid: boolean
    snapToGrid: boolean
    gridSize: number
  }
  
  // Status
  isActive: boolean
  isDefault: boolean
  
  // Metadata
  createdBy: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  
  createdAt: Date
  updatedAt: Date
}

const BadgeElementSchema = new Schema<IBadgeElement>({
  id: { type: String, required: true },
  type: { type: String, enum: ['text', 'qrcode', 'image', 'field'], required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  
  // Text properties
  text: String,
  fontSize: Number,
  fontFamily: String,
  fontWeight: String,
  color: String,
  align: { type: String, enum: ['left', 'center', 'right'] },
  
  // Field mapping
  fieldName: { 
    type: String, 
    enum: ['registrationId', 'fullName', 'institution', 'designation', 'email', 'phone', 'category']
  },
  
  // QR Code
  qrData: { type: String, enum: ['registrationId', 'custom'] },
  
  // Image
  imageUrl: String,
  
  // Styling
  backgroundColor: String,
  borderColor: String,
  borderWidth: Number,
  borderRadius: Number,
  rotation: Number,
  opacity: Number,
  zIndex: Number
}, { _id: false })

const BadgeTemplateSchema = new Schema<IBadgeTemplate>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  backgroundImage: {
    url: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now }
  },
  dimensions: {
    width: { type: Number, required: true, default: 1050 },   // Standard ID card width in pixels (3.5" at 300dpi)
    height: { type: Number, required: true, default: 1500 },  // Standard ID card height in pixels (5" at 300dpi)
    unit: { type: String, enum: ['px', 'mm', 'in'], default: 'px' }
  },
  elements: {
    type: [BadgeElementSchema],
    default: []
  },
  settings: {
    orientation: { type: String, enum: ['portrait', 'landscape'], default: 'portrait' },
    printMargin: { type: Number, default: 0 },
    backgroundColor: String,
    showGrid: { type: Boolean, default: true },
    snapToGrid: { type: Boolean, default: true },
    gridSize: { type: Number, default: 10 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Indexes
BadgeTemplateSchema.index({ isActive: 1, isDefault: 1 })
BadgeTemplateSchema.index({ createdBy: 1 })

// Ensure only one default template at a time
BadgeTemplateSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Remove default from other templates
    await mongoose.model('BadgeTemplate').updateMany(
      { _id: { $ne: this._id }, isDefault: true },
      { $set: { isDefault: false } }
    )
  }
  next()
})

export default mongoose.models.BadgeTemplate || mongoose.model<IBadgeTemplate>('BadgeTemplate', BadgeTemplateSchema)
