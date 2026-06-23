import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Configuration from '@/lib/models/Configuration'
import User from '@/lib/models/User'

export async function GET() {
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

    const config = await Configuration.findOne({
      type: 'pricing',
      key: 'accompanying_person',
      isActive: true
    })

    // Return the stored config or empty simple format
    const defaultConfig = {
      amount: 0,
      currency: 'INR'
    }

    return NextResponse.json({
      success: true,
      data: config?.value || defaultConfig
    })

  } catch (error) {
    console.error('Error fetching accompanying person config:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
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
    console.log('PUT /api/admin/config/accompanying-person - Received body:', JSON.stringify(body, null, 2))

    // Validate the structure - support both old and new formats
    if (!body.amount && !body.basePrice) {
      return NextResponse.json({
        success: false,
        message: 'Invalid configuration structure: missing amount or basePrice'
      }, { status: 400 })
    }

    if (!body.currency) {
      return NextResponse.json({
        success: false,
        message: 'Invalid configuration structure: missing currency'
      }, { status: 400 })
    }

    // Support new simple format (amount + currency) or old format (basePrice + tierPricing)
    const configData = {
      type: 'pricing',
      key: 'accompanying_person',
      value: body.tierPricing ? {
        // Old format with tier pricing
        basePrice: parseInt(body.basePrice),
        currency: body.currency,
        tierPricing: Object.fromEntries(
          Object.entries(body.tierPricing).map(([tier, price]) => [
            tier,
            parseInt(price as string)
          ])
        ),
        description: body.description || 'Pricing for accompanying persons by tier'
      } : {
        // New simple format
        amount: typeof body.amount === 'number' ? body.amount : parseInt(body.amount),
        currency: body.currency
      },
      isActive: true,
      updatedBy: adminUser._id,
      updatedAt: new Date()
    }

    console.log('Saving config data:', JSON.stringify(configData, null, 2))

    await Configuration.findOneAndUpdate(
      { type: 'pricing', key: 'accompanying_person' },
      configData,
      { upsert: true, new: true }
    )

    return NextResponse.json({
      success: true,
      message: 'Accompanying person pricing updated successfully'
    })

  } catch (error) {
    console.error('Error updating accompanying person config:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}