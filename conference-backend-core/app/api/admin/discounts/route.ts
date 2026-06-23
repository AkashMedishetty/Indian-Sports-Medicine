import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Configuration from '@/lib/models/Configuration'

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    // Check if user is admin
    const user = await User.findById((session.user as any).id)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Access denied'
      }, { status: 403 })
    }

    // Fetch discount configurations
    const discountConfig = await Configuration.findOne({
      type: 'discounts',
      key: 'active_discounts',
      isActive: true
    })

    const discounts = discountConfig?.value || []

    return NextResponse.json({
      success: true,
      data: discounts
    })

  } catch (error) {
    console.error('Discount fetch error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    // Check if user is admin
    const user = await User.findById((session.user as any).id)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Access denied'
      }, { status: 403 })
    }

    const body = await request.json()
    const { discount } = body

    // Validate discount data
    if (!discount.id || !discount.name || !discount.type || !discount.percentage) {
      return NextResponse.json({
        success: false,
        message: 'Missing required discount fields'
      }, { status: 400 })
    }

    // Fetch existing discount configuration
    let discountConfig = await Configuration.findOne({
      type: 'discounts',
      key: 'active_discounts'
    })

    if (!discountConfig) {
      // Create new discount configuration
      discountConfig = new Configuration({
        type: 'discounts',
        key: 'active_discounts',
        value: [],
        isActive: true,
        createdBy: user._id
      })
    }

    // Add or update discount
    const existingIndex = discountConfig.value.findIndex((d: any) => d.id === discount.id)
    
    if (existingIndex >= 0) {
      discountConfig.value[existingIndex] = discount
    } else {
      discountConfig.value.push(discount)
    }

    await discountConfig.save()

    return NextResponse.json({
      success: true,
      message: 'Discount saved successfully',
      data: discount
    })

  } catch (error) {
    console.error('Discount save error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    // Check if user is admin
    const user = await User.findById((session.user as any).id)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Access denied'
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const discountId = searchParams.get('id')

    if (!discountId) {
      return NextResponse.json({
        success: false,
        message: 'Discount ID required'
      }, { status: 400 })
    }

    // Fetch discount configuration
    const discountConfig = await Configuration.findOne({
      type: 'discounts',
      key: 'active_discounts'
    })

    if (!discountConfig) {
      return NextResponse.json({
        success: false,
        message: 'Discount configuration not found'
      }, { status: 404 })
    }

    // Remove discount
    discountConfig.value = discountConfig.value.filter((d: any) => d.id !== discountId)
    await discountConfig.save()

    return NextResponse.json({
      success: true,
      message: 'Discount deleted successfully'
    })

  } catch (error) {
    console.error('Discount delete error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}