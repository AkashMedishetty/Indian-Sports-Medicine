import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Payment from '@/lib/models/Payment'
import { EmailService } from '@/lib/email/service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    if (!adminUser || !['admin', 'manager'].includes(adminUser.role)) {
      return NextResponse.json({
        success: false,
        message: 'Admin or Manager access required'
      }, { status: 403 })
    }

    const { remarks } = await request.json()

    // Find the user to approve
    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 })
    }

    // Update payment status to verified
    if (user.payment) {
      user.payment.status = 'verified'
      user.payment.verifiedBy = adminUser.email
      user.payment.verificationDate = new Date()
      user.payment.invoiceGenerated = true  // Mark invoice as ready
      if (remarks) {
        user.payment.remarks = remarks
      }
    }

    // Update registration status to confirmed
    user.registration.status = 'confirmed'
    user.registration.paymentDate = new Date()

    await user.save()

    // Send confirmation email with stored payment breakdown
    try {
      // Fetch registration type label from conference config
      const { conferenceConfig } = await import('@/conference-backend-core/config/conference.config')
      const registrationCategory = conferenceConfig.registration.categories.find(
        (cat: any) => cat.key === user.registration.type
      )
      const registrationTypeLabel = registrationCategory?.label || user.registration.type
      
      // Fetch payment record for proper breakdown
      const payment = await Payment.findOne({ userId: user._id }).sort({ createdAt: -1 })
      
      if (payment) {
        await EmailService.sendPaymentConfirmation({
          userId: user._id.toString(),
          email: user.email,
          name: `${user.profile.firstName} ${user.profile.lastName}`,
          registrationId: user.registration.registrationId,
          amount: payment.amount.total,
          currency: payment.amount.currency,
          transactionId: payment.razorpayPaymentId || 'BANK-TRANSFER',
          paymentDate: payment.transactionDate.toLocaleDateString('en-IN'),
          breakdown: {
            ...payment.breakdown,
            registrationTypeLabel: registrationTypeLabel,
            registration: payment.amount.registration,
            workshops: payment.amount.workshops,
            accompanyingPersons: payment.amount.accompanyingPersons,
            discount: payment.amount.discount
          }
        })
      } else {
        // Fallback for embedded payment data
        await EmailService.sendPaymentConfirmation({
          userId: user._id.toString(),
          email: user.email,
          name: `${user.profile.firstName} ${user.profile.lastName}`,
          registrationId: user.registration.registrationId,
          amount: user.payment?.amount || 0,
          currency: 'INR',
          transactionId: user.payment?.transactionId || 'BANK-TRANSFER',
          paymentDate: new Date().toLocaleDateString('en-IN'),
          breakdown: {
            registrationType: user.registration.type,
            registrationTypeLabel: registrationTypeLabel,
            baseAmount: user.payment?.amount || 0,
            registration: user.payment?.amount || 0,
            workshopFees: [],
            workshops: 0,
            accompanyingPersonCount: 0,
            accompanyingPersonDetails: [],
            accompanyingPersons: 0,
            accompanyingPersonFees: 0,
            discount: 0,
            discountsApplied: [],
            paymentMethod: 'bank_transfer'
          }
        })
      }
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError)
      // Don't fail the approval if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Registration approved successfully',
      data: {
        id: user._id,
        email: user.email,
        registrationId: user.registration.registrationId,
        paymentStatus: user.payment?.status,
        registrationStatus: user.registration.status
      }
    })

  } catch (error) {
    console.error('Approval error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
