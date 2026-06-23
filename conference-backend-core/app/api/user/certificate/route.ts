import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Configuration from '@/lib/models/Configuration'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    // Get certificate configuration
    const certificateConfig = await Configuration.findOne({
      type: 'certificate',
      key: 'certificate_config'
    })

    console.log('Certificate config found:', !!certificateConfig)
    console.log('Certificate enabled:', certificateConfig?.value?.enabled)
    console.log('Certificate has elements:', certificateConfig?.value?.elements?.length || 0)

    if (!certificateConfig || !certificateConfig.value) {
      return NextResponse.json({
        success: false,
        message: 'Certificate template not configured'
      }, { status: 404 })
    }

    // Check if certificate is enabled by admin
    if (!certificateConfig.value.enabled) {
      return NextResponse.json({
        success: false,
        message: 'Certificate is not yet available'
      }, { status: 404 })
    }

    // Check if certificate has elements configured
    if (!certificateConfig.value.elements || certificateConfig.value.elements.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Certificate template has no elements configured'
      }, { status: 404 })
    }

    // Get user data
    const userId = (session.user as any).id
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
    const actualWidth = certificateConfig.value.template?.width || 1100
    const actualHeight = certificateConfig.value.template?.height || 850

    // Prepare certificate data for rendering
    const certificateData = {
      template: {
        backgroundImage: {
          url: certificateConfig.value.template?.backgroundImageUrl || '',
          width: actualWidth,
          height: actualHeight
        },
        dimensions: {
          width: actualWidth,
          height: actualHeight
        },
        logoUrl: certificateConfig.value.template?.logoUrl || '',
        signatureUrl: certificateConfig.value.template?.signatureUrl || '',
        elements: (certificateConfig.value.elements || []).map((el: any) => ({
          id: el.id,
          type: el.type,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          content: el.content,
          fontSize: el.fontSize || 16,
          fontFamily: el.fontFamily,
          fontWeight: 'bold',
          color: el.color,
          align: el.align || 'center',
          label: el.label
        })),
        settings: {
          backgroundColor: certificateConfig.value.template?.backgroundColor || '#ffffff',
          orientation: certificateConfig.value.template?.orientation || 'landscape'
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
        category: userData.registration?.category || '',
        city: userData.profile?.city || '',
        country: userData.profile?.country || ''
      }
    }

    return NextResponse.json({
      success: true,
      data: certificateData
    })

  } catch (error) {
    console.error('Certificate generation error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to generate certificate',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
