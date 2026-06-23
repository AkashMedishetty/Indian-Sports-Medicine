import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Configuration from '@/lib/models/Configuration'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const config = await Configuration.findOne({ 
      type: 'features', 
      key: 'feature_settings' 
    })

    // Default settings
    const defaultSettings = {
      abstractSubmission: true,
      workshopRegistration: true,
      paymentGateway: true,
      bankTransfer: true,
      accompanyingPersons: true,
      certificateGeneration: false
    }

    return NextResponse.json({
      success: true,
      data: config?.value || defaultSettings
    })
  } catch (error) {
    console.error('Get feature settings error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch feature settings'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    await connectDB()

    const config = await Configuration.findOneAndUpdate(
      { type: 'features', key: 'feature_settings' },
      {
        type: 'features',
        key: 'feature_settings',
        value: body,
        isActive: true
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({
      success: true,
      data: config.value,
      message: 'Feature settings updated successfully'
    })
  } catch (error) {
    console.error('Update feature settings error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to update feature settings'
    }, { status: 500 })
  }
}
