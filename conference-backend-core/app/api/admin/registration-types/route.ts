import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { getCurrentTier, getTierPricing } from '@/lib/registration'
import { conferenceConfig } from '@/config/conference.config'
import mongoose from 'mongoose'

// Category labels mapping
const CATEGORY_LABELS: Record<string, string> = {
  'resident': 'Resident (Postgraduate)',
  'delegate': 'Delegate',
  'accompanying': 'Accompanying Person'
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Allow public access for registration page

    await connectDB()

    // Get current tier and pricing from database or fallback
    const currentTierName = getCurrentTier()
    let categories: Record<string, any> = getTierPricing(currentTierName)
    let tierLabel = currentTierName
    
    // Try to get pricing from pricing_tiers collection (seeded data)
    try {
      const db = mongoose.connection.db
      if (db) {
        const today = new Date()
        
        // Get ALL active tiers and find the correct one
        const allTiers = await db.collection('pricing_tiers').find({ active: true }).sort({ startDate: 1 }).toArray()
        
        console.log('📊 All active tiers:', allTiers.map(t => ({ name: t.name, start: t.startDate, end: t.endDate })))
        console.log('📊 Server time (UTC):', today.toISOString())
        
        // Find the tier where today falls within the range
        // Use IST (UTC+5:30) for date comparison since conference is in India
        const nowIST = new Date(today.getTime() + (5.5 * 60 * 60 * 1000))
        const todayDateIST = nowIST.toISOString().split('T')[0] // YYYY-MM-DD in IST
        
        const activeTier = allTiers.find(t => {
          const startDate = new Date(t.startDate).toISOString().split('T')[0]
          const endDate = new Date(t.endDate).toISOString().split('T')[0]
          return todayDateIST >= startDate && todayDateIST <= endDate
        })
        
        if (activeTier && activeTier.categories) {
          console.log('📊 Selected tier:', activeTier.name, '| todayIST:', todayDateIST)
          categories = activeTier.categories
          tierLabel = activeTier.name
        } else {
          console.log('📊 No active tier for todayIST:', todayDateIST, '- using fallback:', currentTierName)
        }
      }
    } catch (error) {
      console.log('Using fallback pricing - database query failed:', error)
    }

    // Convert categories object to array format for frontend
    // Filter out 'accompanying' as it's handled separately
    console.log('📊 FINAL tier used:', tierLabel, '| categories:', JSON.stringify(categories))
    const registrationTypes = Object.entries(categories)
      .filter(([key]) => key !== 'accompanying')
      .map(([key, value]: [string, any]) => ({
        key,
        label: CATEGORY_LABELS[key] || conferenceConfig.registration.categories.find(c => c.key === key)?.label || key,
        price: value.amount,
        currency: value.currency || 'INR',
        description: `${tierLabel} pricing`
      }))

    return NextResponse.json({
      success: true,
      data: registrationTypes
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'CDN-Cache-Control': 'no-store'
      }
    })

  } catch (error) {
    console.error('Registration types fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
