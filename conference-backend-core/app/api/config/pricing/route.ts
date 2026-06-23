import { NextRequest, NextResponse } from 'next/server'
import { getPricingConfig, getWorkshopConfig, getActiveDiscounts } from '@/lib/config'

export async function GET(request: NextRequest) {
  try {
    const [pricing, workshops, discounts] = await Promise.all([
      getPricingConfig(),
      getWorkshopConfig(),
      getActiveDiscounts()
    ])

    return NextResponse.json({
      success: true,
      data: {
        pricing,
        workshops,
        discounts
      }
    })
  } catch (error) {
    console.error('Pricing API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch pricing configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}