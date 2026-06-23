import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Configuration from '@/lib/models/Configuration'
import { conferenceConfig, getEmailSubject } from '@/config/conference.config'

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

    const adminUser = await User.findOne({ email: session.user.email })
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 })
    }

    // Get email configuration
    const emailConfig = await Configuration.findOne({ 
      type: 'settings', 
      key: 'email_settings' 
    })

    // Default email configuration - uses conferenceConfig values
    const defaultEmailConfig = {
      fromName: process.env.APP_NAME || conferenceConfig.email.fromName,
      fromEmail: process.env.SMTP_USER || conferenceConfig.email.replyTo,
      replyTo: process.env.SMTP_USER || conferenceConfig.contact.email,
      templates: {
        registration: {
          enabled: true,
          subject: getEmailSubject('Registration Confirmation')
        },
        payment: {
          enabled: true,
          subject: getEmailSubject('Payment Confirmation & Invoice')
        },
        passwordReset: {
          enabled: true,
          subject: getEmailSubject('Password Reset')
        },
        bulkEmail: {
          enabled: true,
          subject: getEmailSubject('Conference Update')
        }
      },
      rateLimiting: {
        batchSize: 10,
        delayBetweenBatches: 1000
      }
    }

    const result = emailConfig?.value || defaultEmailConfig

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Email config fetch error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    const adminUser = await User.findOne({ email: session.user.email })
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 })
    }

    const body = await request.json()

    // Update email configuration
    await Configuration.findOneAndUpdate(
      { type: 'settings', key: 'email_settings' },
      {
        type: 'settings',
        key: 'email_settings',
        value: body,
        isActive: true,
        createdBy: adminUser._id,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({
      success: true,
      message: 'Email configuration updated successfully'
    })

  } catch (error) {
    console.error('Email config update error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}