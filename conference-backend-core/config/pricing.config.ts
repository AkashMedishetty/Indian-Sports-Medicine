/**
 * Pricing Configuration
 * 
 * Define all pricing for registration categories, workshops, and extras.
 * This can be easily updated without touching code.
 */

import { conferenceConfig } from './conference.config'

export interface PricingCategory {
  key: string
  label: string
  amount: number
  currency: string
  description?: string
  ageBasedFree?: {
    enabled: boolean
    minAge: number
    applicableCategories: string[]
  }
}

export interface Workshop {
  id: string
  name: string
  description?: string
  amount: number
  currency: string
  maxSeats?: number
  instructor?: string
  duration?: string
}

export interface PricingTier {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  isActive: boolean
  categories: Record<string, PricingCategory>
}

/**
 * PRICING TIERS
 * Define different pricing for early bird, regular, and onsite registration
 * Note: These are default values - actual pricing is managed via admin panel
 */
export const pricingTiers: Record<string, PricingTier> = {
  earlyBird: {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Save with early registration',
    startDate: conferenceConfig.payment.tiers.earlyBird?.startDate || '2025-10-01',
    endDate: conferenceConfig.payment.tiers.earlyBird?.endDate || '2026-01-31',
    isActive: true,
    categories: {
      'tns-member': {
        key: 'tns-member',
        label: 'TNS Member',
        amount: 4000,
        currency: 'INR',
        description: 'For registered TNS members'
      },
      'consultant': {
        key: 'consultant',
        label: 'Consultant / Practicing Surgeon',
        amount: 5000,
        currency: 'INR',
        description: 'For consultants and practicing surgeons'
      },
      'postgraduate': {
        key: 'postgraduate',
        label: 'Postgraduate / Resident',
        amount: 2500,
        currency: 'INR',
        description: 'For postgraduate students and residents'
      },
      'international': {
        key: 'international',
        label: 'International Delegate',
        amount: 10000,
        currency: 'INR',
        description: 'For international delegates'
      },
      'complimentary': {
        key: 'complimentary',
        label: 'Complimentary',
        amount: 0,
        currency: 'INR',
        description: 'Complimentary registration'
      },
      'sponsored': {
        key: 'sponsored',
        label: 'Sponsored',
        amount: 0,
        currency: 'INR',
        description: 'Sponsored by organization'
      }
    }
  },
  
  regular: {
    id: 'regular',
    name: 'Regular',
    description: 'Standard registration pricing',
    startDate: conferenceConfig.payment.tiers.regular?.startDate || '2026-02-01',
    endDate: conferenceConfig.payment.tiers.regular?.endDate || '2026-04-20',
    isActive: true,
    categories: {
      'tns-member': {
        key: 'tns-member',
        label: 'TNS Member',
        amount: 4500,
        currency: 'INR',
        description: 'For registered TNS members'
      },
      'consultant': {
        key: 'consultant',
        label: 'Consultant / Practicing Surgeon',
        amount: 5000,
        currency: 'INR',
        description: 'For consultants and practicing surgeons'
      },
      'postgraduate': {
        key: 'postgraduate',
        label: 'Postgraduate / Resident',
        amount: 2500,
        currency: 'INR',
        description: 'For postgraduate students and residents'
      },
      'international': {
        key: 'international',
        label: 'International Delegate',
        amount: 12000,
        currency: 'INR',
        description: 'For international delegates'
      },
      'complimentary': {
        key: 'complimentary',
        label: 'Complimentary',
        amount: 0,
        currency: 'INR',
        description: 'Complimentary registration'
      },
      'sponsored': {
        key: 'sponsored',
        label: 'Sponsored',
        amount: 0,
        currency: 'INR',
        description: 'Sponsored by organization'
      }
    }
  },
  
  onsite: {
    id: 'onsite',
    name: 'Late / Spot Registration',
    description: 'On-site registration pricing',
    startDate: conferenceConfig.payment.tiers.onsite?.startDate || '2026-04-21',
    endDate: conferenceConfig.payment.tiers.onsite?.endDate || '2026-04-26',
    isActive: true,
    categories: {
      'tns-member': {
        key: 'tns-member',
        label: 'TNS Member',
        amount: 5500,
        currency: 'INR',
        description: 'For registered TNS members'
      },
      'consultant': {
        key: 'consultant',
        label: 'Consultant / Practicing Surgeon',
        amount: 6000,
        currency: 'INR',
        description: 'For consultants and practicing surgeons'
      },
      'postgraduate': {
        key: 'postgraduate',
        label: 'Postgraduate / Resident',
        amount: 3000,
        currency: 'INR',
        description: 'For postgraduate students and residents'
      },
      'international': {
        key: 'international',
        label: 'International Delegate',
        amount: 15000,
        currency: 'INR',
        description: 'For international delegates'
      },
      'complimentary': {
        key: 'complimentary',
        label: 'Complimentary',
        amount: 0,
        currency: 'INR',
        description: 'Complimentary registration'
      },
      'sponsored': {
        key: 'sponsored',
        label: 'Sponsored',
        amount: 0,
        currency: 'INR',
        description: 'Sponsored by organization'
      }
    }
  }
}

