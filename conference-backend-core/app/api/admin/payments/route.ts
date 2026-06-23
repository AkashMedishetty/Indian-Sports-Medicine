import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Payment from '@/lib/models/Payment'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is admin
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    const adminUser = await User.findById((session.user as any).id)
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 })
    }

    // Fetch all payments with user details from Payment collection
    const payments = await Payment.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          registrationId: 1,
          razorpayOrderId: 1,
          razorpayPaymentId: 1,
          amount: 1,
          breakdown: 1,
          status: 1,
          transactionDate: 1,
          invoiceGenerated: 1,
          invoicePath: 1,
          userDetails: {
            name: {
              $concat: [
                { $ifNull: ['$user.profile.title', ''] },
                ' ',
                '$user.profile.firstName',
                ' ',
                '$user.profile.lastName'
              ]
            },
            email: '$user.email',
            phone: '$user.profile.phone',
            institution: '$user.profile.institution',
            registrationType: '$user.registration.type'
          }
        }
      },
      {
        $sort: { transactionDate: -1 }
      }
    ])

    // Clean up the name field (remove extra spaces)
    const cleanedPayments = payments.map(payment => ({
      ...payment,
      userDetails: {
        ...payment.userDetails,
        name: payment.userDetails.name.replace(/\s+/g, ' ').trim()
      }
    }))

    // Additionally include bank-transfer payments stored on User.payment
    const bankTransferUsers = await User.find({ 'payment.amount': { $exists: true } })
      .select('email profile registration payment')
      .lean()

    const userPayments = bankTransferUsers.map((u: any) => ({
      _id: `userpay_${u._id?.toString()}`,
      userId: u._id,
      registrationId: u.registration?.registrationId,
      razorpayOrderId: undefined,
      razorpayPaymentId: u.payment?.bankTransferUTR || u.payment?.transactionId,
      amount: { total: u.payment?.amount || 0, currency: 'INR' },
      breakdown: undefined,
      status: u.payment?.status || 'pending',
      transactionDate: u.payment?.paymentDate || u.registration?.paymentDate,
      invoiceGenerated: u.payment?.invoiceGenerated || false,
      invoicePath: undefined,
      userDetails: {
        name: `${u.profile?.title || ''} ${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.replace(/\s+/g, ' ').trim(),
        email: u.email,
        phone: u.profile?.phone,
        institution: u.profile?.institution,
        registrationType: u.registration?.type
      }
    }))

    const allPayments = [...cleanedPayments, ...userPayments]

    return NextResponse.json({
      success: true,
      data: allPayments
    })

  } catch (error) {
    console.error('Payments fetch error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}