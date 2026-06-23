import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Configuration from '@/lib/models/Configuration'

/**
 * GET /api/user/badge
 * Fetches the configured badge template and current user's data
 */
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
    const userId = (session.user as any).id

    // Get badge configuration from admin
    const badgeConfig = await Configuration.findOne({ 
      type: 'badge', 
      key: 'badge_config' 
    })

    console.log('Badge config found:', !!badgeConfig)
    console.log('Badge config value:', badgeConfig?.value ? 'exists' : 'missing')
    console.log('Badge enabled:', badgeConfig?.value?.enabled)
    console.log('Badge has elements:', badgeConfig?.value?.elements?.length || 0)

    if (!badgeConfig || !badgeConfig.value) {
      return NextResponse.json({ 
        success: false, 
        message: 'Badge template not configured' 
      }, { status: 404 })
    }

    // Allow even if not explicitly enabled (admin might have saved without toggling)
    if (!badgeConfig.value.elements || badgeConfig.value.elements.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Badge template has no elements configured' 
      }, { status: 404 })
    }

    // Get user data
    const user = await User.findById(userId)
      .select('profile registration email')
      .lean()

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 })
    }

    // Cast user to any to access nested properties (following codebase pattern)
    const userData = user as any

    // Use actual template dimensions saved from uploaded image
    const actualWidth = badgeConfig.value.template?.width || 600
    const actualHeight = badgeConfig.value.template?.height || 800

    // Prepare badge data for rendering
    const badgeData = {
      template: {
        backgroundImage: {
          url: badgeConfig.value.template?.logoUrl || '',
          width: actualWidth,
          height: actualHeight
        },
        dimensions: {
          width: actualWidth,
          height: actualHeight
        },
        elements: (badgeConfig.value.elements || []).map((el: any) => ({
          id: el.id,
          type: el.type === 'qr' ? 'qrcode' : el.type === 'text' ? 'field' : el.type,
          x: el.x, // Use actual coordinates from designer
          y: el.y,
          width: el.width,
          height: el.height,
          text: el.content,
          fontSize: el.fontSize || 16,
          fontFamily: el.fontFamily,
          fontWeight: 'bold',
          color: el.color,
          align: 'center',
          fieldName: el.content?.replace('{', '').replace('}', ''), // Extract field name
          qrData: el.type === 'qr' ? 'registrationId' : undefined
        })),
        settings: {
          backgroundColor: badgeConfig.value.template?.backgroundColor || '#ffffff'
        }
      },
      user: {
        registrationId: userData.registration?.registrationId || 'N/A',
        fullName: `${userData.profile?.title || ''} ${userData.profile?.firstName || ''} ${userData.profile?.lastName || ''}`.trim(),
        title: userData.profile?.title || '',
        firstName: userData.profile?.firstName || '',
        lastName: userData.profile?.lastName || '',
        institution: userData.profile?.institution || '',
        designation: userData.profile?.designation || '',
        email: userData.email || '',
        phone: userData.profile?.phone || '',
        category: userData.registration?.type || '',
        city: userData.profile?.city || '',
        country: userData.profile?.country || '',
        profilePicture: userData.profile?.profilePicture || ''
      }
    }

    return NextResponse.json({
      success: true,
      data: badgeData
    })

  } catch (error: any) {
    console.error('Error fetching badge data:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to load badge data' 
    }, { status: 500 })
  }
}
