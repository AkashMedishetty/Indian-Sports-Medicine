import mongoose, { Document, Schema } from 'mongoose'

export interface IConfiguration extends Document {
  type: 'pricing' | 'discounts' | 'content' | 'settings'
  key: string
  value: any
  isActive: boolean
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const ConfigurationSchema = new Schema<IConfiguration>({
  type: {
    type: String,
    required: true,
    enum: ['pricing', 'discounts', 'content', 'settings']
  },
  key: {
    type: String,
    required: true
  },
  value: {
    type: Schema.Types.Mixed,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Create compound index for type and key
ConfigurationSchema.index({ type: 1, key: 1 }, { unique: true })
ConfigurationSchema.index({ isActive: 1 })

const Configuration = mongoose.models.Configuration || mongoose.model<IConfiguration>('Configuration', ConfigurationSchema)

export default Configuration
export { Configuration }