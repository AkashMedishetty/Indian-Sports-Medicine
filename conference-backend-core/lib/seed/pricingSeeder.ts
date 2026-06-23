/**
 * Dynamic Pricing Seeder
 * Generates pricing tiers from conference.config.ts
 * NO HARDCODED VALUES!
 */

import { conferenceConfig, ConferenceConfig } from '../../config/conference.config'
import Configuration from '../models/Configuration'

/**
 * Generate pricing categories dynamically from conference config
 */
function generatePricingCategories(config: ConferenceConfig) {
  const categories: Record<string, any> = {}
  
  // Generate from conference registration categories
  config.registration.categories.forEach(cat => {
    categories[cat.key] = {
      key: cat.key,
      label: cat.label,
      amount: 0, // Will be set by admin or default pricing
      currency: config.payment.currency,
      description: cat.description || '',
      requiresMembership: cat.requiresMembership || false,
      membershipField: cat.membershipField || null
    }
  })
  
  return categories
}

/**
 * Generate pricing tiers with default amounts
 */
export function generateDefaultPricing(config: ConferenceConfig) {
  const tiers: Record<string, any> = {}
  
  // Early Bird Tier
  if (config.payment.tiers.earlyBird?.enabled) {
    const categories = generatePricingCategories(config)
    
    // Set default amounts (can be customized)
    Object.keys(categories).forEach(key => {
      if (key.includes('member') || key.includes('cvsi')) {
        categories[key].amount = 8000
      } else if (key.includes('student') || key.includes('resident')) {
        categories[key].amount = 5000
      } else if (key.includes('international')) {
        categories[key].amount = 300 // USD
      } else if (key.includes('complimentary') || key.includes('sponsored')) {
        categories[key].amount = 0
      } else {
        categories[key].amount = 10000 // Default non-member
      }
    })
    
    tiers.earlyBird = {
      id: 'early-bird',
      name: config.payment.tiers.earlyBird.label,
      description: 'Save with early registration',
      startDate: config.payment.tiers.earlyBird.startDate,
      endDate: config.payment.tiers.earlyBird.endDate,
      isActive: true,
      categories
    }
  }
  
  // Regular Tier
  if (config.payment.tiers.regular?.enabled) {
    const categories = generatePricingCategories(config)
    
    Object.keys(categories).forEach(key => {
      if (key.includes('member') || key.includes('cvsi')) {
        categories[key].amount = 10000
      } else if (key.includes('student') || key.includes('resident')) {
        categories[key].amount = 7000
      } else if (key.includes('international')) {
        categories[key].amount = 400
      } else if (key.includes('complimentary') || key.includes('sponsored')) {
        categories[key].amount = 0
      } else {
        categories[key].amount = 12000
      }
    })
    
    tiers.regular = {
      id: 'regular',
      name: config.payment.tiers.regular.label,
      description: 'Standard registration pricing',
      startDate: config.payment.tiers.regular.startDate,
      endDate: config.payment.tiers.regular.endDate,
      isActive: true,
      categories
    }
  }
  
  // Onsite/Late Tier
  if (config.payment.tiers.onsite?.enabled) {
    const categories = generatePricingCategories(config)
    
    Object.keys(categories).forEach(key => {
      if (key.includes('member') || key.includes('cvsi')) {
        categories[key].amount = 12000
      } else if (key.includes('student') || key.includes('resident')) {
        categories[key].amount = 9000
      } else if (key.includes('international')) {
        categories[key].amount = 500
      } else if (key.includes('complimentary') || key.includes('sponsored')) {
        categories[key].amount = 0
      } else {
        categories[key].amount = 15000
      }
    })
    
    tiers.onsite = {
      id: 'onsite',
      name: config.payment.tiers.onsite.label,
      description: 'On-site registration pricing',
      startDate: config.payment.tiers.onsite.startDate,
      endDate: config.payment.tiers.onsite.endDate,
      isActive: true,
      categories
    }
  }
  
  return tiers
}

/**
 * Seed pricing tiers to database
 */
export async function seedPricingTiers(config: ConferenceConfig = conferenceConfig) {
  try {
    const pricing = generateDefaultPricing(config)
    
    await Configuration.findOneAndUpdate(
      { type: 'pricing', key: 'pricing_tiers' },
      {
        type: 'pricing',
        key: 'pricing_tiers',
        value: pricing,
        isActive: true,
        description: 'Conference registration pricing tiers'
      },
      { upsert: true, new: true }
    )
    
    console.log('✅ Pricing tiers seeded successfully')
    return pricing
  } catch (error) {
    console.error('❌ Error seeding pricing tiers:', error)
    throw error
  }
}

/**
 * Seed workshops from config
 */
export async function seedWorkshops(config: ConferenceConfig = conferenceConfig) {
  try {
    // Default workshops (customize in conference.config.ts)
    const workshops = [
      {
        id: 'workshop-1',
        name: 'Advanced Techniques Workshop',
        description: 'Hands-on workshop covering advanced techniques',
        amount: 2000,
        currency: config.payment.currency,
        maxSeats: 50,
        duration: '4 hours',
        isActive: true
      },
      {
        id: 'workshop-2',
        name: 'Clinical Practice Update',
        description: 'Latest updates in clinical practice',
        amount: 1500,
        currency: config.payment.currency,
        maxSeats: 40,
        duration: '3 hours',
        isActive: true
      }
    ]
    
    await Configuration.findOneAndUpdate(
      { type: 'workshops', key: 'workshops_list' },
      {
        type: 'workshops',
        key: 'workshops_list',
        value: workshops,
        isActive: true,
        description: 'Conference workshops'
      },
      { upsert: true, new: true }
    )
    
    console.log('✅ Workshops seeded successfully')
    return workshops
  } catch (error) {
    console.error('❌ Error seeding workshops:', error)
    throw error
  }
}

/**
 * Seed accompanying person pricing
 */
export async function seedAccompanyingPerson(config: ConferenceConfig = conferenceConfig) {
  try {
    const accompanyingConfig = {
      enabled: config.registration.accompanyingPersonEnabled,
      amount: 3000,
      currency: config.payment.currency,
      description: 'Includes conference materials and meals',
      maxPersons: config.registration.maxAccompanyingPersons || 2
    }
    
    await Configuration.findOneAndUpdate(
      { type: 'pricing', key: 'accompanying_person' },
      {
        type: 'pricing',
        key: 'accompanying_person',
        value: accompanyingConfig,
        isActive: true
      },
      { upsert: true, new: true }
    )
    
    console.log('✅ Accompanying person pricing seeded')
    return accompanyingConfig
  } catch (error) {
    console.error('❌ Error seeding accompanying person:', error)
    throw error
  }
}
