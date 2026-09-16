import mongoose, { Document, Schema } from 'mongoose'

/**
 * Singleton settings for the certificate desk.
 *
 * Volunteers on the desk do not have admin logins, so a desk joins with a short
 * shared access code instead. The code is stored hashed with a per-install salt;
 * `codeVersion` is baked into every issued desk token, so rotating the code
 * invalidates all existing desk sessions in one write.
 */
export interface ICertificateDeskSettings extends Document {
  singleton: 'desk'
  codeHash: string
  codeSalt: string
  codeVersion: number
  /** Last two characters, so an admin can tell two codes apart without storing it. */
  codeHint: string
  enabled: boolean
  rotatedAt?: Date
  rotatedBy?: string
  createdAt: Date
  updatedAt: Date
}

const CertificateDeskSettingsSchema = new Schema<ICertificateDeskSettings>(
  {
    singleton: { type: String, enum: ['desk'], default: 'desk', unique: true },
    codeHash: { type: String, default: '' },
    codeSalt: { type: String, default: '' },
    codeVersion: { type: Number, default: 0 },
    codeHint: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    rotatedAt: { type: Date },
    rotatedBy: { type: String },
  },
  { timestamps: true }
)

const CertificateDeskSettings =
  (mongoose.models.CertificateDeskSettings as mongoose.Model<ICertificateDeskSettings>) ||
  mongoose.model<ICertificateDeskSettings>('CertificateDeskSettings', CertificateDeskSettingsSchema)

export default CertificateDeskSettings