/**
 * WORKSHOPS
 * Workshop pricing configuration - managed via admin panel
 */
export const workshops: Workshop[] = [
  {
    id: 'hand-surgery-live',
    name: 'Live Hand Surgery Workshop',
    description: 'Live demonstration of hand surgery techniques',
    amount: 3500,
    currency: 'INR',
    maxSeats: 50,
    instructor: 'Expert Faculty',
    duration: `Full Day (${conferenceConfig.eventDate.start})`
  },
  {
    id: 'microsurgery-basics',
    name: 'Microsurgery Basics',
    description: 'Introduction to microsurgical techniques',
    amount: 2500,
    currency: 'INR',
    maxSeats: 40,
    instructor: 'Expert Faculty',
    duration: '4 hours'
  },
  {
    id: 'nerve-repair',
    name: 'Nerve Repair Techniques',
    description: 'Hands-on training in peripheral nerve repair',
    amount: 3000,
    currency: 'INR',
    maxSeats: 30,
    instructor: 'Expert Faculty',
    duration: '4 hours'
  },
  {
    id: 'tendon-surgery',
    name: 'Tendon Surgery Workshop',
    description: 'Advanced techniques in tendon repair and reconstruction',
    amount: 2500,
    currency: 'INR',
    maxSeats: 35,
    instructor: 'Expert Faculty',
    duration: '3 hours'
  }
]

/**
 * ACCOMPANYING PERSON PRICING
 */
export const accompanyingPersonFee = {
  amount: 3000,
  currency: 'INR',
  description: 'Includes conference materials and meals'
}

/**
 * DISCOUNT CODES
 * Pre-configured discount codes
 */
export interface DiscountCode {
  code: string
  type: 'percentage' | 'fixed'
  value: number
  description: string
  validFrom: string
  validTo: string
  isActive: boolean
  maxUses?: number
  currentUses?: number
  applicableCategories?: string[]
}

export const discountCodes: DiscountCode[] = [
  {
    code: 'TNS2026',
    type: 'percentage',
    value: 10,
    description: 'TNS member special discount',
    validFrom: '2025-10-01',
    validTo: '2026-04-20',
    isActive: true,
    maxUses: 200,
    applicableCategories: ['tns-member']
  },
  {
    code: 'EARLYBIRD2026',
    type: 'percentage',
    value: 15,
    description: 'Early bird special discount',
    validFrom: '2025-10-01',
    validTo: '2026-01-31',
    isActive: true,
    maxUses: 100
  },
  {
    code: 'PGSTUDENT2026',
    type: 'percentage',
    value: 10,
    description: 'Additional postgraduate discount',
    validFrom: '2025-10-01',
    validTo: '2026-04-20',
    isActive: true,
    applicableCategories: ['postgraduate']
  },
  {
    code: 'GROUP5',
    type: 'percentage',
    value: 10,
    description: 'Group registration discount (5+ members)',
    validFrom: '2025-10-01',
    validTo: '2026-04-20',
    isActive: true
  }
]

/**
 * Helper function to get current tier pricing
 */
export function getCurrentTierPricing(): PricingTier {
  const today = new Date()
  
  // Check each tier in order
  for (const [key, tier] of Object.entries(pricingTiers)) {
    if (!tier.isActive) continue
    
    const start = new Date(tier.startDate)
    const end = new Date(tier.endDate)
    
    if (today >= start && today <= end) {
      return tier
    }
  }
  
  // Default to regular pricing
  return pricingTiers.regular
}

/**
 * Get pricing for a specific category
 */
export function getCategoryPricing(categoryKey: string, tierKey?: string): PricingCategory | null {
  const tier = tierKey ? pricingTiers[tierKey] : getCurrentTierPricing()
  return tier?.categories[categoryKey] || null
}

