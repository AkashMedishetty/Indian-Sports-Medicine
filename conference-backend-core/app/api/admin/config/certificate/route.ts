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
      type: 'certificate', 
      key: 'certificate_config' 
    })

    // Default certificate configuration
    const defaultConfig = {
      enabled: true,
      template: {
        orientation: 'landscape',
        backgroundImageUrl: '',
        logoUrl: '',
        signatureUrl: ''
      },
      content: {
        title: 'CERTIFICATE OF PARTICIPATION',
        bodyText: 'This is to certify that {name} has successfully participated in the {conference} held from {startDate} to {endDate} at {location}.',
        footerText: '© 2026 NEUROVASCON. All rights reserved.',
        issuedByName: 'Dr. Conference Organizer',
        issuedByTitle: 'Conference Chair'
      },
      styling: {
        fontFamily: 'Georgia',
        titleFontSize: 32,
        bodyFontSize: 16,
        titleColor: '#1a1a1a',
        bodyColor: '#4a4a4a'
      },
      fields: {
        participantName: true,
        registrationId: true,
        eventDates: true,
        eventLocation: true,
        certificateNumber: true,
        issueDate: true
      }
    }

    return NextResponse.json({
      success: true,
      data: config?.value || defaultConfig
    })
  } catch (error) {
    console.error('Get certificate config error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch certificate configuration'
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
      { type: 'certificate', key: 'certificate_config' },
      {
        type: 'certificate',
        key: 'certificate_config',
        value: body,
        isActive: true
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({
      success: true,
      data: config.value,
      message: 'Certificate configuration updated successfully'
    })
  } catch (error) {
    console.error('Update certificate config error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to update certificate configuration'
    }, { status: 500 })
  }
}
