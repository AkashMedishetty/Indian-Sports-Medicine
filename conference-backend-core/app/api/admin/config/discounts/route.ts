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

    // Get discount configuration
    const discountConfig = await Configuration.findOne({ 
      type: 'discounts', 
      key: 'active_discounts' 
    })

    // Default discounts if not found
    const defaultDiscounts = {
      active_discounts: [
        {
          id: 'independence-day',
          name: 'Independence Day Special',
          type: 'time-based',
          percentage: 15,
          startDate: '2024-08-10',
          endDate: '2024-08-20',
          applicableCategories: ['regular', 'faculty'],
          isActive: true
        },
        {
          id: 'early-bird',
          name: 'Early Bird Discount',
          type: 'time-based',
          percentage: 10,
          endDate: '2024-07-31',
          applicableCategories: ['all'],
          isActive: true
        }
      ]
    }

    const result = discountConfig?.value || defaultDiscounts

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Discount config fetch error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()

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

    // Update discount configuration
    await Configuration.findOneAndUpdate(
      { type: 'discounts', key: 'active_discounts' },
      {
        type: 'discounts',
        key: 'active_discounts',
        value: body,
        isActive: true,
        createdBy: adminUser._id,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({
      success: true,
      message: 'Discount configuration updated successfully'
    })

  } catch (error) {
    console.error('Discount config update error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}