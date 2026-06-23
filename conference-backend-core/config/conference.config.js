/**
 * JavaScript wrapper for conference config
 * This allows scripts to import the config without TypeScript compilation
 */

module.exports.conferenceConfig = {
  // Basic Information
  name: "26th Annual Conference of the Cerebrovascular Society of India",
  shortName: "NEUROVASCON 2026",
  organizationName: "Cerebrovascular Society of India (CVSI)",
  tagline: "Advancing Neurovascular Excellence",
  
  // Event Dates
  eventDate: {
    start: "2026-10-02",
    end: "2026-10-04"
  },
  
  // Venue
  venue: {
    name: "Hyderabad International Convention Centre",
    address: "Plot No. 1, Hitec City, Madhapur",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    pincode: "500081"
  },
  
  // Contact
  contact: {
    email: "contact@neurovascon2026.com",
    phone: "+91 9876543210",
    website: "https://neurovascon2026.com",
    supportEmail: "support@neurovascon2026.com",
    abstractsEmail: "abstracts@neurovascon2026.com"
  },
  
  // Theme Colors
  theme: {
    primary: "#FCCA00",
    secondary: "#000000",
    accent: "#FF6B00",
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
    dark: "#111827",
    light: "#ffffff"
  },
  
  // Registration
  registration: {
    enabled: true,
    startDate: "2025-06-01",
    endDate: "2026-02-05",
    
    categories: [
      {
        key: "cvsi-member",
        label: "CVSI Member",
        requiresMembership: true,
        membershipField: "membershipNumber"
      },
      {
        key: "non-member",
        label: "Non Member"
      },
      {
        key: "resident",
        label: "Resident / Fellow"
      },
      {
        key: "international",
        label: "International Delegate"
      },
      {
        key: "complimentary",
        label: "Complimentary Registration"
      }
    ],
    
    workshopsEnabled: true,
    maxWorkshopsPerUser: 3,
    
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
      accountName: "NEUROVASCON 2026",
      accountNumber: "1234567890",
      bankName: "State Bank of India",
      ifscCode: "SBIN0001234",
      branchName: "Hyderabad Main Branch"
    },
    
    tiers: {
      earlyBird: {
        enabled: true,
        startDate: "2025-06-01",
        endDate: "2025-12-31",
        label: "Early Bird"
      },
      regular: {
        enabled: true,
        startDate: "2026-01-01",
        endDate: "2026-01-31",
        label: "Regular"
      },
      onsite: {
        enabled: true,
        startDate: "2026-02-01",
        endDate: "2026-02-08",
        label: "Late / Spot Registration"
      }
    }
  },
  
  // Abstracts
  abstracts: {
    enabled: true,
    submissionWindow: {
      enabled: true,
      start: "2025-08-01",
      end: "2025-12-31"
    },
    maxAbstractsPerUser: 3,
    
    tracks: [
      {
        key: "oral-presentation",
        label: "Oral Presentation",
        enabled: true,
        categories: ["Stroke", "Aneurysm", "AVM", "Carotid Disease", "Neurointerventional"],
        subcategories: ["Ischemic Stroke", "Hemorrhagic Stroke", "Endovascular", "Surgical"]
      },
      {
        key: "poster",
        label: "Poster Presentation",
        enabled: true
      },
      {
        key: "e-poster",
        label: "E-Poster",
        enabled: true
      },
      {
        key: "video-presentation",
        label: "Video Presentation",
        enabled: true
      }
    ],
    
    allowedInitialFileTypes: [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ],
    allowedFinalFileTypes: [
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ],
    maxFileSizeMB: 10
  },
  
  // Email
  email: {
    fromName: "NEUROVASCON 2026",
    replyTo: "noreply@neurovascon2026.com",
    footerText: "© 2026 NEUROVASCON. All rights reserved.",
    logoUrl: "/images/logo.png"
  },
  
  // Social Media
  social: {
    facebook: "https://facebook.com/neurovascon",
    twitter: "https://twitter.com/neurovascon",
    instagram: "https://instagram.com/neurovascon",
    linkedin: "https://linkedin.com/company/neurovascon"
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
