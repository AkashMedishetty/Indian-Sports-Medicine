import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Configuration from '@/lib/models/Configuration'

export async function GET() {
  try {
    await connectDB()

    // Get payment methods configuration
    const paymentConfig = await Configuration.findOne({
      type: 'payment',
      key: 'methods',
      isActive: true
    })

    // Default to bank transfer only if no config found
    const config = paymentConfig?.value || {
      gateway: false,
      bankTransfer: true,
      externalRedirect: false,
      externalRedirectUrl: '',
      bankDetails: {
        accountName: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        branch: '',
        qrCodeUrl: ''
      }
    }

    return NextResponse.json({
      success: true,
      data: config
    })

  } catch (error) {
    console.error('Payment methods fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const body = await request.json()
    const { gateway, bankTransfer, externalRedirect, externalRedirectUrl, maintenanceMode, bankDetails } = body

    // Update or create configuration
    const paymentConfig = await Configuration.findOneAndUpdate(
      {
        type: 'payment',
        key: 'methods'
      },
      {
        type: 'payment',
        key: 'methods',
        value: {
          gateway: gateway || false,
          bankTransfer: bankTransfer !== false, // Default true
          externalRedirect: externalRedirect || false,
          externalRedirectUrl: externalRedirectUrl || '',
          maintenanceMode: maintenanceMode || false,
          bankDetails: bankDetails || {}
        },
        isActive: true
      },
      {
        upsert: true,
        new: true
      }
    )

    return NextResponse.json({
      success: true,
      data: paymentConfig.value
    })

  } catch (error) {
    console.error('Payment methods save error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
