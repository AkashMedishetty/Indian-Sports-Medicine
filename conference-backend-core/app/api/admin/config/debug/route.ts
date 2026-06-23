import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Configuration from '@/lib/models/Configuration'
import User from '@/lib/models/User'

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

    // Get all pricing configurations
    const allPricingConfigs = await Configuration.find({
      type: 'pricing'
    })

    const result = {
      totalConfigs: allPricingConfigs.length,
      configs: allPricingConfigs.map(config => ({
        key: config.key,
        isActive: config.isActive,
        value: config.value,
        updatedAt: config.updatedAt
      }))
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Debug config fetch error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
