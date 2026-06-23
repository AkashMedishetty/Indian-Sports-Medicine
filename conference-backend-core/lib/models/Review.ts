import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IReview extends Document {
  abstractId: Types.ObjectId
  abstractCode: string // ABS-NTI-XXX
  reviewerId: Types.ObjectId

  // Assignment context
  track: string
  category?: string
  subcategory?: string

  // New scoring system (5 criteria, each 1-10)
  scores: {
    originality?: number        // Originality of the Study
    levelOfEvidence?: number    // Level of Evidence of Study
    scientificImpact?: number   // Scientific Impact
    socialSignificance?: number // Social Significance
    qualityOfManuscript?: number // Quality of Manuscript + Abstract & Study
    total?: number              // Calculated total (out of 50)
  }
  
  // Decision
  decision: 'approve' | 'reject'
  approvedFor?: 'award-paper' | 'podium' | 'poster' // Only if approved
  rejectionComment?: string // Only if rejected
  
  // Legacy fields for backward compatibility
  comments?: string
  recommendation?: 'accept' | 'reject' | 'minor-revision' | 'major-revision'
  
  submittedAt: Date
}

const ReviewSchema = new Schema<IReview>({
  abstractId: { type: Schema.Types.ObjectId, ref: 'Abstract', required: true, index: true },
  abstractCode: { type: String, required: true, index: true },
  reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  track: { type: String, required: true },
  category: { type: String },
  subcategory: { type: String },

  scores: {
    originality: { type: Number, min: 1, max: 10 },
    levelOfEvidence: { type: Number, min: 1, max: 10 },
    scientificImpact: { type: Number, min: 1, max: 10 },
    socialSignificance: { type: Number, min: 1, max: 10 },
    qualityOfManuscript: { type: Number, min: 1, max: 10 },
    total: { type: Number, min: 5, max: 50 }
  },
  
  decision: { 
    type: String, 
    enum: ['approve', 'reject'], 
    required: true 
  },
  approvedFor: { 
    type: String, 
    enum: ['award-paper', 'free-paper', 'poster-presentation', 'e-poster', 'podium', 'poster'] 
  },
  rejectionComment: { type: String },
  
  // Legacy fields
  comments: { type: String },
  recommendation: { type: String, enum: ['accept', 'reject', 'minor-revision', 'major-revision'] },
  
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true })

ReviewSchema.index({ reviewerId: 1, abstractId: 1 }, { unique: true })

// Pre-save hook to calculate total score
ReviewSchema.pre('save', function(next) {
  if (this.scores) {
    const { originality, levelOfEvidence, scientificImpact, socialSignificance, qualityOfManuscript } = this.scores
    if (originality && levelOfEvidence && scientificImpact && socialSignificance && qualityOfManuscript) {
      this.scores.total = originality + levelOfEvidence + scientificImpact + socialSignificance + qualityOfManuscript
    }
  }
  // Map decision to recommendation for backward compatibility
  if (this.decision === 'approve') {
    this.recommendation = 'accept'
  } else if (this.decision === 'reject') {
    this.recommendation = 'reject'
  }
  next()
})

export default (mongoose.models.Review as mongoose.Model<IReview>) ||
  mongoose.model<IReview>('Review', ReviewSchema)


