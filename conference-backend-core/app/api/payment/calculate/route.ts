import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Configuration from '@/lib/models/Configuration'
import Workshop from '@/lib/models/Workshop'
import { getCurrentTier, getTierPricing } from '@/lib/registration'
import { calculateGST } from '@/conference-backend-core/lib/utils/gst'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { registrationType, workshopSelections = [], accompanyingPersons = [], discountCode, age = 0, accommodation } = body
    
    if (!registrationType) {
      return NextResponse.json({
        success: false,
        message: 'Registration type is required'
      }, { status: 400 })
    }

    // Get current tier and pricing
    const currentTierName = getCurrentTier()
    let categories = getTierPricing(currentTierName)
    let accompanyingPersonFee = categories['accompanying']?.amount || 0
    
    // Try to get pricing from pricing_tiers collection (seeded data)
    const db = mongoose.connection.db
    if (db) {
      try {
        const today = new Date()
        const allTiers = await db.collection('pricing_tiers').find({ active: true }).sort({ startDate: 1 }).toArray()
        
        // Use IST (UTC+5:30) for date comparison since conference is in India
        const nowIST = new Date(today.getTime() + (5.5 * 60 * 60 * 1000))
        const todayDateIST = nowIST.toISOString().split('T')[0]
        
        const activeTier = allTiers.find(t => {
          const startDate = new Date(t.startDate).toISOString().split('T')[0]
          const endDate = new Date(t.endDate).toISOString().split('T')[0]
          return todayDateIST >= startDate && todayDateIST <= endDate
        })
        
        if (activeTier && activeTier.categories) {
          console.log('📊 Using pricing from database tier:', activeTier.name)
          categories = activeTier.categories
          accompanyingPersonFee = activeTier.categories['accompanying']?.amount || 0
        }
      } catch (error) {
        console.log('Error fetching from pricing_tiers, using fallback')
      }
    }
    
    // Also try configurations collection (admin-saved)
    try {
      const adminPricingConfig = await Configuration.findOne({ 
        type: 'pricing', 
        key: 'pricing_tiers', 
        isActive: true 
      })
      
      if (adminPricingConfig?.value) {
        const today = new Date()
        const iso = today.toISOString().split('T')[0]
        const tiers = adminPricingConfig.value
        const pick = (t: any) => {
          if (!t || !t.isActive) return false
          const todayMs = today.getTime()
          const start = t.startDate ? new Date(t.startDate).getTime() : 0
          const end = t.endDate ? new Date(t.endDate + (t.endDate.length === 10 ? 'T23:59:59' : '')).getTime() : Infinity
          return todayMs >= start && todayMs <= end
        }
        
        let selectedTier = null
        let selectedTierName = ''
        if (pick(tiers.earlyBird)) { 
          selectedTier = tiers.earlyBird
          selectedTierName = 'earlyBird'
        } else if (pick(tiers.regular)) { 
          selectedTier = tiers.regular
          selectedTierName = 'regular'
        } else if (pick(tiers.onsite)) { 
          selectedTier = tiers.onsite
          selectedTierName = 'onsite'
        } else { 
          selectedTier = tiers.regular
          selectedTierName = 'regular (fallback)'
        }
        
        console.log('📊 Configuration pricing - today:', iso, 'selected tier:', selectedTierName)
        console.log('📊 earlyBird dates:', tiers.earlyBird?.startDate, '-', tiers.earlyBird?.endDate, 'isActive:', tiers.earlyBird?.isActive, 'pick:', pick(tiers.earlyBird))
        console.log('📊 regular dates:', tiers.regular?.startDate, '-', tiers.regular?.endDate, 'isActive:', tiers.regular?.isActive, 'pick:', pick(tiers.regular))
        
        if (selectedTier?.categories) {
          categories = selectedTier.categories
          accompanyingPersonFee = selectedTier.categories['accompanying']?.amount || 0
        }
      }
    } catch (error) {
      console.log('Using fallback pricing - configurations unavailable')
    }

    // Calculate base registration fee
    const registrationCategory = categories[registrationType]
    // Faculty registration is complimentary — base fee is 0
    const isFaculty = registrationType === 'faculty'
    if (!registrationCategory && !isFaculty) {
      return NextResponse.json({
        success: false,
        message: `Invalid registration type: ${registrationType}`
      }, { status: 400 })
    }
    
    // Get age exemption rules from database
    let seniorCitizenAge = 999  // Default to disabled (very high age)
    let seniorCitizenCategory = 'none'  // Default to no category
    let seniorCitizenEnabled = false
    let childrenUnderAge = 10
    
    try {
      const ageExemptionsConfig = await Configuration.findOne({
        type: 'pricing',
        key: 'age_exemptions',
        isActive: true
      })
      
      if (ageExemptionsConfig?.value) {
        // Only apply senior citizen exemption if explicitly enabled
        seniorCitizenEnabled = ageExemptionsConfig.value.senior_citizen_enabled === true
        if (seniorCitizenEnabled) {
          seniorCitizenAge = ageExemptionsConfig.value.senior_citizen_age || 999
          seniorCitizenCategory = ageExemptionsConfig.value.senior_citizen_category || 'none'
        }
        childrenUnderAge = ageExemptionsConfig.value.children_under_age || 10
      }
    } catch (error) {
      console.log('Using fallback age exemptions')
    }
    
    // Apply age-based free registration for senior citizens (only if enabled)
    let baseAmount = isFaculty ? 0 : (registrationCategory?.amount || 0)
    const currency = registrationCategory?.currency || 'INR'
    const registrationLabel = isFaculty ? 'Faculty (Complimentary)' : (registrationCategory?.label || registrationType)
    
    // Check if senior citizen exemption applies (only if enabled)
    const appliesForSeniorExemption = 
      seniorCitizenEnabled &&
      age >= seniorCitizenAge && 
      (seniorCitizenCategory === 'all' || seniorCitizenCategory === registrationType)
    
    if (appliesForSeniorExemption) {
      baseAmount = 0
    }

    // GST will be calculated after all fees are computed

    // Get workshops from Workshop collection
    let workshops: any[] = []
    try {
      const workshopDocs = await Workshop.find({ isActive: true })
      workshops = workshopDocs.map(w => ({
        id: w.id,
        name: w.name,
        amount: w.price,
        currency: w.currency
      }))
    } catch (error) {
      console.error('Error fetching workshops:', error)
    }

    // Calculate workshop fees
    let workshopFees: Array<{ name: string; amount: number }> = []
    let totalWorkshopFees = 0

    if (workshopSelections && workshopSelections.length > 0) {
      workshopSelections.forEach((workshopId: string) => {
        const workshop = workshops.find(w => w.id === workshopId)
        if (workshop) {
          workshopFees.push({
            name: workshop.name,
            amount: workshop.amount
          })
          totalWorkshopFees += workshop.amount
        }
      })
    }
    
    // Calculate accompanying person fees
    let totalAccompanyingFees = 0
    let accompanyingPersonCount = 0
    let freeChildrenCount = 0
    let accompanyingBreakdown: Array<{ name: string; age: number; amount: number; isFree: boolean }> = []
    
    if (accompanyingPersons && accompanyingPersons.length > 0) {
      accompanyingPersons.forEach((person: any) => {
        const personAge = person.age || 0
        const personName = person.name || 'Accompanying Person'
        
        if (personAge < childrenUnderAge) {
          freeChildrenCount++
          accompanyingBreakdown.push({
            name: personName,
            age: personAge,
            amount: 0,
            isFree: true
          })
        } else {
          accompanyingPersonCount++
          totalAccompanyingFees += accompanyingPersonFee
          accompanyingBreakdown.push({
            name: personName,
            age: personAge,
            amount: accompanyingPersonFee,
            isFree: false
          })
        }
      })
    }

    // Calculate accommodation fees
    let accommodationFees = 0
    let accommodationNights = 0
    let accommodationBreakdown: { roomType: string; checkIn: string; checkOut: string; nights: number; perNight: number; total: number } | null = null

    if (accommodation && accommodation.roomType && accommodation.checkIn && accommodation.checkOut) {
      const checkIn = new Date(accommodation.checkIn)
      const checkOut = new Date(accommodation.checkOut)
      accommodationNights = Math.max(0, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)))
      const perNight = accommodation.roomType === 'single' ? 10000 : 7500
      accommodationFees = accommodationNights * perNight
      accommodationBreakdown = {
        roomType: accommodation.roomType,
        checkIn: accommodation.checkIn,
        checkOut: accommodation.checkOut,
        nights: accommodationNights,
        perNight,
        total: accommodationFees
      }
    }

    // Calculate GST (18% on all fees: registration + workshops + accompanying persons + accommodation)
    const preGstTotal = baseAmount + totalWorkshopFees + totalAccompanyingFees + accommodationFees
    const gstAmount = calculateGST(preGstTotal)

    // Calculate subtotal (all fees + GST)
    const subtotal = preGstTotal + gstAmount

    // Apply discounts (if any)
    let totalDiscount = 0
    const appliedDiscounts: Array<{
      type: string
      code?: string
      percentage: number
      amount: number
    }> = []

    if (discountCode) {
      try {
        const discountConfigs = await Configuration.find({
          type: 'discounts',
          isActive: true
        })

        const currentDate = new Date()
        discountConfigs.forEach(config => {
          if (config.value && Array.isArray(config.value)) {
            config.value.forEach((discount: any) => {
              if (discount.code === discountCode && discount.isActive) {
                const discountEndDate = new Date(discount.endDate)
                if (currentDate <= discountEndDate) {
                  const discountAmount = Math.floor((subtotal * discount.percentage) / 100)
                  totalDiscount += discountAmount
                  appliedDiscounts.push({
                    type: discount.type || 'code-based',
                    code: discount.code,
                    percentage: discount.percentage,
                    amount: discountAmount
                  })
                }
              }
            })
          }
        })
      } catch (error) {
        console.log('Error applying discount:', error)
      }
    }

    // Calculate final total
    const total = subtotal - totalDiscount
    const finalAmount = Math.max(total, 0)

    const calculationData = {
      baseAmount,
      registrationFee: baseAmount,
      registrationLabel,
      gst: gstAmount,
      workshopFees: totalWorkshopFees,
      accompanyingPersons: totalAccompanyingFees,
      accompanyingPersonFees: totalAccompanyingFees,
      accompanyingPersonCount,
      freeChildrenCount,
      accommodationFees,
      accommodationNights,
      accommodationBreakdown,
      subtotal,
      discount: totalDiscount,
      total: finalAmount,
      finalAmount,
      currency,
      breakdown: {
        registration: {
          type: registrationType,
          label: registrationLabel,
          amount: baseAmount
        },
        gst: gstAmount,
        gstPercentage: 18,
        workshops: workshopFees,
        accompanyingPersons: accompanyingBreakdown,
        accompanyingPersonFeePerPerson: accompanyingPersonFee,
        accommodation: accommodationBreakdown,
        appliedDiscounts,
        tier: currentTierName
      }
    }

    console.log('💰 Price calculation result:', JSON.stringify(calculationData, null, 2))

    return NextResponse.json({
      success: true,
      data: calculationData
    })

  } catch (error) {
    console.error('Price calculation error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}