import mongoose, { Schema, Document } from 'mongoose'

export interface ISession {
  id: string
  title: string
  description?: string
  speakers: Array<{
    name: string
    designation?: string
    organization?: string
    photo?: string
  }>
  startTime: string
  endTime: string
  venue: string
  type: 'keynote' | 'panel' | 'workshop' | 'paper-presentation' | 'poster' | 'break' | 'networking' | 'other'
  tags?: string[]
  isBreak?: boolean
}

export interface IDayProgram {
  id: string
  date: string // YYYY-MM-DD
  title: string
  description?: string
  sessions: ISession[]
}

export interface IProgramConfig extends Document {
  isEnabled: boolean
  mode: 'full-program' | 'brochure-only'
  
  // Brochure
  brochure: {
    enabled: boolean
    title: string
    description?: string
    fileUrl?: string
    fileName?: string
    uploadedAt?: Date
  }
  
  // Full Program
  program: {
    enabled: boolean
    title: string
    description?: string
    days: IDayProgram[]
    venues: Array<{
      id: string
      name: string
      capacity?: number
      floor?: string
      description?: string
    }>
    guidelines?: string[]
  }
  
  // Display Settings
  settings: {
    showLiveIndicator: boolean
    highlightCurrentSession: boolean
    showSpeakerPhotos: boolean
    allowDownload: boolean
  }
  
  createdAt: Date
  updatedAt: Date
}

const ProgramConfigSchema = new Schema<IProgramConfig>(
  {
    isEnabled: { type: Boolean, default: false },
    mode: { 
      type: String, 
      enum: ['full-program', 'brochure-only'], 
      default: 'brochure-only' 
    },
    
    brochure: {
      enabled: { type: Boolean, default: false },
      title: { type: String, default: 'Conference Program' },
      description: String,
      fileUrl: String,
      fileName: String,
      uploadedAt: Date
    },
    
    program: {
      enabled: { type: Boolean, default: false },
      title: { type: String, default: 'Conference Program' },
      description: String,
      days: [{
        id: String,
        date: String,
        title: String,
        description: String,
        sessions: [{
          id: String,
          title: String,
          description: String,
          speakers: [{
            name: String,
            designation: String,
            organization: String,
            photo: String
          }],
          startTime: String,
          endTime: String,
          venue: String,
          type: {
            type: String,
            enum: ['keynote', 'panel', 'workshop', 'paper-presentation', 'poster', 'break', 'networking', 'other']
          },
          tags: [String],
          isBreak: { type: Boolean, default: false }
        }]
      }],
      venues: [{
        id: String,
        name: String,
        capacity: Number,
        floor: String,
        description: String
      }],
      guidelines: [String]
    },
    
    settings: {
      showLiveIndicator: { type: Boolean, default: true },
      highlightCurrentSession: { type: Boolean, default: true },
      showSpeakerPhotos: { type: Boolean, default: true },
      allowDownload: { type: Boolean, default: true }
    }
  },
  {
    timestamps: true
  }
)

export default mongoose.models.ProgramConfig || mongoose.model<IProgramConfig>('ProgramConfig', ProgramConfigSchema)
