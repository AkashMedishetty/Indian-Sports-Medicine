import connectDB from '../mongodb'
import Configuration from '../models/Configuration'

// Cache for configuration data
const configCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get configuration by type and key with caching
 */
export async function getConfig(type: string, key: string) {
  const cacheKey = `${type}:${key}`
  const cached = configCache.get(cacheKey)
  
  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  try {
    await connectDB()
    const config = await Configuration.findOne({ type, key, isActive: true })
    
    if (config) {
      // Cache the result
      configCache.set(cacheKey, {
        data: config.value,
        timestamp: Date.now()
      })
      return config.value
    }
    
    return null
  } catch (error) {
    console.error(`Error fetching config ${type}:${key}:`, error)
    return null
  }
}

/**
 * Get all configurations by type
 */
export async function getConfigsByType(type: string) {
  try {
    await connectDB()
    const configs = await Configuration.find({ type, isActive: true })
    
    const result: Record<string, any> = {}
    configs.forEach(config => {
      result[config.key] = config.value
    })
    
    return result
  } catch (error) {
    console.error(`Error fetching configs for type ${type}:`, error)
    return {}
  }
}

/**
 * Update configuration
 */
export async function updateConfig(type: string, key: string, value: any, userId: string) {
  try {
    await connectDB()
    
    const config = await Configuration.findOneAndUpdate(
      { type, key },
      { 
        type, 
        key, 
        value, 
        isActive: true, 
        createdBy: userId 
      },
      { upsert: true, new: true }
    )
    
    // Clear cache for this config
    configCache.delete(`${type}:${key}`)
    
    return config
  } catch (error) {
    console.error(`Error updating config ${type}:${key}:`, error)
    throw error
  }
}

/**
 * Get pricing configuration
 */
export async function getPricingConfig() {
  return await getConfig('pricing', 'registration_categories')
}

/**
 * Get workshop configuration
 */
export async function getWorkshopConfig() {
  return await getConfig('pricing', 'workshops')
}

/**
 * Get active discounts
 */
export async function getActiveDiscounts() {
  const discounts = await getConfig('discounts', 'active_discounts')
  if (!discounts) return []
  
  // Filter discounts based on current date
  const now = new Date()
  return discounts.filter((discount: any) => {
    if (!discount.isActive) return false
    
    if (discount.type === 'time-based') {
      const startDate = discount.startDate ? new Date(discount.startDate) : null
      const endDate = discount.endDate ? new Date(discount.endDate) : null
      
      if (startDate && now < startDate) return false
      if (endDate && now > endDate) return false
    }
    
    return true
  })
}

/**
 * Get conference details
 */
export async function getConferenceConfig() {
  return await getConfig('content', 'conference_details')
}

/**
 * Get email settings
 */
export async function getEmailConfig() {
  return await getConfig('settings', 'email_settings')
}

/**
 * Clear all configuration cache
 */
export function clearConfigCache() {
  configCache.clear()
}