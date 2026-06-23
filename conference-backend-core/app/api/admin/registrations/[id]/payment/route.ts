import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import  connectDB  from "@/lib/mongodb"
import User from "@/lib/models/User"
import Payment from "@/lib/models/Payment"
import { EmailService } from "@/lib/email/service"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const userRole = (session.user as any)?.role
    if (!['admin', 'manager'].includes(userRole)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    await connectDB()

    const { id } = await params
    const body = await request.json()
    const { 
      status, 
      paymentType, 
      sponsorName, 
      sponsorCategory, 
      paymentRemarks, 
      amount 
    } = body

    const updateData: any = {
      'registration.status': status,
      'registration.paymentType': paymentType,
      'registration.paymentRemarks': paymentRemarks
    }

    if (status === 'paid') {
      updateData['registration.paymentDate'] = new Date().toISOString()
    }

    if (paymentType === 'sponsored') {
      updateData['registration.sponsorName'] = sponsorName
      updateData['registration.sponsorCategory'] = sponsorCategory
      // Mirror into embedded payment (zero amount, verified)
      updateData['payment'] = {
        method: 'cash',
        status: status === 'paid' ? 'verified' : 'pending',
        amount: 0,
        transactionId: `ADMIN-SPONSORED-${Date.now()}`,
        paymentDate: new Date().toISOString(),
        remarks: paymentRemarks
      }
    } else if (paymentType === 'complementary') {
      // Complementary: zero amount, verified
      updateData['payment'] = {
        method: 'cash',
        status: status === 'paid' ? 'verified' : 'pending',
        amount: 0,
        transactionId: `ADMIN-COMPLEMENTARY-${Date.now()}`,
        paymentDate: new Date().toISOString(),
        remarks: paymentRemarks
      }
    } else if (amount > 0) {
      // Regular manual payment update: treat as bank transfer
      // Require UTR/transaction id for regular payments
      const bodyJson = body as any
      if (!bodyJson.bankTransferUTR && !bodyJson.transactionId) {
        return NextResponse.json(
          { success: false, message: "UTR/Transaction ID is required for regular bank-transfer payments" },
          { status: 400 }
        )
      }
      updateData['payment'] = {
        method: 'bank-transfer',
        status: status === 'paid' ? 'verified' : 'pending',
        amount,
        paymentDate: new Date().toISOString(),
        remarks: paymentRemarks,
        bankTransferUTR: bodyJson.bankTransferUTR,
        transactionId: bodyJson.transactionId
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Registration not found" },
        { status: 404 }
      )
    }

    // Calculate payment amount for both payment record and email
    const shouldMarkCompleted = status === 'paid'
    const paymentAmount = typeof amount === 'number' && amount > 0 ? amount : (user.payment?.amount || 0)
    const registrationType = user.registration?.type || 'consultant'

    // Also mirror/update a Payment record for easier reporting and invoicing
    try {

      // Create a synthetic order id for manual/admin payments
      const orderId = `ADMIN-${paymentType || 'regular'}-${Date.now()}-${user._id}`

      await Payment.create({
        userId: user._id,
        registrationId: user.registration?.registrationId || 'N/A',
        type: 'registration',  // Explicitly set type for registration payments
        razorpayOrderId: orderId,
        razorpayPaymentId: user.payment?.transactionId || orderId,
        amount: {
          registration: paymentAmount,
          workshops: 0,
          accompanyingPersons: 0,
          discount: 0,
          total: paymentAmount,
          currency: 'INR'
        },
        breakdown: {
          registrationType,
          baseAmount: paymentAmount,
          workshopFees: [],
          accompanyingPersonFees: 0,
          discountsApplied: []
        },
        status: shouldMarkCompleted ? 'completed' : 'pending',
        paymentMethod: 'bank-transfer',
        transactionDate: new Date(),
        invoiceGenerated: false
      })
    } catch (paymentMirrorError) {
      console.warn('Admin payment mirror skipped:', paymentMirrorError)
    }

    // Send automatic confirmation email when payment is marked as paid
    if (status === 'paid') {
      try {
        const userName = user.profile?.firstName && user.profile?.lastName 
          ? `${user.profile.firstName} ${user.profile.lastName}`
          : user.profile?.name || 'User'
        
        // Calculate payment breakdown if not available
        const breakdown = user.payment?.breakdown || user.paymentInfo?.breakdown || {
          registration: paymentAmount,
          gst: 0,
          workshops: 0,
          accompanyingPersons: 0,
          accommodation: 0,
          discount: 0
        };
        
        const emailResult = await EmailService.sendRegistrationAcceptance({
          userId: user._id.toString(),
          email: user.email,
          name: userName,
          registrationId: user.registration?.registrationId || 'N/A',
          registrationType: user.registration?.type || 'cvsi-member',
          amount: paymentAmount,
          currency: 'INR',
          transactionId: user.payment?.transactionId || user.payment?.bankTransferUTR || 'N/A',
          workshopSelections: user.registration?.workshopSelections || [],
          accompanyingPersons: user.registration?.accompanyingPersons?.length || 0,
          accompanyingPersonsDetails: user.registration?.accompanyingPersons || [],
          accommodation: user.registration?.accommodation?.required ? user.registration.accommodation : undefined,
          breakdown: breakdown,
          tier: user.registration?.tier,
          paymentMethod: user.payment?.method,
          paymentDate: user.payment?.paymentDate || user.payment?.verificationDate,
          phone: user.profile?.phone,
          address: user.profile?.address,
          mciNumber: user.profile?.mciNumber
        })
        
        if (emailResult.success) {
          console.log(`Registration confirmation email sent to ${user.email}`)
        } else {
          console.error(`Failed to send email to ${user.email}:`, (emailResult as any).error)
        }
      } catch (emailError) {
        console.error('Error sending automatic confirmation email:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment status updated successfully",
      data: user
    })

  } catch (error) {
    console.error("Update payment error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}