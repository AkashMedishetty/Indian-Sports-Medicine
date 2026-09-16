import mongoose, { Document, Schema } from 'mongoose'
import { CERT_TYPES, type CertType } from '../certificate-desk/types'

/**
 * One physical certificate handed over at a desk.
 *
 * Distinct from SpotCertificate, which logs a certificate RENDERED AND EMAILED.
 * This records that a pre-printed certificate left the counter.
 *
 * `key` = "<type>:<userId>:<abstractId or ->" and carries a UNIQUE PARTIAL index
 * over active rows only. That is what makes several desks scanning at once safe:
 * two simultaneous inserts for the same certificate cannot both win, the loser
 * gets a duplicate-key error, and the desk is told "already collected" instead
 * of the count silently going to two.
 *
 * Undo is a SOFT delete (active:false) so a mistaken hand-over keeps its audit
 * trail. Because the unique index is partial on { active: true }, an undone row
 * stops blocking the key and the certificate can be issued again.
 */
export interface ICertificateCollection extends Document {
  key: string
  type: CertType
  active: boolean
  userId: mongoose.Types.ObjectId
  registrationId: string
  /** Denormalised so exports and desk feeds need no join. */
  name: string
  email: string
  institution: string
  abstractId: string
  abstractTitle: string
  override: boolean
  overrideReason: string
  deskName: string
  collectedAt: Date
  undoneAt?: Date
  undoneBy?: string
  createdAt: Date
  updatedAt: Date
}

const CertificateCollectionSchema = new Schema<ICertificateCollection>(
  {
    key: { type: String, required: true },
    type: { type: String, enum: CERT_TYPES as unknown as string[], required: true },
    active: { type: Boolean, default: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    registrationId: { type: String, default: '' },
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    institution: { type: String, default: '' },
    abstractId: { type: String, default: '' },
    abstractTitle: { type: String, default: '' },
    override: { type: Boolean, default: false },
    overrideReason: { type: String, default: '' },
    deskName: { type: String, default: '' },
    collectedAt: { type: Date, default: Date.now },
    undoneAt: { type: Date },
    undoneBy: { type: String },
  },
  { timestamps: true }
)

// The concurrency guarantee. Partial on active so an undone row frees the key.
CertificateCollectionSchema.index(
  { key: 1 },
  { unique: true, partialFilterExpression: { active: true }, name: 'uniq_active_key' }
)
CertificateCollectionSchema.index({ collectedAt: -1 })
CertificateCollectionSchema.index({ type: 1, active: 1 })
CertificateCollectionSchema.index({ userId: 1, type: 1, active: 1 })
CertificateCollectionSchema.index({ deskName: 1, collectedAt: -1 })

const CertificateCollection =
  (mongoose.models.CertificateCollection as mongoose.Model<ICertificateCollection>) ||
  mongoose.model<ICertificateCollection>('CertificateCollection', CertificateCollectionSchema)

export default CertificateCollection
