import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import ConferenceConfig from '@/lib/models/ConferenceConfig'

// GET - Load current configuration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }
    
    await connectDB()
    
    // Get config (there should only be one document)
    let config = await ConferenceConfig.findOne()
    
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
    
    return NextResponse.json({
      success: true,
      data: config
    })
    
  } catch (error) {
    console.error('Config fetch error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch configuration'
    }, { status: 500 })
  }
}

// PUT - Update configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }
    
    const body = await request.json()
    
    await connectDB()
    
    // Update or create config
    const config = await ConferenceConfig.findOneAndUpdate(
      {},
      body,
      { new: true, upsert: true }
    )
    
    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      data: config
    })
    
  } catch (error) {
    console.error('Config update error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to update configuration'
    }, { status: 500 })
  }
}
