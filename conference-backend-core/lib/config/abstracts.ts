export interface AbstractsSettings {
  // ISSH 2026 Structure
  // Submitting For options (Neurosurgery, Neurology)
  submittingForOptions: Array<{
    key: string
    label: string
    enabled: boolean
  }>

  // Submission Categories (Award Paper, Free Paper, Poster Presentation)
  submissionCategories: Array<{
    key: string
    label: string
    enabled: boolean
  }>

  // Topics per specialty
  topicsBySpecialty: {
    neurosurgery: string[]
    neurology: string[]
  }

  // Legacy: Tracks like Free Paper, Poster Presentation, E-Posters (kept for backward compatibility)
  tracks: Array<{
    key: string
    label: string
    enabled: boolean
    categories?: Array<{
      key: string
      label: string
      enabled: boolean
      subcategories?: Array<{
        key: string
        label: string
        enabled: boolean
      }>
    }>
  }>

  // Legacy: Topics and Subtopics for abstract categorization (kept for backward compatibility)
  topics: Array<{
    id: string
    name: string
    description?: string
    subtopics: Array<{
      id: string
      name: string
    }>
  }>

  // Submission controls
  submissionWindow: {
    start: string // ISO date
    end: string   // ISO date
    enabled: boolean
  }

  // Sponsor-managed abstracts
  enableAbstractsWithoutRegistration?: boolean // Allow unregistered users to submit abstracts

  // Guidelines
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
  }

  maxAbstractsPerUser: number // admin configurable
  assignmentPolicy?: 'round-robin' | 'load-based'
  reviewersPerAbstractDefault?: number

  // File settings
  allowedInitialFileTypes: string[] // e.g., ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  allowedFinalFileTypes: string[] // e.g., ppt/pptx MIME types
  maxFileSizeMB: number // applies to both initial and final unless overridden
}

// ISSH 2026 Default Configuration
// This is only used when database config is not found (e.g., fresh installation)
export const defaultAbstractsSettings: AbstractsSettings = {
  // ISSH 2026 Structure
  submittingForOptions: [
    { key: 'neurosurgery', label: 'Neurosurgery', enabled: true },
    { key: 'neurology', label: 'Neurology', enabled: true }
  ],
  submissionCategories: [
    { key: 'award-paper', label: 'Award Paper', enabled: true },
    { key: 'free-paper', label: 'Free Paper', enabled: true },
    { key: 'poster-presentation', label: 'Poster Presentation', enabled: true }
  ],
  topicsBySpecialty: {
    neurosurgery: [
      'Skullbase',
      'Vascular',
      'Neuro Oncology',
      'Paediatric Neurosurgery',
      'Spine',
      'Functional',
      'General Neurosurgery',
      'Miscellaneous'
    ],
    neurology: [
      'General Neurology',
      'Neuroimmunology',
      'Stroke',
      'Neuromuscular Disorders',
      'Epilepsy',
      'Therapeutics in Neurology',
      'Movement Disorders',
      'Miscellaneous'
    ]
  },
  // Legacy fields (kept for backward compatibility)
  tracks: [
    { key: 'free-paper', label: 'Free Paper', enabled: true },
    { key: 'poster', label: 'Poster Presentation', enabled: true }
  ],
  topics: [], // Legacy - use topicsBySpecialty instead
  submissionWindow: {
    start: new Date().toISOString(),
    end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
    enabled: false // Disabled by default - enable in admin panel
  },
  // Sponsor-managed abstracts - disabled by default
  enableAbstractsWithoutRegistration: false,
  guidelines: {
    general: 'Submit your research abstracts for Award Paper, Free Paper, and Poster Presentation at ISSH Midterm CME 2026.',
    freePaper: {
      enabled: true,
      title: 'Free Paper Presentation',
      wordLimit: 250,
      requirements: [
        'Abstract must be original and unpublished',
        'Maximum 250 words',
        'Include title, authors, and affiliations',
        'Upload as Word document (.doc or .docx)'
      ],
      format: ''
    },
    poster: {
      enabled: true,
      title: 'Poster Presentation',
      wordLimit: 250,
      requirements: [
        'Abstract must be original and unpublished',
        'Maximum 250 words',
        'Include title, authors, and affiliations',
        'Upload as Word document (.doc or .docx)'
      ],
      format: ''
    }
  },
  maxAbstractsPerUser: 5,
  assignmentPolicy: 'load-based',
  reviewersPerAbstractDefault: 2,
  allowedInitialFileTypes: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  allowedFinalFileTypes: [
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ],
  maxFileSizeMB: 4
}


