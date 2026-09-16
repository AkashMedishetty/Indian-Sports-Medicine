import mongoose, { Document, Schema } from 'mongoose'

/** One issued (or attempted) spot certificate — the send log. */
export interface ISpotCertificate extends Document {
  templateId: mongoose.Types.ObjectId
  templateName: string
  name: string
  email: string
  values: Record<string, string>
  source: 'manual' | 'lookup' | 'csv' | 'resend'
  status: 'sent' | 'failed'
  messageId?: string
  error?: string
  sentBy?: mongoose.Types.ObjectId
  sentByEmail?: string
  createdAt: Date
  updatedAt: Date
}

const SpotCertificateSchema = new Schema<ISpotCertificate>(
  {
    templateId: { type: Schema.Types.ObjectId, ref: 'CertificateTemplate', required: true },
    templateName: { type: String, default: '' },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    values: { type: Schema.Types.Mixed, default: {} },
    source: { type: String, enum: ['manual', 'lookup', 'csv', 'resend'], default: 'manual' },
    status: { type: String, enum: ['sent', 'failed'], required: true },
    messageId: String,
    error: String,
    sentBy: { type: Schema.Types.ObjectId, ref: 'User' },
    sentByEmail: String,
  },
  { timestamps: true }
)

SpotCertificateSchema.index({ createdAt: -1 })
SpotCertificateSchema.index({ email: 1 })

const SpotCertificate =
  (mongoose.models.SpotCertificate as mongoose.Model<ISpotCertificate>) ||
  mongoose.model<ISpotCertificate>('SpotCertificate', SpotCertificateSchema)

export default SpotCertificate
