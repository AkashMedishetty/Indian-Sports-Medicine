import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Abstract from '@/lib/models/Abstract'
import Payment from '@/lib/models/Payment'
import Configuration from '@/lib/models/Configuration'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    // Fetch user data
    const user = await User.findOne({ email: session.user.email })
      .select('email profile registration role createdAt')
      .lean()

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch abstracts
    const abstracts = await Abstract.find({ userId: (user as any)._id })
      .select('title abstractId track status submittedAt')
      .sort({ submittedAt: -1 })
      .lean()

    // Fetch payments
    const payments = await Payment.find({ userId: (user as any)._id })
      .select('amount status transactionDate razorpayPaymentId invoiceGenerated invoicePath')
      .sort({ transactionDate: -1 })
      .lean()

    // Check if certificate generation is enabled
    let certificateEnabled = false
    try {
      const certConfig = await Configuration.findOne({ 
        key: 'certificate_enabled',
        isActive: true 
      })
      certificateEnabled = certConfig?.value === true || certConfig?.value === 'true'
    } catch (error) {
      console.log('Certificate config check failed, defaulting to false')
    }

    return NextResponse.json({
      success: true,
      data: {
        user,
        abstracts,
        payments,
        certificateEnabled
      }
    })
  } catch (error: any) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
