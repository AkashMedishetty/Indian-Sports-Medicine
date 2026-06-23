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
      type: 'badge', 
      key: 'badge_config' 
    })

    // Default badge configuration
    const defaultConfig = {
      enabled: true,
      template: {
        layout: 'portrait',
        size: 'A6',
        backgroundColor: '#ffffff',
        logoUrl: '',
        showQRCode: true,
        showPhoto: true
      },
      fields: {
        name: true,
        registrationId: true,
        institution: true,
        category: true,
        city: false,
        country: false
      },
      styling: {
        fontFamily: 'Arial',
        primaryColor: '#FCCA00',
        secondaryColor: '#000000',
        borderColor: '#e5e7eb'
      }
    }

    return NextResponse.json({
      success: true,
      data: config?.value || defaultConfig
    })
  } catch (error) {
    console.error('Get badge config error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch badge configuration'
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
      { type: 'badge', key: 'badge_config' },
      {
        type: 'badge',
        key: 'badge_config',
        value: body,
        isActive: true
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({
      success: true,
      data: config.value,
      message: 'Badge configuration updated successfully'
    })
  } catch (error) {
    console.error('Update badge config error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to update badge configuration'
    }, { status: 500 })
  }
}
