import mongoose, { Document, Schema } from 'mongoose'
import { SPOT_FIELD_KEYS, SPOT_FONTS, type SpotField } from '../certificates/spot-fields'

export interface ICertificateTemplate extends Document {
  name: string
  fileName: string
  /** Template PDF bytes. Excluded from queries unless selected with '+pdf'. */
  pdf: Buffer
  /** First page crop-box size in PDF points. */
  pageWidth: number
  pageHeight: number
  fields: SpotField[]
  emailSubject: string
  emailBody: string
  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const FieldSchema = new Schema<SpotField>(
  {
    key: { type: String, enum: SPOT_FIELD_KEYS, required: true },
    label: { type: String, required: true },
    enabled: { type: Boolean, default: false },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    fontSize: { type: Number, default: 24 },
    font: { type: String, enum: SPOT_FONTS, default: 'Times-Bold' },
    color: { type: String, default: '#1a1a1a' },
    align: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
    maxLines: { type: Number, default: 1 },
    uppercase: { type: Boolean, default: false },
  },
  { _id: false }
)

const CertificateTemplateSchema = new Schema<ICertificateTemplate>(
  {
    name: { type: String, required: true, trim: true },
    fileName: { type: String, default: 'template.pdf' },
    // Stored in MongoDB rather than on disk: Vercel's filesystem does not persist uploads.
    pdf: { type: Buffer, required: true, select: false },
    pageWidth: { type: Number, required: true },
    pageHeight: { type: Number, required: true },
    fields: { type: [FieldSchema], default: [] },
    emailSubject: { type: String, default: '' },
    emailBody: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

const CertificateTemplate =
  (mongoose.models.CertificateTemplate as mongoose.Model<ICertificateTemplate>) ||
  mongoose.model<ICertificateTemplate>('CertificateTemplate', CertificateTemplateSchema)

export default CertificateTemplate
