import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Configuration from '@/lib/models/Configuration'
import User from '@/lib/models/User'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    const adminUser = await User.findById((session.user as any).id)
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 })
    }

    // First try to get from configurations collection
    const pricingTiersConfig = await Configuration.findOne({
      type: 'pricing',
      key: 'pricing_tiers',
      isActive: true
    })

    if (pricingTiersConfig?.value) {
      return NextResponse.json({
        success: true,
        data: pricingTiersConfig.value
      })
    }

    // If not in configurations, try to read from pricing_tiers collection (seeded data)
    const db = mongoose.connection.db
    if (db) {
      const seededTiers = await db.collection('pricing_tiers').find({ active: true }).toArray()
      
      if (seededTiers && seededTiers.length > 0) {
        // Convert seeded format to admin panel format
        const earlyBirdTier = seededTiers.find(t => t.code === 'EARLYBIRD')
        const regularTier = seededTiers.find(t => t.code === 'REGULAR')
        const spotTier = seededTiers.find(t => t.code === 'SPOT')

        const formatTier = (tier: any, defaultName: string, defaultDesc: string) => {
          if (!tier) return null
          return {
            name: tier.name || defaultName,
            description: defaultDesc,
            startDate: tier.startDate?.toISOString().split('T')[0] || '',
            endDate: tier.endDate?.toISOString().split('T')[0] || '',
            isActive: tier.active !== false,
            categories: tier.categories || {}
          }
        }

        const pricingData = {
          specialOffers: [],
          earlyBird: formatTier(earlyBirdTier, 'Early Bird Registration', 'Early registration discount'),
          regular: formatTier(regularTier, 'Regular Registration', 'Standard registration pricing'),
          onsite: formatTier(spotTier, 'Spot Registration', 'Registration at the venue')
        }

        return NextResponse.json({
          success: true,
          data: pricingData
        })
      }
    }

    // Return default structure if nothing found - ISSH 2026
    const defaultPricingTiers = {
      specialOffers: [],
      earlyBird: {
        name: 'Early Bird Registration',
        description: 'Early registration discount',
        startDate: '2025-10-01',
        endDate: '2026-01-15',
        isActive: true,
        categories: {
          'resident': { amount: 4000, currency: 'INR', label: 'Resident (Postgraduate)' },
          'delegate': { amount: 5500, currency: 'INR', label: 'Delegate' },
          'accompanying': { amount: 3500, currency: 'INR', label: 'Accompanying Person' }
        }
      },
      regular: {
        name: 'Regular Registration',
        description: 'Standard registration pricing',
        startDate: '2026-01-16',
        endDate: '2026-02-23',
        isActive: true,
        categories: {
          'resident': { amount: 5000, currency: 'INR', label: 'Resident (Postgraduate)' },
          'delegate': { amount: 6500, currency: 'INR', label: 'Delegate' },
          'accompanying': { amount: 4500, currency: 'INR', label: 'Accompanying Person' }
        }
      },
      onsite: {
        name: 'Spot Registration',
        description: 'Late / Spot Registration',
        startDate: '2026-02-24',
        endDate: '2026-03-08',
        isActive: true,
        categories: {
          'resident': { amount: 6000, currency: 'INR', label: 'Resident (Postgraduate)' },
          'delegate': { amount: 8000, currency: 'INR', label: 'Delegate' },
          'accompanying': { amount: 5000, currency: 'INR', label: 'Accompanying Person' }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: defaultPricingTiers
    })

  } catch (error) {
    console.error('Pricing tiers config fetch error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return PUT(request)
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    const adminUser = await User.findById((session.user as any).id)
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 })
    }

    const body = await request.json()
    const { specialOffers, earlyBird, regular, onsite } = body

    // Validate the data structure
    if (!earlyBird || !regular || !onsite) {
      return NextResponse.json({
        success: false,
        message: 'Missing required pricing tier data'
      }, { status: 400 })
    }

    // Validate each tier has required fields
    const tiers = [earlyBird, regular, onsite, ...(specialOffers || [])]
    for (const tier of tiers) {
      if (!tier.name || !tier.startDate || !tier.endDate || !tier.categories) {
        return NextResponse.json({
          success: false,
          message: 'Invalid tier data: missing required fields'
        }, { status: 400 })
      }

      // Validate categories - flexible validation for any category names
      if (!tier.categories || typeof tier.categories !== 'object') {
        return NextResponse.json({
          success: false,
          message: `Invalid categories data in tier ${tier.name}`
        }, { status: 400 })
      }
      
      // Check that each category has required fields
      for (const [categoryKey, categoryData] of Object.entries(tier.categories)) {
        if (!categoryData || 
            typeof (categoryData as any).amount !== 'number' ||
            !(categoryData as any).currency ||
            !(categoryData as any).label) {
          return NextResponse.json({
            success: false,
            message: `Invalid category data for ${categoryKey} in tier ${tier.name}`
          }, { status: 400 })
        }
      }
    }

    // Update pricing tiers configuration
    await Configuration.findOneAndUpdate(
      { type: 'pricing', key: 'pricing_tiers' },
      {
        type: 'pricing',
        key: 'pricing_tiers',
        value: {
          specialOffers: specialOffers || [],
          earlyBird,
          regular,
          onsite
        },
        isActive: true,
        createdBy: adminUser._id,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({
      success: true,
      message: 'Pricing tiers configuration updated successfully'
    })

  } catch (error) {
    console.error('Pricing tiers config update error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}