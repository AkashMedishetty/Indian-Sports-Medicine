/**
 * Conference Configuration
 * 
 * This is the ONLY file you need to edit for a new conference.
 * All other components will automatically use these settings.
 */

export interface ConferenceConfig {
  // Basic Information
  name: string
  shortName: string
  registrationPrefix?: string  // Optional: Custom prefix for IDs (e.g., "NV2026")
  organizationName: string
  tagline?: string
  
  // Event Dates
  eventDate: {
    start: string // YYYY-MM-DD
    end: string   // YYYY-MM-DD
  }
  
  // Venue Information
  venue: {
    name: string
    address?: string
    city: string
    state: string
    country: string
    pincode?: string
    description?: string
    facilities?: string[]
    accessibility?: string[]
    mapUrl?: string
    googleMapsLink?: string
    aboutCity?: {
      title?: string
      description?: string
      highlights?: Array<{
        title: string
        description: string
        icon: string
      }>
    }
  }
  
  // Contact Information
  contact: {
    email: string
    phone: string
    website: string
    supportEmail?: string
    abstractsEmail?: string
  }
  
  // Theme Colors - These will be applied throughout the system
  theme: {
    primary: string      // Main brand color (buttons, headers)
    secondary: string    // Accent color (links, highlights)
    accent: string       // Special highlights (warnings, alerts)
    success: string      // Success states
    error: string        // Error states
    warning: string      // Warning states
    dark: string         // Dark text and elements
    light: string        // Light backgrounds
  }
  
  // Registration Configuration
  registration: {
    enabled: boolean
    startDate?: string   // YYYY-MM-DD
    endDate?: string     // YYYY-MM-DD
    
    // Form Fields Configuration
    formFields: {
      titles: string[]              // ['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.']
      designations: string[]        // ['Consultant', 'PG/Student']
      relationshipTypes: string[]   // ['Spouse', 'Child', 'Parent', 'Other']
      paymentMethods: string[]      // ['bank-transfer', 'online', 'cash']
    }
    
    // Registration Categories
    categories: {
      key: string
      label: string
      description?: string
      requiresMembership?: boolean
      membershipField?: string
    }[]
    
    // Workshop Configuration
    workshopsEnabled: boolean
    maxWorkshopsPerUser?: number
    
    // Accompanying Person
    accompanyingPersonEnabled: boolean
    maxAccompanyingPersons?: number
  }
  
  // Payment Configuration
  payment: {
    enabled: boolean
    currency: string
    currencySymbol: string
    
    // Payment Methods
    methods: {
      razorpay: boolean
      bankTransfer: boolean
      cash: boolean
    }
    
    // Bank Details (for bank transfer)
    bankDetails?: {
      accountName: string
      accountNumber: string
      bankName: string
      ifscCode: string
      branchName?: string
    }
    
    // Pricing Tiers
    tiers: {
      earlyBird?: {
        enabled: boolean
        startDate: string
        endDate: string
        label: string
      }
      regular: {
        enabled: boolean
        startDate: string
        endDate: string
        label: string
      }
      onsite?: {
        enabled: boolean
        startDate: string
        endDate: string
        label: string
      }
    }
  }
  
  // Abstract Submission
  abstracts: {
    enabled: boolean
    enableAbstractsWithoutRegistration?: boolean  // Allow unregistered users to submit abstracts
    submissionWindow?: {
      enabled: boolean
      start: string
      end: string
    }
    maxAbstractsPerUser: number
    
    // Tracks (e.g., Free Paper, Poster, E-Poster)
    tracks: {
      key: string
      label: string
      enabled: boolean
      categories?: string[]
      subcategories?: string[]
    }[]
    
    // File Upload Settings
    allowedInitialFileTypes: string[]
    allowedFinalFileTypes: string[]
    maxFileSizeMB: number
  }
  
  // Email Branding
  email: {
    fromName: string
    replyTo: string
    footerText?: string
    logoUrl?: string
  }
  
