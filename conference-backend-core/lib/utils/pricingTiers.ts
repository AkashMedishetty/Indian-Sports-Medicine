import connectDB from '../mongodb'
import Configuration from '../models/Configuration'

export interface PricingTier {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  isActive: boolean
  categories: {
    [key: string]: {
      amount: number
      currency: string
      label: string
    }
  }
}

export interface PricingTiersData {
  specialOffers: PricingTier[]
  earlyBird: PricingTier
  regular: PricingTier
  onsite: PricingTier
}

/**
 * Get current pricing tier based on the current date
 */
export async function getCurrentPricingTier(): Promise<PricingTier | null> {
  try {
    await connectDB()
    
    const pricingTiersConfig = await Configuration.findOne({
      type: 'pricing',
      key: 'pricing_tiers',
      isActive: true
    })

    if (!pricingTiersConfig) {
      return null
    }

    const tiersData: PricingTiersData = pricingTiersConfig.value
    const currentDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    // Check special offers first (highest priority)
    for (const offer of tiersData.specialOffers) {
      if (offer.isActive && 
          currentDate >= offer.startDate && 
          currentDate <= offer.endDate) {
        return {
          id: offer.id,
          name: offer.name,
          description: offer.description,
          startDate: offer.startDate,
          endDate: offer.endDate,
          isActive: offer.isActive,
          categories: offer.categories
        }
      }
    }

    // Check early bird
    if (tiersData.earlyBird.isActive &&
        currentDate >= tiersData.earlyBird.startDate &&
        currentDate <= tiersData.earlyBird.endDate) {
      return {
        id: 'early-bird',
        name: tiersData.earlyBird.name,
        description: tiersData.earlyBird.description,
        startDate: tiersData.earlyBird.startDate,
        endDate: tiersData.earlyBird.endDate,
        isActive: tiersData.earlyBird.isActive,
        categories: tiersData.earlyBird.categories
      }
    }

    // Check regular
    if (tiersData.regular.isActive &&
        currentDate >= tiersData.regular.startDate &&
        currentDate <= tiersData.regular.endDate) {
      return {
        id: 'regular',
        name: tiersData.regular.name,
        description: tiersData.regular.description,
        startDate: tiersData.regular.startDate,
        endDate: tiersData.regular.endDate,
        isActive: tiersData.regular.isActive,
        categories: tiersData.regular.categories
      }
    }

    // Check onsite
    if (tiersData.onsite.isActive &&
        currentDate >= tiersData.onsite.startDate &&
        currentDate <= tiersData.onsite.endDate) {
      return {
        id: 'onsite',
        name: tiersData.onsite.name,
        description: tiersData.onsite.description,
        startDate: tiersData.onsite.startDate,
        endDate: tiersData.onsite.endDate,
        isActive: tiersData.onsite.isActive,
        categories: tiersData.onsite.categories
      }
    }

    // Fallback to regular pricing if no tier matches
    return {
      id: 'regular',
      name: tiersData.regular.name,
      description: tiersData.regular.description,
      startDate: tiersData.regular.startDate,
      endDate: tiersData.regular.endDate,
      isActive: tiersData.regular.isActive,
      categories: tiersData.regular.categories
    }

  } catch (error) {
    console.error('Error fetching current pricing tier:', error)
    return null
  }
}

/**
 * Get all pricing tiers configuration
 */
export async function getAllPricingTiers(): Promise<PricingTiersData | null> {
  try {
    await connectDB()
    
    const pricingTiersConfig = await Configuration.findOne({
      type: 'pricing',
      key: 'pricing_tiers',
      isActive: true
    })

    if (!pricingTiersConfig) {
      return null
    }

    return pricingTiersConfig.value as PricingTiersData
  } catch (error) {
    console.error('Error fetching pricing tiers:', error)
    return null
  }
}

/**
 * Get pricing for a specific registration type in the current tier
 */
export async function getCurrentPricing(registrationType: string): Promise<{ amount: number; currency: string; label: string } | null> {
  try {
    const currentTier = await getCurrentPricingTier()
    
    if (!currentTier || !currentTier.categories[registrationType]) {
      return null
    }

    return currentTier.categories[registrationType]
  } catch (error) {
    console.error('Error fetching current pricing:', error)
    return null
  }
}

/**
 * Get the next upcoming pricing tier
 */
export async function getNextPricingTier(): Promise<{ tier: PricingTier; daysUntil: number } | null> {
  try {
    const tiersData = await getAllPricingTiers()
    if (!tiersData) return null

    const currentDate = new Date()
    const currentDateStr = currentDate.toISOString().split('T')[0]

    // Check all tiers and find the next one
    const allTiers = [
      ...tiersData.specialOffers,
      tiersData.earlyBird,
      tiersData.regular,
      tiersData.onsite
    ]

    let nextTier: PricingTier | null = null
    let minDaysUntil = Infinity

    for (const tier of allTiers) {
      if (tier.isActive && tier.startDate > currentDateStr) {
        const tierStartDate = new Date(tier.startDate)
        const daysUntil = Math.ceil((tierStartDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysUntil < minDaysUntil) {
          minDaysUntil = daysUntil
          nextTier = tier
        }
      }
    }

    return nextTier ? { tier: nextTier, daysUntil: minDaysUntil } : null
  } catch (error) {
    console.error('Error fetching next pricing tier:', error)
    return null
  }
}