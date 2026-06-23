import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Configuration from '@/lib/models/Configuration'
import { EmailService } from '@/lib/email/service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const userRole = (session.user as any)?.role
    if (!['admin', 'manager'].includes(userRole)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const { id } = await params

    // Get user registration
    const user = await User.findById(id)
      .select('email profile registration')
      .lean() as any

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Check if certificate is configured and enabled
    const certificateConfig = await Configuration.findOne({
      type: 'certificate',
      key: 'certificate_config'
    })

    if (!certificateConfig || !certificateConfig.value || !certificateConfig.value.enabled) {
      return NextResponse.json(
        { success: false, message: 'Certificate system is not configured or enabled' },
        { status: 400 }
      )
    }

    // Prepare user data for certificate email
    const userData = {
      userId: id,
      name: `${user.profile?.title || ''} ${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim(),
      registrationId: user.registration?.registrationId || 'N/A',
      category: user.registration?.type || user.registration?.category || 'participant'
    }

    // Send certificate email
    try {
      await EmailService.sendBulkTemplateEmail({
        to: user.email,
        subject: 'Your Participation Certificate is Available',
        template: 'certificate',
        userData
      })

      console.log(`✅ Certificate sent successfully to ${user.email}`)

      return NextResponse.json({
        success: true,
        message: 'Certificate sent successfully'
      })
    } catch (emailError: any) {
      console.error('❌ Failed to send certificate email:', emailError)
      return NextResponse.json(
        { 
          success: false, 
          message: `Failed to send certificate: ${emailError.message || 'Unknown error'}` 
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Send certificate error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to send certificate' 
      },
      { status: 500 }
    )
  }
}
