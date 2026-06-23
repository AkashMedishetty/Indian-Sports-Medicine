import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Configuration from '@/lib/models/Configuration'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    // Fetch general settings
    const settings = await Configuration.find({
      key: { $in: ['certificate_enabled', 'badge_enabled', 'workshop_registration_enabled', 'abstract_submission_enabled'] }
    })

    const settingsMap: Record<string, boolean> = {}
    settings.forEach(setting => {
      settingsMap[setting.key] = setting.value === true || setting.value === 'true'
    })

    return NextResponse.json({
      success: true,
      data: settingsMap
    })

  } catch (error) {
    console.error('Error fetching general settings:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const body = await request.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json(
        { success: false, message: 'Key is required' },
        { status: 400 }
      )
    }

    // Update or create configuration
    const setting = await Configuration.findOneAndUpdate(
      { key },
      { 
        key,
        value,
        type: 'general_settings',
        isActive: true,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({
      success: true,
      message: 'Setting updated successfully',
      data: setting
    })

  } catch (error) {
    console.error('Error updating general setting:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update setting' },
      { status: 500 }
    )
  }
}