  // Social Media
  social?: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
    youtube?: string
  }
  
  // Features Toggle
  features: {
    userDashboard: boolean
    adminPanel: boolean
    reviewerPortal: boolean
    abstractSubmission: boolean
    workshopBooking: boolean
    certificateGeneration: boolean
    qrCodeGeneration: boolean
  }
}

/**
 * DEFAULT CONFIGURATION
 * ISSH Midterm CME 2026 - 12th ISSH Midterm CME on Hand Surgery
 */
export const conferenceConfig: ConferenceConfig = {
  // Basic Information
  name: "Indian Sports Medicine Conference 2026",
  shortName: "ISMC 2026",
  registrationPrefix: "ISMC2026",  // Prefix for registration IDs (ISMC2026-001, ISMC2026-002, etc.)
  organizationName: "Indian Association of Sports Medicine (IASM) & Telangana Association of Sports Medicine (TASM)",
  tagline: "Uniting Science, Practice & Performance for Stronger Athletes",
  
  // Event Dates
  eventDate: {
    start: "2026-09-05",
    end: "2026-09-06"
    // Post-conference workshop: 2026-09-07
  },
  
  // Venue
  venue: {
    name: "Venue to be announced",  // TODO: confirm exact venue
    address: "Hyderabad",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    pincode: "500001",
    description: "Hyderabad, a hub for sports science and elite healthcare, hosts the Indian Sports Medicine Conference 2026. The venue offers world-class facilities for clinical sessions, live demonstrations, and hands-on workshops.",
    facilities: [
      "Main Conference Hall",
      "Multiple Breakout Rooms",
      "State-of-the-art AV Equipment",
      "High-Speed Wi-Fi",
      "Live Demonstration Facilities",
      "Exhibition Area",
      "Premium Catering",
      "Ample Parking"
    ],
    accessibility: [
      "30 mins from Rajiv Gandhi International Airport",
      "Located in HITEC City",
      "Metro connectivity (Hitec City Station)",
      "Wheelchair accessible"
    ],
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.3!2d78.3!3d17.4!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb93dc8c5d69df%3A0x19688beb557fa0ee!2sHyderabad%20International%20Convention%20Centre!5e0!3m2!1sen!2sin!4v1234567890",
    googleMapsLink: "https://maps.google.com/?q=HICC+Hyderabad+International+Convention+Centre",
    aboutCity: {
      title: "About Hyderabad",
      description: "Hyderabad, the City of Pearls, is a vibrant metropolis that seamlessly blends rich history with modern innovation. Known for its world-class healthcare facilities, sports institutions, and warm hospitality.",
      highlights: [
        {
          title: "Sports Medicine Excellence",
          description: "Home to leading sports medicine centers, rehabilitation institutes, and elite orthopaedic and physiotherapy facilities.",
          icon: "Hospital"
        },
        {
          title: "Modern Infrastructure",
          description: "World-class convention centers, luxury hotels, and excellent transportation make it ideal for national conferences.",
          icon: "Building"
        },
        {
          title: "Cultural Heritage",
          description: "Rich history with iconic landmarks like Charminar, Golconda Fort, Hussain Sagar, and vibrant local cuisine including the famous Hyderabadi Biryani.",
          icon: "Landmark"
        }
      ]
    }
  },

  // Contact
  contact: {
    email: "contact@indiansportsmedicine.com",       // TODO: confirm official email
    phone: "+91 00000 00000",                         // TODO: confirm phone (Conference Secretary: Dr. Nithin)
    website: "https://indiansportsmedicine.com",      // TODO: confirm domain
    supportEmail: "support@indiansportsmedicine.com",
    abstractsEmail: "abstracts@indiansportsmedicine.com"
  },

  // Theme Colors - ISMC 2026 palette (derived from conference poster)
  theme: {
    primary: "#0E2A57",      // Deep Navy - main brand color
    secondary: "#F5A524",    // Signal Orange - accents / energy
    accent: "#1E5BB0",       // Electric Blue - highlights
    success: "#16A34A",      // Green - success states
    error: "#EF4444",        // Red - errors
    warning: "#F59E0B",      // Amber - warnings
    dark: "#0A1E40",         // Deep Navy - dark text
    light: "#F3F6FB"         // Cool off-white - light backgrounds
  },
  
  // Registration
  registration: {
    enabled: true,
    startDate: "2026-06-23",   // TODO: poster says "Open Soon" — set to launch date to gate the flow
    endDate: "2026-09-04",

    // Form field options (used in dropdowns and validation)
    formFields: {
      titles: ['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.'],
      designations: ['Consultant', 'PG/Student', 'Faculty', 'Physiotherapist', 'Sports Scientist', 'Athletic Trainer', 'Other'],
      relationshipTypes: ['Spouse', 'Child', 'Parent', 'Friend', 'Colleague', 'Other'],
      paymentMethods: ['bank-transfer', 'online', 'pay-now', 'cash']
    },

    categories: [
      {
        key: "iasm-member",
        label: "IASM / TASM Member",
        requiresMembership: true,
        membershipField: "membershipNumber"
      },
      {
        key: "non-member",
        label: "Non-Member"
      },
      {
        key: "postgraduate",
        label: "Postgraduate / Student"
      },
      {
        key: "faculty",
        label: "Faculty"
      },
      {
        key: "physiotherapist",
        label: "Physiotherapist / Allied Health"
      },
      {
        key: "international",
        label: "International Delegate"
      }
    ],

    workshopsEnabled: true,
    maxWorkshopsPerUser: 2,

    accompanyingPersonEnabled: true,
    maxAccompanyingPersons: 2
  },
  
  // Payment
  payment: {
    enabled: true,
    currency: "INR",
    currencySymbol: "₹",
    
    methods: {
      razorpay: true,
      bankTransfer: true,
      cash: true
    },
    
    bankDetails: {
      accountName: "Indian Sports Medicine Conference 2026",  // TODO: confirm bank details
      accountNumber: "0000000000",
      bankName: "TODO Bank",
      ifscCode: "TODO0000000",
      branchName: "Hyderabad"
    },

    tiers: {
      earlyBird: {
        enabled: true,
        startDate: "2026-06-23",
        endDate: "2026-07-31",
        label: "Early Bird"
      },
      regular: {
        enabled: true,
        startDate: "2026-08-01",
        endDate: "2026-09-04",
        label: "Regular"
      },
      onsite: {
        enabled: true,
        startDate: "2026-09-05",
        endDate: "2026-09-07",
        label: "Spot Registration"
      }
    }
  },
  
  // Abstracts
  abstracts: {
    enabled: true,
    enableAbstractsWithoutRegistration: false,
    submissionWindow: {
      enabled: true,
      start: "2026-06-23",   // TODO: confirm abstract submission window
      end: "2026-08-15"
    },
    maxAbstractsPerUser: 3,

    tracks: [
      { key: "free-paper", label: "Free Paper", enabled: true },
      { key: "poster", label: "Poster", enabled: true },
      { key: "e-poster", label: "E-Poster", enabled: true },
      { key: "award-paper", label: "Award Paper", enabled: true }
    ],
    
    allowedInitialFileTypes: [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ],
    allowedFinalFileTypes: [
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ],
    maxFileSizeMB: 4.5
  },
  
  // Email
  email: {
    fromName: "Indian Sports Medicine Conference 2026",
    replyTo: "noreply@indiansportsmedicine.com",
    footerText: "© 2026 Indian Sports Medicine Conference — IASM & TASM. All rights reserved.",
    logoUrl: "/logos/ismc-logo.png"
  },

  // Social Media
  social: {
    // TODO: confirm official social handles
    facebook: "https://facebook.com/",
    twitter: "https://twitter.com/",
    instagram: "https://instagram.com/",
    linkedin: "https://linkedin.com/"
  },
  
  // Features
  features: {
    userDashboard: true,
    adminPanel: true,
    reviewerPortal: true,
    abstractSubmission: true,
    workshopBooking: true,
    certificateGeneration: true,
    qrCodeGeneration: true
  }
}

