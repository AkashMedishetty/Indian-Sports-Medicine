import connectDB from '../mongodb'
import ConferenceConfig from '../models/ConferenceConfig'

// Cache for config to avoid repeated database calls
let cachedConfig: any = null
let lastFetchTime = 0
const CACHE_DURATION = 60000 // 1 minute

export async function getDatabaseConfig() {
  try {
    // Return cached config if recent
    const now = Date.now()
    if (cachedConfig && (now - lastFetchTime) < CACHE_DURATION) {
      return cachedConfig
    }
    
    await connectDB()
    
    let config = await ConferenceConfig.findOne().lean()
    
    // If no config exists, create default
    if (!config) {
      config = await ConferenceConfig.create({
        registration: {
          enabled: true,
          formFields: {
            titles: ['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.'],
            designations: ['Consultant', 'PG/Student'],
            relationshipTypes: ['Spouse', 'Child', 'Parent', 'Friend', 'Colleague', 'Other'],
            paymentMethods: ['bank-transfer', 'online', 'cash']
          },
          categories: [
            {
              key: 'cvsi-member',
              label: 'CVSI Member',
              requiresMembership: true,
              membershipField: 'membershipNumber',
              isActive: true,
              displayOrder: 1
            },
            {
              key: 'non-member',
              label: 'Non Member',
              isActive: true,
              displayOrder: 2
            },
            {
              key: 'resident',
              label: 'Resident / Fellow',
              isActive: true,
              displayOrder: 3
            },
            {
              key: 'international',
              label: 'International Delegate',
              isActive: true,
              displayOrder: 4
            },
            {
              key: 'complimentary',
              label: 'Complimentary Registration',
              isActive: true,
              displayOrder: 5
            }
          ],
          workshopsEnabled: true,
          maxWorkshopsPerUser: 3,
          accompanyingPersonEnabled: true,
          maxAccompanyingPersons: 2
        },
        pricingTiers: [],
        workshops: [],
        currency: 'INR',
        currencySymbol: '₹'
      })
    }
    
    // Cache the config
    cachedConfig = config
    lastFetchTime = now
    
    return config
  } catch (error) {
    console.error('Error loading database config:', error)
    // Return fallback config
    return {
      registration: {
        enabled: true,
        formFields: {
          titles: ['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.'],
          designations: ['Consultant', 'PG/Student'],
          relationshipTypes: ['Spouse', 'Child', 'Parent', 'Friend', 'Colleague', 'Other'],
          paymentMethods: ['bank-transfer', 'online', 'cash']
        },
        categories: [
          { key: 'cvsi-member', label: 'CVSI Member', isActive: true },
          { key: 'non-member', label: 'Non Member', isActive: true },
          { key: 'resident', label: 'Resident / Fellow', isActive: true },
          { key: 'international', label: 'International Delegate', isActive: true },
          { key: 'complimentary', label: 'Complimentary Registration', isActive: true }
        ]
      }
    }
  }
}

// Clear cache (call this after updating config)
export function clearConfigCache() {
  cachedConfig = null
  lastFetchTime = 0
}
