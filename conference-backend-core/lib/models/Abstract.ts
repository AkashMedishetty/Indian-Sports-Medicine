import mongoose, { Document, Schema, Types } from 'mongoose'

export type AbstractStatus =
  | 'submitted' // initial submitted
  | 'under-review'
  | 'accepted'
  | 'rejected'
  | 'final-submitted'

// Submitting For options
export type SubmittingFor = 'neurosurgery' | 'neurology'

// Submission Category options
export type SubmissionCategory = 'award-paper' | 'free-paper' | 'poster-presentation'

// Submission Topics for Neurosurgery
export const NEUROSURGERY_TOPICS = [
  'Skullbase',
  'Vascular',
  'Neuro Oncology',
  'Paediatric Neurosurgery',
  'Spine',
  'Functional',
  'General Neurosurgery',
  'Miscellaneous'
] as const

// Submission Topics for Neurology
export const NEUROLOGY_TOPICS = [
  'General Neurology',
  'Neuroimmunology',
  'Stroke',
  'Neuromuscular Disorders',
  'Epilepsy',
  'Therapeutics in Neurology',
  'Movement Disorders',
  'Miscellaneous'
] as const

export interface IAbstractFile {
  originalName: string
  mimeType: string
  fileSizeBytes: number
  storagePath: string // Vercel Blob URL
  blobUrl?: string // Vercel Blob public URL
  uploadedAt: Date
}

export interface IAbstract extends Document {
  // Core identifiers
  abstractId: string // ABS-NTI-XXX
  userId: Types.ObjectId
  registrationId: string

  // ISSH 2026 Classification
  submittingFor: SubmittingFor // Neurosurgery or Neurology
  submissionCategory: SubmissionCategory // Award Paper, Free Paper, Poster Presentation
  submissionTopic: string // Topic based on submittingFor selection

  // Legacy fields (kept for backward compatibility)
  track?: string // e.g., Free Paper, Poster Presentation, E-Poster
  category?: string
  subcategory?: string

  // Content
  title: string
  authors: string[]
  keywords?: string[]
  wordCount?: number

  // Lifecycle
  status: AbstractStatus
  submittedAt: Date

  // Initial submission
  initial: {
    file?: IAbstractFile
    notes?: string
    // Structured content sections
    introduction?: string
    methods?: string
    results?: string
    conclusion?: string
  }

  // Final submission (same ID with "-F" suffix for display)
  final?: {
    file?: IAbstractFile
    submittedAt?: Date
    displayId?: string // e.g., ABS-NTI-042-F
    notes?: string
    // Structured content sections
    introduction?: string
    methods?: string
    results?: string
    conclusion?: string
  }

  // Review and decisions
  averageScore?: number
  decisionAt?: Date
  approvedFor?: 'award-paper' | 'free-paper' | 'poster-presentation' | 'podium' | 'poster'

  // Reviewer assignment
  assignedReviewerIds?: Types.ObjectId[]
}

const AbstractFileSchema = new Schema<IAbstractFile>({
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSizeBytes: { type: Number, required: true },
  storagePath: { type: String, required: true }, // Vercel Blob URL
  blobUrl: { type: String }, // Vercel Blob public URL
  uploadedAt: { type: Date, default: Date.now }
})

const AbstractSchema = new Schema<IAbstract>({
  abstractId: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  registrationId: { type: String, required: true, index: true },

  // Classification fields
  submittingFor: { 
    type: String, 
    enum: ['neurosurgery', 'neurology'],
    required: false,
    index: true
  },
  submissionCategory: { 
    type: String, 
    enum: ['award-paper', 'free-paper', 'poster-presentation', 'e-poster'],
    required: true,
    index: true
  },
  submissionTopic: { type: String, required: false, index: true },

  // Legacy fields (kept for backward compatibility)
  track: { type: String },
  category: { type: String },
  subcategory: { type: String },

  title: { type: String, required: true },
  authors: { type: [String], default: [] },
  keywords: { type: [String], default: [] },
  wordCount: { type: Number },

  status: { type: String, enum: ['submitted', 'under-review', 'accepted', 'rejected', 'final-submitted'], default: 'submitted', index: true },
  submittedAt: { type: Date, default: Date.now },

  initial: {
    file: { type: AbstractFileSchema, required: false },
    notes: { type: String },
    // Structured content sections
    introduction: { type: String },
    methods: { type: String },
    results: { type: String },
    conclusion: { type: String }
  },

  final: {
    file: { type: AbstractFileSchema, required: false },
    submittedAt: { type: Date },
    displayId: { type: String },
    notes: { type: String },
    // Structured content sections
    introduction: { type: String },
    methods: { type: String },
    results: { type: String },
    conclusion: { type: String }
  },

  averageScore: { type: Number },
  decisionAt: { type: Date },
  approvedFor: { 
    type: String, 
    enum: ['award-paper', 'free-paper', 'poster-presentation', 'e-poster', 'podium', 'poster'] 
  },
  assignedReviewerIds: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }]
}, { timestamps: true })

AbstractSchema.index({ submittingFor: 1, submissionCategory: 1, submissionTopic: 1 })
AbstractSchema.index({ track: 1, category: 1, subcategory: 1 })

export default (mongoose.models.Abstract as mongoose.Model<IAbstract>) ||
  mongoose.model<IAbstract>('Abstract', AbstractSchema)