/**
 * Helper function to get conference config
 * Can be extended to support database-driven config
 */
export function getConferenceConfig(): ConferenceConfig {
  return conferenceConfig
}

/**
 * Get current pricing tier based on date
 */
export function getCurrentPricingTier(): string {
  const today = new Date()
  const config = conferenceConfig.payment.tiers
  
  if (config.earlyBird?.enabled) {
    const start = new Date(config.earlyBird.startDate)
    const end = new Date(config.earlyBird.endDate)
    if (today >= start && today <= end) return 'earlyBird'
  }
  
  if (config.regular?.enabled) {
    const start = new Date(config.regular.startDate)
    const end = new Date(config.regular.endDate)
    if (today >= start && today <= end) return 'regular'
  }
  
  if (config.onsite?.enabled) {
    const start = new Date(config.onsite.startDate)
    const end = new Date(config.onsite.endDate)
    if (today >= start && today <= end) return 'onsite'
  }
  
  return 'regular'
}

/**
 * Check if registration is currently open
 */
export function isRegistrationOpen(): boolean {
  const config = conferenceConfig.registration
  if (!config.enabled) return false
  
  if (!config.startDate || !config.endDate) return true
  
  const today = new Date()
  const start = new Date(config.startDate)
  const end = new Date(config.endDate)
  
  return today >= start && today <= end
}

