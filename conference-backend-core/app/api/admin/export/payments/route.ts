import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Payment from '@/lib/models/Payment'

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

    const adminUser = await User.findById((session.user as any).id)
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 })
    }

    // Fetch all payments with user details
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
        $sort: { transactionDate: -1 }
      }
    ])

    // Generate CSV content
    const csvHeaders = [
      'Transaction ID',
      'Registration ID',
      'User Name',
      'Email',
      'Institution',
      'Registration Type',
      'Total Amount',
      'Currency',
      'Registration Fee',
      'Workshop Fees',
      'Accompanying Person Fees',
      'Discount Applied',
      'Workshops',
      'Discounts',
      'Payment Status',
      'Transaction Date',
      'Razorpay Payment ID',
      'Razorpay Order ID',
      'Invoice Generated'
    ]

    const csvRows = payments.map(payment => [
      payment._id.toString(),
      payment.registrationId,
      `${payment.user.profile.title || ''} ${payment.user.profile.firstName} ${payment.user.profile.lastName}`.trim(),
      payment.user.email,
      payment.user.profile.institution || '',
      payment.breakdown.registrationType,
      payment.amount.total,
      payment.amount.currency,
      payment.amount.registration || payment.breakdown.baseAmount,
      payment.amount.workshops || 0,
      payment.amount.accompanyingPersons || 0,
      payment.amount.discount || 0,
      payment.breakdown.workshopFees?.map((w: any) => w.name).join('; ') || '',
      payment.breakdown.discountsApplied?.map((d: any) => `${d.type}${d.code ? ` (${d.code})` : ''}: ${d.percentage}%`).join('; ') || '',
      payment.status,
      new Date(payment.transactionDate).toLocaleString(),
      payment.razorpayPaymentId,
      payment.razorpayOrderId,
      payment.invoiceGenerated ? 'Yes' : 'No'
    ])

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => 
        row.map(field => 
          typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))
            ? `"${field.replace(/"/g, '""')}"` // Escape quotes and wrap in quotes
            : field
        ).join(',')
      )
    ].join('\n')

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="payments-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Payment export error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}