/**
 * Calculate total registration cost
 */
export interface PriceCalculation {
  baseAmount: number
  workshopFees: number
  accompanyingPersonFees: number
  subtotal: number
  discountAmount: number
  total: number
  currency: string
  breakdown: {
    registration: { label: string; amount: number }
    workshops: { name: string; amount: number }[]
    accompanyingPersons: { count: number; amount: number }
    discount?: { code: string; percentage: number; amount: number }
  }
}

export function calculatePrice(params: {
  registrationType: string
  workshopIds?: string[]
  accompanyingPersonCount?: number
  discountCode?: string
  age?: number
}): PriceCalculation {
  const { registrationType, workshopIds = [], accompanyingPersonCount = 0, discountCode, age = 0 } = params
  
  // Get base registration fee
  const categoryPricing = getCategoryPricing(registrationType)
  if (!categoryPricing) {
    throw new Error('Invalid registration type')
  }
  
  let baseAmount = categoryPricing.amount
  
  // Apply age-based free registration
  if (categoryPricing.ageBasedFree?.enabled && 
      age >= categoryPricing.ageBasedFree.minAge &&
      categoryPricing.ageBasedFree.applicableCategories.includes(registrationType)) {
    baseAmount = 0
  }
  
  // Calculate workshop fees
  const workshopDetails = workshopIds
    .map(id => workshops.find(w => w.id === id))
    .filter(Boolean) as Workshop[]
  
  const workshopFees = workshopDetails.reduce((sum, w) => sum + w.amount, 0)
  
  // Calculate accompanying person fees
  const accompanyingPersonFees = accompanyingPersonCount * accompanyingPersonFee.amount
  
  // Calculate subtotal
  const subtotal = baseAmount + workshopFees + accompanyingPersonFees
  
  // Apply discount
  let discountAmount = 0
  let discountDetails: { code: string; percentage: number; amount: number } | undefined
  
  if (discountCode) {
    const discount = discountCodes.find(d => 
      d.code === discountCode && 
      d.isActive &&
      new Date() >= new Date(d.validFrom) &&
      new Date() <= new Date(d.validTo) &&
      (!d.applicableCategories || d.applicableCategories.includes(registrationType))
    )
    
    if (discount) {
      if (discount.type === 'percentage') {
        discountAmount = Math.round((subtotal * discount.value) / 100)
      } else {
        discountAmount = discount.value
      }
      
      discountDetails = {
        code: discount.code,
        percentage: discount.type === 'percentage' ? discount.value : 0,
        amount: discountAmount
      }
    }
  }
  
  const total = Math.max(0, subtotal - discountAmount)
  
  return {
    baseAmount,
    workshopFees,
    accompanyingPersonFees,
    subtotal,
    discountAmount,
    total,
    currency: conferenceConfig.payment.currency,
    breakdown: {
      registration: {
        label: categoryPricing.label,
        amount: baseAmount
      },
      workshops: workshopDetails.map(w => ({
        name: w.name,
        amount: w.amount
      })),
      accompanyingPersons: {
        count: accompanyingPersonCount,
        amount: accompanyingPersonFees
      },
      discount: discountDetails
    }
  }
}

/**
 * Validate discount code
 */
export function validateDiscountCode(code: string, registrationType?: string): {
  valid: boolean
  discount?: DiscountCode
  message?: string
} {
  const discount = discountCodes.find(d => d.code === code)
  
  if (!discount) {
    return { valid: false, message: 'Invalid discount code' }
  }
  
  if (!discount.isActive) {
    return { valid: false, message: 'This discount code is no longer active' }
  }
  
  const today = new Date()
  const validFrom = new Date(discount.validFrom)
  const validTo = new Date(discount.validTo)
  
  if (today < validFrom) {
    return { valid: false, message: 'This discount code is not yet valid' }
  }
  
  if (today > validTo) {
    return { valid: false, message: 'This discount code has expired' }
  }
  
  if (discount.maxUses && (discount.currentUses || 0) >= discount.maxUses) {
    return { valid: false, message: 'This discount code has reached its maximum usage limit' }
  }
  
  if (registrationType && discount.applicableCategories && 
      !discount.applicableCategories.includes(registrationType)) {
    return { valid: false, message: 'This discount code is not applicable to your registration type' }
  }
  
  return { valid: true, discount }
}
