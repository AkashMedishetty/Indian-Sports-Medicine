import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Configuration from '@/lib/models/Configuration'

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

    // Get pricing configuration from the comprehensive config
    const pricingTiersConfig = await Configuration.findOne({ 
      type: 'pricing', 
      key: 'pricing_tiers' 
    })

    // Get accompanying person config
    const accompanyingPersonConfig = await Configuration.findOne({
      type: 'pricing',
      key: 'accompanying_person'
    })

    // Get age exemptions config
    const ageExemptionsConfig = await Configuration.findOne({
      type: 'pricing',
      key: 'age_exemptions'
    })

    // Extract the needed parts from the comprehensive config
    let pricingData = null
    let workshopData = null
    
    if (pricingTiersConfig?.value) {
      // Extract registration categories from earlyBird/regular tiers
      const tiers = pricingTiersConfig.value
      if (tiers.earlyBird?.categories) {
        pricingData = tiers.earlyBird.categories
      } else if (tiers.regular?.categories) {
        pricingData = tiers.regular.categories
      }
      
      // Extract workshops
      if (tiers.workshops) {
        workshopData = tiers.workshops
      }
    }

    // Default pricing if not found
    const defaultPricing = {
      registration_categories: {
        regular: { amount: 15000, currency: 'INR', label: 'Regular Delegate' },
        student: { amount: 8000, currency: 'INR', label: 'Student/Resident' },
        international: { amount: 300, currency: 'USD', label: 'International Delegate' },
        faculty: { amount: 12000, currency: 'INR', label: 'Faculty Member' },
        accompanying: { amount: 3000, currency: 'INR', label: 'Accompanying Person' }
      },
      workshops: [
        { id: 'joint-replacement', name: 'Advanced Joint Replacement', amount: 2000 },
        { id: 'arthroscopic', name: 'Arthroscopic Surgery Masterclass', amount: 2500 },
        { id: 'spine-surgery', name: 'Spine Surgery Innovations', amount: 2000 },
        { id: 'trauma-management', name: 'Trauma Management', amount: 1500 }
      ],
      accompanying_person: {
        amount: 4720,
        currency: 'INR'
      },
      age_exemptions: {
        children_under_age: 10,
        senior_citizen_age: 70,
        senior_citizen_category: 'consultant'
      }
    }

    const result = {
      registration_categories: pricingData || defaultPricing.registration_categories,
      workshops: workshopData || defaultPricing.workshops,
      accompanying_person: accompanyingPersonConfig?.value || defaultPricing.accompanying_person,
      age_exemptions: ageExemptionsConfig?.value || defaultPricing.age_exemptions
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Pricing config fetch error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('PUT /api/admin/config/pricing - Starting')
    
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any).id) {
      console.log('Unauthorized: No session')
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    const adminUser = await User.findById((session.user as any).id)
    if (!adminUser || adminUser.role !== 'admin') {
      console.log('Forbidden: Not admin')
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 })
    }

    const body = await request.json()
    console.log('PUT /api/admin/config/pricing - Received body:', JSON.stringify(body, null, 2))
    
    const { registration_categories, workshops, accompanying_person, age_exemptions } = body
    
    console.log('Extracted fields:', {
      hasRegistrationCategories: !!registration_categories,
      hasWorkshops: !!workshops,
      hasAccompanyingPerson: !!accompanying_person,
      hasAgeExemptions: !!age_exemptions
    })

    // Update registration categories
    console.log('Updating registration_categories...')
    await Configuration.findOneAndUpdate(
      { type: 'pricing', key: 'registration_categories' },
      {
        type: 'pricing',
        key: 'registration_categories',
        value: registration_categories,
        isActive: true,
        createdBy: adminUser._id,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    )
    console.log('✓ Registration categories updated')

    // Update workshops
    console.log('Updating workshops...')
    await Configuration.findOneAndUpdate(
      { type: 'pricing', key: 'workshops' },
      {
        type: 'pricing',
        key: 'workshops',
        value: workshops,
        isActive: true,
        createdBy: adminUser._id,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    )
    console.log('✓ Workshops updated')

    // Update accompanying person pricing
    if (accompanying_person) {
      console.log('Updating accompanying_person...')
      await Configuration.findOneAndUpdate(
        { type: 'pricing', key: 'accompanying_person' },
        {
          type: 'pricing',
          key: 'accompanying_person',
          value: accompanying_person,
          isActive: true,
          createdBy: adminUser._id,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      )
      console.log('✓ Accompanying person updated')
    }

    // Update age exemptions
    if (age_exemptions) {
      console.log('Updating age_exemptions...')
      await Configuration.findOneAndUpdate(
        { type: 'pricing', key: 'age_exemptions' },
        {
          type: 'pricing',
          key: 'age_exemptions',
          value: age_exemptions,
          isActive: true,
          createdBy: adminUser._id,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      )
      console.log('✓ Age exemptions updated')
    }

    console.log('All pricing configurations updated successfully')
    return NextResponse.json({
      success: true,
      message: 'Pricing configuration updated successfully'
    })

  } catch (error) {
    console.error('Pricing config update error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.toString() : String(error)
    }, { status: 500 })
  }
}