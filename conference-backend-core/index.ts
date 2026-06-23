/**
 * Conference Backend Core - Main Export
 * 
 * Import everything you need from this single file
 */

// Configuration
export * from './config/conference.config'
export * from './config/pricing.config'
export * from './config/theme.config'

// Models
export { default as User } from './lib/models/User'
export { default as Abstract } from './lib/models/Abstract'
export { default as Payment } from './lib/models/Payment'
export { default as Review } from './lib/models/Review'
export { default as Workshop } from './lib/models/Workshop'
export { default as Configuration } from './lib/models/Configuration'

// Database
export { default as connectDB } from './lib/mongodb'

// Auth
export { authOptions } from './lib/auth'

// Email
export { EmailService } from './lib/email/service'

// Utils
export * from './lib/utils/generateId'

// Types
export type { IUser } from './lib/models/User'
export type { IAbstract } from './lib/models/Abstract'
export type { IPayment } from './lib/models/Payment'
export type { IReview } from './lib/models/Review'
export type { IWorkshop } from './lib/models/Workshop'
export type { IConfiguration } from './lib/models/Configuration'