/**
 * Check if abstract submission is currently open
 */
export function isAbstractSubmissionOpen(): boolean {
  const config = conferenceConfig.abstracts
  if (!config.enabled) return false
  
  if (!config.submissionWindow?.enabled) return true
  
  const today = new Date()
  const start = new Date(config.submissionWindow.start)
  const end = new Date(config.submissionWindow.end)
  
  return today >= start && today <= end
}

/**
 * Get admin email derived from contact email domain
 * Example: contact@isshmidtermcme2026.com -> admin@isshmidtermcme2026.com
 */
export function getAdminEmail(): string {
  const domain = conferenceConfig.contact.email.split('@')[1]
  return `admin@${domain}`
}

/**
 * Get registration ID prefix
 * Uses registrationPrefix if defined, otherwise derives from shortName
 * Example: "ISSH2026" or "ISSHMidtermCME2026" (from shortName with spaces removed)
 */
export function getRegistrationPrefix(): string {
  return conferenceConfig.registrationPrefix || conferenceConfig.shortName.replace(/\s+/g, '')
}

/**
 * Get email subject with conference name
 * Example: getEmailSubject("Registration Confirmation") -> "Registration Confirmation - ISSH Midterm CME 2026"
 */
export function getEmailSubject(type: string): string {
  return `${type} - ${conferenceConfig.shortName}`
}

/**
 * Get category label from key
 * Returns the label for a registration category, or the key itself if not found
 * Example: getCategoryLabel("issh-member") -> "ISSH Member"
 */
export function getCategoryLabel(key: string): string {
  const category = conferenceConfig.registration.categories.find(c => c.key === key)
  return category?.label || key
}

/**
 * Get all valid category keys
 * Returns an array of all registration category keys defined in config
 * Example: ["issh-member", "consultant", "postgraduate", "international", "complimentary"]
 */
export function getCategoryKeys(): string[] {
  return conferenceConfig.registration.categories.map(c => c.key)
}

/**
 * Check if a category key is valid
 * Returns true if the key exists in the registration categories
 */
export function isValidCategoryKey(key: string): boolean {
  return getCategoryKeys().includes(key)
}
