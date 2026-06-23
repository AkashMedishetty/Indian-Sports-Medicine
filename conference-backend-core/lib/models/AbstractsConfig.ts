import mongoose, { Document, Schema } from 'mongoose'

export interface IAbstractsConfig extends Document {
  isEnabled: boolean
  submissionOpenDate: Date
  submissionCloseDate: Date
  finalSubmissionOpenDate?: Date
  finalSubmissionCloseDate?: Date
  topics: Array<{
    id: string
    name: string
    description?: string
    subtopics: Array<{
      id: string
      name: string
    }>
  }>
  presentationCategories: Array<{
    id: string
    name: string
    description?: string
  }>
  guidelines: {
    general: string
    freePaper: {
      enabled: boolean
      title: string
      wordLimit: number
      requirements: string[]
      format: string
    }
    poster: {
      enabled: boolean
      title: string
      wordLimit: number
      requirements: string[]
      format: string
    }
    finalSubmission: {
      enabled: boolean
      title: string
      instructions: string
      requirements: string[]
      deadline?: string
    }
  }
  fileRequirements: {
    maxSizeKB: number
    allowedFormats: string[]
    templateUrl?: string
    templateFileName?: string
    finalTemplateUrl?: string
    finalTemplateFileName?: string
    // Templates per submission type (track)
    trackTemplates?: Array<{
      trackKey: string
      trackLabel: string
      initialTemplateUrl?: string
      initialTemplateFileName?: string
      finalTemplateUrl?: string
      finalTemplateFileName?: string
    }>
  }
  emailTemplates: {
    acceptance: {
      enabled: boolean
      subject: string
      body: string
    }
    rejection: {
      enabled: boolean
      subject: string
      body: string
    }
    finalSubmissionReminder: {
      enabled: boolean
      subject: string
      body: string
    }
  }
  notifications: {
    confirmationEmail: boolean
    reviewStatusEmail: boolean
    reminderEmails: boolean
  }
  createdAt: Date
  updatedAt: Date
}

const AbstractsConfigSchema = new Schema<IAbstractsConfig>({
  isEnabled: {
    type: Boolean,
    default: true
  },
  submissionOpenDate: {
    type: Date,
    required: true
  },
  submissionCloseDate: {
    type: Date,
    required: true
  },
  finalSubmissionOpenDate: {
    type: Date
  },
  finalSubmissionCloseDate: {
    type: Date
  },
  topics: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: String,
    subtopics: [{
      id: { type: String, required: true },
      name: { type: String, required: true }
    }]
  }],
  presentationCategories: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: String
  }],
  guidelines: {
    general: { type: String, default: '' },
    freePaper: {
      enabled: { type: Boolean, default: true },
      title: { type: String, default: 'Free Paper Presentation' },
      wordLimit: { type: Number, default: 250 },
      requirements: [{ type: String }],
      format: { type: String, default: '' }
    },
    poster: {
      enabled: { type: Boolean, default: true },
      title: { type: String, default: 'Poster Presentation' },
      wordLimit: { type: Number, default: 250 },
      requirements: [{ type: String }],
      format: { type: String, default: '' }
    },
    finalSubmission: {
      enabled: { type: Boolean, default: true },
      title: { type: String, default: 'Final Submission Guidelines' },
      instructions: { type: String, default: 'Please submit your final presentation following the guidelines below.' },
      requirements: [{ type: String }],
      deadline: { type: String }
    }
  },
  fileRequirements: {
    maxSizeKB: { type: Number, default: 5120 }, // 5MB
    allowedFormats: [{ type: String, default: ['.doc', '.docx'] }],
    templateUrl: String,
    templateFileName: String,
    finalTemplateUrl: String,
    finalTemplateFileName: String,
    // Templates per submission type (track)
    trackTemplates: [{
      trackKey: { type: String, required: true },
      trackLabel: { type: String, required: true },
      initialTemplateUrl: String,
      initialTemplateFileName: String,
      finalTemplateUrl: String,
      finalTemplateFileName: String
    }]
  },
  emailTemplates: {
    acceptance: {
      enabled: { type: Boolean, default: true },
      subject: { type: String, default: 'Congratulations! Your Abstract Has Been Accepted' },
      body: { type: String, default: `Dear {name},

Congratulations! We are pleased to inform you that your abstract titled "{title}" (ID: {abstractId}) has been ACCEPTED for presentation at our conference.

Presentation Type: {approvedFor}

Next Steps:
1. Please submit your final presentation by the deadline
2. Follow the guidelines provided in your dashboard
3. Download the presentation template if available

You can access your dashboard to submit your final presentation at: {dashboardUrl}

If you have any questions, please contact us.

Best regards,
The Scientific Committee` }
    },
    rejection: {
      enabled: { type: Boolean, default: true },
      subject: { type: String, default: 'Abstract Review Decision' },
      body: { type: String, default: `Dear {name},

Thank you for submitting your abstract titled "{title}" (ID: {abstractId}) to our conference.

After careful review by our scientific committee, we regret to inform you that your abstract has not been selected for presentation at this time.

We appreciate your interest in our conference and encourage you to submit again in the future.

If you have any questions, please contact us.

Best regards,
The Scientific Committee` }
    },
    finalSubmissionReminder: {
      enabled: { type: Boolean, default: true },
      subject: { type: String, default: 'Reminder: Final Presentation Submission Deadline' },
      body: { type: String, default: `Dear {name},

This is a reminder that the deadline for submitting your final presentation for abstract "{title}" (ID: {abstractId}) is approaching.

Please ensure you submit your final presentation before the deadline.

You can access your dashboard at: {dashboardUrl}

Best regards,
The Scientific Committee` }
    }
  },
  notifications: {
    confirmationEmail: { type: Boolean, default: true },
    reviewStatusEmail: { type: Boolean, default: true },
    reminderEmails: { type: Boolean, default: false }
  }
}, {
  timestamps: true
})

export default mongoose.models.AbstractsConfig || mongoose.model<IAbstractsConfig>('AbstractsConfig', AbstractsConfigSchema)
