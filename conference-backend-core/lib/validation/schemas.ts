import { z } from 'zod'

// User Registration Schema
export const userRegistrationSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(100, 'Email must be less than 100 characters')
    .toLowerCase()
    .trim(),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must be less than 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
  
  confirmPassword: z.string(),
  
  profile: z.object({
    title: z.enum(['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.', 'Other']),
    
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name must be less than 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
      .trim(),
    
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be less than 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
      .trim(),
    
    phone: z
      .string()
      .min(10, 'Phone number must be at least 10 digits')
      .max(15, 'Phone number must be less than 15 digits')
      .regex(/^\+?[\d\s-()]+$/, 'Please enter a valid phone number')
      .trim(),
    
    institution: z
      .string()
      .min(1, 'Institution is required')
      .max(200, 'Institution name must be less than 200 characters')
      .trim(),
    
    address: z.object({
      street: z.string().max(100, 'Street address must be less than 100 characters').optional(),
      city: z.string().max(50, 'City must be less than 50 characters').optional(),
      state: z.string().max(50, 'State must be less than 50 characters').optional(),
      country: z.string().max(50, 'Country must be less than 50 characters').optional(),
      pincode: z.string().max(10, 'Pincode must be less than 10 characters').optional()
    }).optional(),
    
    dietaryRequirements: z.string().max(500, 'Dietary requirements must be less than 500 characters').optional(),
    specialNeeds: z.string().max(500, 'Special needs must be less than 500 characters').optional()
  }),
  
  registration: z.object({
    type: z.enum(['regular', 'student', 'international', 'faculty']),
    membershipNumber: z.string().max(50, 'Membership number must be less than 50 characters').optional(),
    workshopSelections: z.array(z.string()).max(10, 'Cannot select more than 10 workshops').optional(),
    accompanyingPersons: z.array(z.object({
      name: z.string().min(1, 'Accompanying person name is required').max(100, 'Name must be less than 100 characters'),
      age: z.number().min(0, 'Age must be a positive number').max(120, 'Age must be realistic'),
      dietaryRequirements: z.string().max(200, 'Dietary requirements must be less than 200 characters').optional(),
      relationship: z.string().max(50, 'Relationship must be less than 50 characters').optional()
    })).max(5, 'Cannot register more than 5 accompanying persons').optional()
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// Login Schema
export const loginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(100, 'Email must be less than 100 characters')
    .toLowerCase()
    .trim(),
    
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password must be less than 128 characters')
})

// Password Reset Schema
export const passwordResetSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(100, 'Email must be less than 100 characters')
    .toLowerCase()
    .trim()
})

export const newPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must be less than 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// Payment Schema
export const paymentSchema = z.object({
  registrationType: z.enum(['regular', 'student', 'international', 'faculty']),
  workshopSelections: z.array(z.string()).max(10, 'Cannot select more than 10 workshops').optional(),
  accompanyingPersons: z.number().min(0, 'Number of accompanying persons must be non-negative').max(5, 'Cannot have more than 5 accompanying persons'),
  discountCode: z.string().max(50, 'Discount code must be less than 50 characters').optional(),
  amount: z.number().min(0, 'Amount must be positive'),
  currency: z.enum(['INR', 'USD'])
})

// Admin Config Schema
export const adminConfigSchema = z.object({
  pricing: z.object({
    registration_categories: z.record(z.string(), z.object({
      amount: z.number().min(0, 'Amount must be positive'),
      currency: z.enum(['INR', 'USD']),
      label: z.string().min(1, 'Label is required').max(100, 'Label must be less than 100 characters')
    })),
    workshops: z.array(z.object({
      id: z.string().min(1, 'Workshop ID is required'),
      name: z.string().min(1, 'Workshop name is required').max(200, 'Workshop name must be less than 200 characters'),
      amount: z.number().min(0, 'Amount must be positive')
    }))
  }).optional(),
  
  discounts: z.object({
    active_discounts: z.array(z.object({
      id: z.string().min(1, 'Discount ID is required'),
      name: z.string().min(1, 'Discount name is required').max(100, 'Discount name must be less than 100 characters'),
      type: z.enum(['time-based', 'code-based']),
      percentage: z.number().min(0, 'Percentage must be positive').max(100, 'Percentage cannot exceed 100'),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      code: z.string().max(50, 'Code must be less than 50 characters').optional(),
      applicableCategories: z.array(z.string()),
      isActive: z.boolean()
    }))
  }).optional(),
  
  email: z.object({
    fromName: z.string().max(100, 'From name must be less than 100 characters'),
    fromEmail: z.string().email('Please enter a valid from email'),
    replyTo: z.string().email('Please enter a valid reply-to email'),
    templates: z.record(z.string(), z.object({
      enabled: z.boolean(),
      subject: z.string().max(200, 'Subject must be less than 200 characters')
    })),
    rateLimiting: z.object({
      batchSize: z.number().min(1, 'Batch size must be at least 1').max(100, 'Batch size cannot exceed 100'),
      delayBetweenBatches: z.number().min(100, 'Delay must be at least 100ms').max(10000, 'Delay cannot exceed 10 seconds')
    })
  }).optional()
})

// Bulk Email Schema
export const bulkEmailSchema = z.object({
  recipients: z.array(z.string().email('Invalid email address')).min(1, 'At least one recipient is required').max(1000, 'Cannot send to more than 1000 recipients'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject must be less than 200 characters'),
  content: z.string().min(1, 'Content is required').max(50000, 'Content must be less than 50000 characters'),
  senderName: z.string().max(100, 'Sender name must be less than 100 characters').optional()
})


// Contact Form Schema
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .trim(),
  
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(100, 'Email must be less than 100 characters')
    .toLowerCase()
    .trim(),
  
  phone: z
    .string()
    .refine((val) => val === '' || (val.length >= 10 && /^\+?[\d\s-()]+$/.test(val)), 
      'Phone number must be at least 10 digits and contain only valid characters'),
  
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be less than 200 characters')
    .trim(),
  
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters')
    .trim()
})

// Notification Subscription Schema
export const notificationSubscriptionSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(100, 'Email must be less than 100 characters')
    .toLowerCase()
    .trim(),
    
  source: z.enum(['program', 'abstracts', 'venue'])
})

// Generic validation helper
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err: any) => err.message)
      return { success: false, errors }
    }
    return { success: false, errors: ['Validation failed'] }
  }
}

// Sanitization helpers
export const sanitizeInput = {
  string: (input: string): string => {
    return input.trim().replace(/[<>]/g, '') // Basic XSS prevention
  },
  
  email: (input: string): string => {
    return input.toLowerCase().trim()
  },
  
  phone: (input: string): string => {
    return input.replace(/[^\d+\s-()]/g, '')
  },
  
  html: (input: string): string => {
    // More aggressive HTML sanitization for user content
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim()
  }
}