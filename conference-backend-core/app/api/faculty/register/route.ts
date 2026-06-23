import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import bcrypt from 'bcryptjs'
import { generateRegistrationId } from '@/lib/utils/generateId'
import { sendEmailWithHistory } from '@/conference-backend-core/lib/email/email-with-history'
import { logAction } from '@/conference-backend-core/lib/audit/service'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'
import { getRegistrationConfirmationTemplate } from '@/conference-backend-core/lib/email/templates'

export async function POST(request: NextRequest) {
  console.log('=== FACULTY REGISTER ROUTE HIT ===')
  
  try {
    await connectDB()

    const body = await request.json()
    const {
      title, firstName, lastName, email, phone, age,
      password, institution, mciNumber, specialization,
      address, city, state, country, pincode,
      dietaryRequirements, specialNeeds,
      accompanyingPersons,
      accommodationRequired, accommodationRoomType,
      accommodationCheckIn, accommodationCheckOut,
      payment: paymentData
    } = body

    // Validate required fields
    const missing: string[] = []
    if (!firstName?.trim()) missing.push('firstName')
    if (!lastName?.trim()) missing.push('lastName')
    if (!email?.trim()) missing.push('email')
    if (!phone?.trim()) missing.push('phone')
    if (!institution?.trim()) missing.push('institution')
    if (!mciNumber?.trim()) missing.push('mciNumber')
    if (!password || password.length < 8) missing.push('password (min 8 chars)')
    if (!city?.trim()) missing.push('city')
    if (!state?.trim()) missing.push('state')

    if (missing.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`
      }, { status: 400 })
    }

    // Check email uniqueness
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() })
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'This email is already registered. Please login instead.'
      }, { status: 409 })
    }

    const registrationId = await generateRegistrationId()
    const hashedPassword = await bcrypt.hash(password, 12)

    // Determine payment status based on accompanying persons and accommodation
    const hasAccompanying = accompanyingPersons && accompanyingPersons.length > 0
    const hasAccommodation = accommodationRequired && accommodationRoomType && accommodationCheckIn && accommodationCheckOut
    const needsPayment = hasAccompanying || hasAccommodation
    const status = needsPayment ? 'pending-payment' : 'confirmed'
    const paymentType = needsPayment ? 'pending' : 'complimentary'

    // Calculate accommodation details
    let accommodationData: any = { required: false }
    let accommodationCharge = 0
    if (hasAccommodation) {
      const checkIn = new Date(accommodationCheckIn)
      const checkOut = new Date(accommodationCheckOut)
      const nights = Math.max(0, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)))
      const perNight = accommodationRoomType === 'single' ? 10000 : 7500
      accommodationCharge = nights * perNight
      accommodationData = {
        required: true,
        roomType: accommodationRoomType,
        checkIn: accommodationCheckIn,
        checkOut: accommodationCheckOut,
        nights,
        totalAmount: accommodationCharge
      }
    }

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'user',
      profile: {
        title: title || 'Dr.',
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        age: age ? parseInt(age) : undefined,
        designation: 'Faculty',
        specialization: specialization || '',
        institution: institution.trim(),
        mciNumber: mciNumber.trim(),
        address: {
          street: address || '',
          city: city.trim(),
          state: state.trim(),
          country: country || 'India',
          pincode: pincode || ''
        },
        dietaryRequirements: dietaryRequirements || '',
        specialNeeds: specialNeeds || ''
      },
      registration: {
        registrationId,
        type: 'faculty',
        status,
        paymentType,
        registrationDate: new Date(),
        source: 'normal',
        accompanyingPersons: (accompanyingPersons || []).map((p: any) => ({
          name: p.name?.trim(),
          age: p.age || 0,
          relationship: p.relationship || 'Other',
          dietaryRequirements: p.dietaryRequirements || ''
        })),
        accommodation: accommodationData
      },
      payment: needsPayment && paymentData ? {
        method: 'bank-transfer',
        status: 'pending',
        amount: paymentData.amount || 0,
        bankTransferUTR: paymentData.bankTransferUTR || '',
        screenshotUrl: paymentData.screenshotUrl || ''
      } : undefined,
      isActive: true
    })

    // Log the registration
    await logAction({
      actor: { userId: user._id.toString(), email: email.toLowerCase(), role: 'user' },
      action: 'registration.created',
      resourceType: 'registration',
      resourceId: user._id.toString(),
      resourceName: registrationId,
      metadata: {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || ''
      },
      description: `Faculty registration created${needsPayment ? ' (payment pending)' : ' (complimentary)'}`
    })

    // Send confirmation email using the same template as delegate registration
    const fullName = `${title || 'Dr.'} ${firstName} ${lastName}`.trim()
    const emailHtml = getRegistrationConfirmationTemplate({
      name: fullName,
      email: email.toLowerCase(),
      registrationId,
      registrationType: 'faculty',
      registrationTypeLabel: 'Faculty',
      accompanyingPersons: hasAccompanying ? accompanyingPersons : undefined,
      accommodation: hasAccommodation ? accommodationData : undefined,
      paymentMethod: needsPayment ? undefined : 'payment_gateway' // Use 'payment_gateway' to show "Confirmed" status when no payment needed
    })

    await sendEmailWithHistory({
      to: email.toLowerCase(),
      subject: `${conferenceConfig.shortName} - Faculty Registration ${needsPayment ? '(Payment Pending)' : 'Confirmed'}`,
      html: emailHtml,
      text: `Faculty Registration ID: ${registrationId}. ${needsPayment ? 'Payment pending for accompanying persons/accommodation.' : 'Registration confirmed.'}`,
      userId: user._id,
      userName: fullName,
      templateName: 'faculty-registration',
      category: 'registration'
    })

    return NextResponse.json({
      success: true,
      message: 'Faculty registration successful',
      data: {
        registrationId,
        name: fullName,
        status,
        paymentAmount: paymentData?.amount || 0,
        accommodationCharge
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Faculty registration error:', error)
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'Email already registered.' }, { status: 409 })
    }
    return NextResponse.json({
      success: false,
      message: `Registration failed: ${error.message}`
    }, { status: 500 })
  }
}
