import mongoose, { Document, Schema } from 'mongoose'

export interface IReviewerConfig extends Document {
  blindReview: boolean
  reviewerLayout: 'split-screen' | 'new-tab'
  approvalOptions: Array<{
    key: string
    label: string
    enabled: boolean
  }>
  scoringCriteria: Array<{
    key: string
    label: string
    maxScore: number
    enabled: boolean
  }>
  requireRejectionComment: boolean
  allowReviewEdit: boolean
  showTotalScore: boolean
  // Email notification settings
  emailNotificationMode: 'immediate' | 'manual'
  pendingEmails: Array<{
    abstractId: string
    type: 'acceptance' | 'rejection'
    createdAt: Date
  }>
  // Email templates
  acceptanceEmailSubject?: string
  acceptanceEmailBody?: string
  rejectionEmailSubject?: string
  rejectionEmailBody?: string
  createdAt: Date
  updatedAt: Date
}

const ReviewerConfigSchema = new Schema<IReviewerConfig>({
  blindReview: {
    type: Boolean,
    default: false
  },
  reviewerLayout: {
    type: String,
    enum: ['split-screen', 'new-tab'],
    default: 'new-tab'
  },
  approvalOptions: [{
    key: { type: String, required: true },
    label: { type: String, required: true },
    enabled: { type: Boolean, default: true }
  }],
  scoringCriteria: [{
    key: { type: String, required: true },
    label: { type: String, required: true },
    maxScore: { type: Number, default: 10 },
    enabled: { type: Boolean, default: true }
  }],
  requireRejectionComment: {
    type: Boolean,
    default: true
  },
  allowReviewEdit: {
    type: Boolean,
    default: false
  },
  showTotalScore: {
    type: Boolean,
    default: true
  },
  emailNotificationMode: {
    type: String,
    enum: ['immediate', 'manual'],
    default: 'immediate'
  },
  pendingEmails: [{
    abstractId: { type: String, required: true },
    type: { type: String, enum: ['acceptance', 'rejection'], required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  // Email templates
  acceptanceEmailSubject: {
    type: String,
    default: 'Congratulations! Your Abstract {abstractId} Has Been Accepted - ISSH Midterm CME 2026'
  },
  acceptanceEmailBody: {
    type: String,
    default: `Dear {name},

Congratulations! We are pleased to inform you that your abstract titled "{title}" (ID: {abstractId}) has been ACCEPTED for presentation at ISSH Midterm CME 2026.

Presentation Type: {approvedFor}

Please log in to your dashboard to view the details and complete any required next steps for your final submission.

Dashboard: {dashboardUrl}

Best regards,
ISSH 2026 Organizing Committee`
  },
  rejectionEmailSubject: {
    type: String,
    default: 'Update on Your Abstract Submission {abstractId} - ISSH Midterm CME 2026'
  },
  rejectionEmailBody: {
    type: String,
    default: `Dear {name},

Thank you for submitting your abstract titled "{title}" (ID: {abstractId}) to ISSH Midterm CME 2026.

After careful review by our scientific committee, we regret to inform you that your abstract has not been selected for presentation at this year's conference.

We appreciate your interest in ISSH Midterm CME 2026 and encourage you to submit again in the future.

Best regards,
ISSH 2026 Organizing Committee`
  }
}, {
  timestamps: true
})

// Default configuration
export const defaultReviewerConfig: Partial<IReviewerConfig> = {
  blindReview: false,
  reviewerLayout: 'new-tab',
  approvalOptions: [
    { key: 'award-paper', label: 'Award Paper Presentation', enabled: true },
    { key: 'podium', label: 'Podium Presentation', enabled: true },
    { key: 'poster', label: 'Poster Presentation', enabled: true }
  ],
  scoringCriteria: [
    { key: 'originality', label: 'Originality of the Study', maxScore: 10, enabled: true },
    { key: 'levelOfEvidence', label: 'Level of Evidence of Study', maxScore: 10, enabled: true },
    { key: 'scientificImpact', label: 'Scientific Impact', maxScore: 10, enabled: true },
    { key: 'socialSignificance', label: 'Social Significance', maxScore: 10, enabled: true },
    { key: 'qualityOfManuscript', label: 'Quality of Manuscript + Abstract & Study', maxScore: 10, enabled: true }
  ],
  requireRejectionComment: true,
  allowReviewEdit: false,
  showTotalScore: true,
  emailNotificationMode: 'immediate',
  pendingEmails: [],
  acceptanceEmailSubject: 'Congratulations! Your Abstract {abstractId} Has Been Accepted - ISSH Midterm CME 2026',
  acceptanceEmailBody: `Dear {name},

Congratulations! We are pleased to inform you that your abstract titled "{title}" (ID: {abstractId}) has been ACCEPTED for presentation at ISSH Midterm CME 2026.

Presentation Type: {approvedFor}

Please log in to your dashboard to view the details and complete any required next steps for your final submission.

Dashboard: {dashboardUrl}

Best regards,
ISSH 2026 Organizing Committee`,
  rejectionEmailSubject: 'Update on Your Abstract Submission {abstractId} - ISSH Midterm CME 2026',
  rejectionEmailBody: `Dear {name},

Thank you for submitting your abstract titled "{title}" (ID: {abstractId}) to ISSH Midterm CME 2026.

After careful review by our scientific committee, we regret to inform you that your abstract has not been selected for presentation at this year's conference.

We appreciate your interest in ISSH Midterm CME 2026 and encourage you to submit again in the future.

Best regards,
ISSH 2026 Organizing Committee`
}

// Check if existing model has the emailNotificationMode field, if not, delete and recreate
// This handles schema updates during development
let ReviewerConfigModel: mongoose.Model<IReviewerConfig>

if (mongoose.models.ReviewerConfig) {
  const existingSchema = mongoose.models.ReviewerConfig.schema
  // Check if the schema has emailNotificationMode field
  if (!existingSchema.path('emailNotificationMode')) {
    // Schema is outdated, delete and recreate
    delete mongoose.models.ReviewerConfig
    ReviewerConfigModel = mongoose.model<IReviewerConfig>('ReviewerConfig', ReviewerConfigSchema)
  } else {
    ReviewerConfigModel = mongoose.models.ReviewerConfig as mongoose.Model<IReviewerConfig>
  }
} else {
  ReviewerConfigModel = mongoose.model<IReviewerConfig>('ReviewerConfig', ReviewerConfigSchema)
}

export default ReviewerConfigModel
