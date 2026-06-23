import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import { conferenceConfig, getEmailSubject } from "@/config/conference.config"

export async function POST(
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
    const { type, subject, message, templateData } = body

    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Registration not found" },
        { status: 404 }
      )
    }

    // Send email (skip for complementary and sponsored users)
    if (user.registration.paymentType === 'complementary' || user.registration.paymentType === 'sponsored') {
      return NextResponse.json({
        success: false,
        message: "Email sending is disabled for complementary and sponsored registrations"
      })
    }

    try {
      const { EmailService } = await import('@/lib/email/service')
      
      const userName = `${user.profile.firstName} ${user.profile.lastName}`
      
      // Handle different email types
      switch (type) {
        case 'paymentReminder':
          await EmailService.sendPaymentReminder({
            userId: user._id.toString(),
            email: user.email,
            name: userName,
            registrationId: user.registration.registrationId,
            registrationType: user.registration.type,
            daysOverdue: templateData?.daysOverdue,
            amount: templateData?.amount,
            currency: templateData?.currency || 'INR'
          })
          break
          
        case 'customMessage':
          await EmailService.sendCustomMessage({
            userId: user._id.toString(),
            email: user.email,
            recipientName: userName,
            subject: subject || getEmailSubject('Message'),
            content: message || '',
            senderName: templateData?.senderName || `${conferenceConfig.shortName} Team`
          })
          break
          
        case 'registrationConfirmation':
          // Use the same template as verified imports - includes invoice and QR code
          const paymentAmount = user.payment?.amount || user.paymentInfo?.amount || 0
          
          // Calculate payment breakdown if not available
          const breakdown = user.payment?.breakdown || user.paymentInfo?.breakdown || {
            registration: paymentAmount,
            workshops: 0,
            accompanyingPersons: 0,
            discount: 0
          };
          
          await EmailService.sendRegistrationAcceptance({
            userId: user._id.toString(),
            email: user.email,
            name: userName,
            registrationId: user.registration.registrationId,
            registrationType: user.registration.type,
            amount: paymentAmount,
            currency: 'INR',
            transactionId: user.payment?.transactionId || user.payment?.bankTransferUTR || 'N/A',
            workshopSelections: user.registration.workshopSelections || [],
            accompanyingPersons: user.registration.accompanyingPersons?.length || 0,
            accompanyingPersonsDetails: user.registration.accompanyingPersons || [],
            accommodation: user.registration.accommodation?.required ? user.registration.accommodation : undefined,
            breakdown: breakdown,
            tier: user.registration.tier,
            paymentMethod: user.payment?.method,
            paymentDate: user.payment?.paymentDate || user.payment?.verificationDate,
            phone: user.profile?.phone,
            address: user.profile?.address,
            mciNumber: user.profile?.mciNumber
          })
          break
          
        default:
          // Use bulk email service for general emails
          await EmailService.sendBulkEmail({
            recipients: [{ email: user.email, userId: user._id.toString(), name: userName }],
            subject: subject || getEmailSubject('Registration Update'),
            content: message || `Thank you for registering for ${conferenceConfig.name}.`,
            senderName: `${conferenceConfig.shortName} Team`
          })
          break
      }

      return NextResponse.json({
        success: true,
        message: "Email sent successfully"
      })

    } catch (emailError) {
      console.error('Email sending error:', emailError)
      return NextResponse.json(
        { success: false, message: "Failed to send email" },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("Send email error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}