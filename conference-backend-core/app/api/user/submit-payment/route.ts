import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import { sendEmailWithHistory } from '@/conference-backend-core/lib/email/email-with-history'
import { logPaymentAction } from '@/conference-backend-core/lib/audit/service'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'

export async function POST(request: NextRequest) {
  console.log('=== USER SUBMIT-PAYMENT ROUTE HIT ===')
  console.log('Timestamp:', new Date().toISOString())
  
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    const userId = (session.user as any).id
    const body = await request.json()
    
    const {
      paymentMethod,
      bankTransferUTR,
      screenshotUrl,
      amount,
      workshopSelections,
      accompanyingPersons
    } = body

    console.log('📥 Payment submission received:', {
      userId,
      paymentMethod,
      bankTransferUTR: bankTransferUTR ? '***' : undefined,
      amount,
      workshopCount: workshopSelections?.length || 0,
      accompanyingCount: accompanyingPersons?.length || 0
    })

    // Fetch user
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 })
    }

    // Check if already paid
    if (user.registration?.status === 'paid' || user.registration?.status === 'confirmed') {
      return NextResponse.json({
        success: false,
        message: 'Registration is already confirmed'
      }, { status: 400 })
    }

    // Validate bank transfer UTR
    if (paymentMethod === 'bank-transfer') {
      if (!bankTransferUTR) {
        return NextResponse.json({
          success: false,
          message: 'UTR number is required for bank transfer'
        }, { status: 400 })
      }
      if (bankTransferUTR.length < 12) {
        return NextResponse.json({
          success: false,
          message: 'UTR number must be at least 12 characters'
        }, { status: 400 })
      }
    }

    // Validate accompanying persons
    if (accompanyingPersons && accompanyingPersons.length > 0) {
      for (let i = 0; i < accompanyingPersons.length; i++) {
        const person = accompanyingPersons[i]
        if (!person.name || !person.age || !person.relationship) {
          return NextResponse.json({
            success: false,
            message: `Incomplete details for accompanying person ${i + 1}`
          }, { status: 400 })
        }
      }
    }

    // Users can only ADD workshops, not remove existing ones
    const existingWorkshops = user.registration?.workshopSelections || []
    const newWorkshops = (workshopSelections || []).filter((w: string) => !existingWorkshops.includes(w))
    
    // Merge existing + new workshops (no removal allowed)
    const finalWorkshopSelections = [...existingWorkshops, ...newWorkshops]

    // Update user record
    const updateData: any = {
      'registration.workshopSelections': finalWorkshopSelections,
      'registration.accompanyingPersons': (accompanyingPersons || []).map((p: any) => ({
        name: p.name,
        relationship: p.relationship,
        dietaryRequirements: p.dietaryRequirements || '',
        age: p.age
      })),
      'payment.method': paymentMethod,
      'payment.amount': amount || 0,
      'payment.status': 'pending',
      'payment.paymentDate': new Date()
    }

    if (paymentMethod === 'bank-transfer' && bankTransferUTR) {
      updateData['payment.bankTransferUTR'] = bankTransferUTR
    }

    if (screenshotUrl) {
      updateData['payment.screenshotUrl'] = screenshotUrl
    }

    await User.findByIdAndUpdate(userId, updateData)
    console.log('✅ User payment info updated')

    // Book seats for NEW workshops only
    if (newWorkshops.length > 0) {
      console.log('🎫 Booking seats for new workshops:', newWorkshops)
      try {
        const Workshop = (await import('@/lib/models/Workshop')).default
        for (const workshopId of newWorkshops) {
          const result = await Workshop.findOneAndUpdate(
            {
              id: workshopId,
              isActive: true,
              $or: [
                { maxSeats: 0 },  // Unlimited seats
                { $expr: { $lt: ['$bookedSeats', '$maxSeats'] } }
              ]
            },
            { $inc: { bookedSeats: 1 } },
            { new: true }
          )
          if (result) {
            console.log(`✅ Seat booked for workshop: ${result.name} (${result.bookedSeats}/${result.maxSeats === 0 ? 'unlimited' : result.maxSeats})`)
          }
        }
      } catch (workshopError) {
        console.error('⚠️ Error booking workshop seats:', workshopError)
      }
    }

    // Log the payment action
    try {
      await logPaymentAction(
        { 
          userId: user._id.toString(), 
          email: user.email, 
          role: 'user' 
        },
        'payment.initiated',
        user._id.toString(),
        user.registration.registrationId,
        { 
          ip: request.headers.get('x-forwarded-for') || 'unknown', 
          userAgent: request.headers.get('user-agent') || ''
        },
        {
          paymentMethod,
          amount,
          utrPrefix: bankTransferUTR?.substring(0, 4) || '',
          description: `Bank transfer payment submitted - UTR: ${bankTransferUTR?.substring(0, 4)}***`
        }
      )
      console.log('✅ Payment action logged')
    } catch (logError) {
      console.error('⚠️ Failed to log payment action:', logError)
    }

    // Send confirmation email
    try {
      const workshopNames = workshopSelections?.length > 0 
        ? workshopSelections.join(', ') 
        : 'None'
      
      const accompanyingNames = accompanyingPersons?.length > 0
        ? accompanyingPersons.map((p: any) => `${p.name} (${p.relationship})`).join(', ')
        : 'None'

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a365d;">Payment Details Submitted</h2>
          <p>Dear ${user.profile.title} ${user.profile.firstName} ${user.profile.lastName},</p>
          <p>Thank you for submitting your payment details for <strong>${conferenceConfig.shortName}</strong>.</p>
          
          <div style="background: #f7fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Registration Details</h3>
            <p><strong>Registration ID:</strong> ${user.registration.registrationId}</p>
            <p><strong>Registration Type:</strong> ${user.registration.type}</p>
            <p><strong>Status:</strong> <span style="color: #d69e2e;">Pending Verification</span></p>
          </div>
          
          <div style="background: #ebf8ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Payment Details</h3>
            <p><strong>Amount:</strong> ₹${amount?.toLocaleString() || 0}</p>
            <p><strong>Payment Method:</strong> Bank Transfer</p>
            <p><strong>UTR Number:</strong> ${bankTransferUTR || 'N/A'}</p>
          </div>
          
          ${workshopSelections?.length > 0 ? `
          <div style="background: #f0fff4; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Workshop Selections</h3>
            <p>${workshopNames}</p>
          </div>
          ` : ''}
          
          ${accompanyingPersons?.length > 0 ? `
          <div style="background: #faf5ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Accompanying Persons</h3>
            <p>${accompanyingNames}</p>
          </div>
          ` : ''}
          
          <div style="background: #fffaf0; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ed8936;">
            <h3 style="margin-top: 0; color: #c05621;">⏳ What's Next?</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Our team will verify your bank transfer within 2-3 business days</li>
              <li>You will receive a confirmation email once your payment is verified</li>
              <li>Your registration status will be updated to "Confirmed"</li>
            </ul>
          </div>
          
          <p>If you have any questions, please contact us at <a href="mailto:${conferenceConfig.contact.email}">${conferenceConfig.contact.email}</a></p>
          
          <p>Best regards,<br>${conferenceConfig.shortName} Team</p>
        </div>
      `

      await sendEmailWithHistory({
        to: user.email,
        subject: `${conferenceConfig.shortName} - Payment Details Submitted`,
        html: emailHtml,
        text: `Payment details submitted for ${conferenceConfig.shortName}. Registration ID: ${user.registration.registrationId}. Amount: ₹${amount}. UTR: ${bankTransferUTR}. Our team will verify your payment within 2-3 business days.`,
        userId: user._id,
        userName: `${user.profile.firstName} ${user.profile.lastName}`,
        templateName: 'payment-submitted',
        category: 'payment'
      })
      console.log('✅ Confirmation email sent')
    } catch (emailError) {
      console.error('⚠️ Failed to send confirmation email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Payment details submitted successfully',
      data: {
        registrationId: user.registration.registrationId,
        status: 'pending',
        paymentMethod,
        amount
      }
    })

  } catch (error) {
    console.error('❌ Submit payment error:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}
