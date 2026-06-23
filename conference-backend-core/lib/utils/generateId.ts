import connectDB from '../mongodb'
import User from '../models/User'
import { conferenceConfig } from '@/config/conference.config'

/**
 * Extract conference prefix from config
 * Uses registrationPrefix if available, otherwise extracts from shortName
 * "NEUROVASCON 2026" -> "NV2026" (if registrationPrefix is set)
 */
function extractPrefix(): string {
  // Use explicit prefix if set in config
  if (conferenceConfig.registrationPrefix) {
    return conferenceConfig.registrationPrefix
  }
  
  // Fallback: extract from short name
  const shortName = conferenceConfig.shortName || 'CONFERENCE 2026'
  const words = shortName.split(/\s+/)
  const mainPart = words.slice(0, -1).join(' ') || words[0]
  const year = words[words.length - 1]
  
  // Simple extraction: first 2-3 chars + year
  const initials = mainPart.substring(0, Math.min(3, mainPart.length)).toUpperCase()
  return `${initials}${year}`
}

/**
 * Generate a unique registration ID
 * Format: NV2026-001, NV2026-002, etc. (using conference prefix)
 */
export async function generateRegistrationId(): Promise<string> {
  const prefix = extractPrefix()
  
  try {
    await connectDB()
    
    // Find the highest existing registration number across ALL users (any role)
    // This prevents ID collisions between regular users, sponsors, reviewers, etc.
    const lastUser = await User.findOne(
      { 
        'registration.registrationId': { $regex: `^${prefix}-\\d{3}$` }
      },
      {},
      { sort: { 'registration.registrationId': -1 } }
    )
    
    let nextNumber = 1
    
    if (lastUser && lastUser.registration.registrationId) {
      // Extract the number from the last registration ID
      const lastIdMatch = lastUser.registration.registrationId.match(/(\d{3})$/)
      if (lastIdMatch) {
        nextNumber = parseInt(lastIdMatch[1]) + 1
      }
    }
    
    // Format with leading zeros (3 digits)
    const formattedNumber = nextNumber.toString().padStart(3, '0')
    
    return `${prefix}-${formattedNumber}`
  } catch (error) {
    console.error('Error generating registration ID:', error)
    // Fallback to timestamp-based ID if database query fails
    const timestamp = Date.now().toString().slice(-3)
    return `${prefix}-${timestamp.padStart(3, '0')}`
  }
}

/**
 * Generate a simple registration ID synchronously (fallback)
 * Format: NV2026-XXX (where XXX is random 3-digit number)
 */
export function generateSimpleRegistrationId(): string {
  const prefix = extractPrefix()
  const number = Math.floor(Math.random() * 900) + 100 // 100-999
  
  return `${prefix}-${number.toString().padStart(3, '0')}`
}

/**
 * Generate a unique order ID for Razorpay
 * Format: ORDER_XXXXXXXXXX
 */
 
/**
 * Generate a unique Abstract ID
 * Format: ABS-NV2026-XXX
 */
export async function generateAbstractId(): Promise<string> {
  const confPrefix = extractPrefix()
  const prefix = `ABS-${confPrefix}`
  try {
    const { default: connectDB } = await import('../mongodb')
    const { default: Abstract } = await import('../models/Abstract')
    await connectDB()

    const last = await Abstract.findOne(
      { abstractId: { $regex: `^${prefix}-\\d{3}$` } },
      {},
      { sort: { abstractId: -1 } }
    )

    let nextNumber = 1
    if (last?.abstractId) {
      const match = last.abstractId.match(/(\d{3})$/)
      if (match) nextNumber = parseInt(match[1]) + 1
    }

    const formatted = nextNumber.toString().padStart(3, '0')
    return `${prefix}-${formatted}`
  } catch (error) {
    const fallback = Date.now().toString().slice(-3)
    return `${prefix}-${fallback.padStart(3, '0')}`
  }
}

export function generateOrderId(): string {
  const prefix = 'ORDER'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  
  return `${prefix}_${timestamp}${random}`
}