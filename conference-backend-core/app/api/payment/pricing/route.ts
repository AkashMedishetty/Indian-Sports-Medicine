import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Configuration from '@/lib/models/Configuration'

export async function GET() {
  try {
    await connectDB()

    // ALWAYS load from database - no fallback to config files
    const pricingConfig = await Configuration.findOne({ 
      type: 'pricing', 
      key: 'pricing_tiers',
      isActive: true 
    })
    
    if (!pricingConfig) {
      return NextResponse.json({
        success: false,
        message: 'Pricing not configured. Please run: npm run init-conference'
      }, { status: 404 })
    }
    
    const tiers = pricingConfig.value
    let currentTierName = 'regular'
    let currentTier = null

    // Determine current tier based on today's date
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    // Check each tier in priority order
    if (tiers.earlyBird && tiers.earlyBird.isActive) {
      if (todayStr >= tiers.earlyBird.startDate && todayStr <= tiers.earlyBird.endDate) {
        currentTierName = 'earlyBird'
        currentTier = tiers.earlyBird
      }
    }
    
    if (!currentTier && tiers.regular && tiers.regular.isActive) {
      if (todayStr >= tiers.regular.startDate && todayStr <= tiers.regular.endDate) {
        currentTierName = 'regular'
        currentTier = tiers.regular
      }
    }
    
    if (!currentTier && tiers.onsite && tiers.onsite.isActive) {
      if (todayStr >= tiers.onsite.startDate && todayStr <= tiers.onsite.endDate) {
        currentTierName = 'onsite'
        currentTier = tiers.onsite
      }
    }
    
    // Fallback to regular if no match
    if (!currentTier) {
      currentTier = tiers.regular || tiers.earlyBird || tiers.onsite
      currentTierName = 'regular'
    }

    // Fetch workshop configuration
    const workshopConfig = await Configuration.findOne({
      type: 'workshops',
      key: 'workshops_list',
      isActive: true
    })
    
    // Fetch accompanying person config
    const accompanyingConfig = await Configuration.findOne({
      type: 'pricing',
      key: 'accompanying_person',
      isActive: true
    })
    return NextResponse.json({
      success: true,
      data: {
        currentTier: currentTierName,
        currentTierDetails: {
          name: currentTier.name,
          description: currentTier.description,
          startDate: currentTier.startDate,
          endDate: currentTier.endDate
        },
        categories: currentTier.categories,
        allTiers: tiers,
        workshops: workshopConfig?.value || [],
        accompanyingPerson: accompanyingConfig?.value || null
      }
    })

  } catch (error) {
    console.error('Pricing API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch pricing information',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}