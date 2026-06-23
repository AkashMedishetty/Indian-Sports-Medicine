import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import { generateRegistrationId } from '@/lib/utils/generateId'
import { EmailService } from '@/lib/email/service'
import Razorpay from 'razorpay'

// Initialize Razorpay only if credentials are available
let razorpay: Razorpay | null = null
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })
  }
} catch (error) {
  console.error('Failed to initialize Razorpay:', error)
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('=== AUTH/REGISTER ROUTE HIT ===')
  console.log('Timestamp:', new Date().toISOString())
  console.log('URL:', request.url)
  
  try {
    // Parse request body
    let body
    try {
      body = await request.json()
      console.log('📥 Request body parsed successfully')
      console.log('📋 Body keys:', Object.keys(body))
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return NextResponse.json({
        success: false,
        message: 'Invalid JSON in request body'
      }, { status: 400 })
    }
    
    const {
      email,
      password,
      profile,
      registration,
      payment
    } = body

    console.log('📧 Email:', email)
    console.log('👤 Profile:', JSON.stringify(profile, null, 2))
    console.log('📝 Registration:', JSON.stringify(registration, null, 2))
    console.log('💳 Payment method:', payment?.method)

    // Validate required fields
    if (!email || !password || !profile?.firstName || !profile?.lastName || !profile?.mciNumber) {
      console.log('❌ Missing required fields:', {
        email: !!email,
        password: !!password,
        firstName: !!profile?.firstName,
        lastName: !!profile?.lastName,
        mciNumber: !!profile?.mciNumber
      })
      return NextResponse.json({
        success: false,
        message: 'Missing required fields',
        details: {
          email: !email ? 'missing' : 'ok',
          password: !password ? 'missing' : 'ok',
          firstName: !profile?.firstName ? 'missing' : 'ok',
          lastName: !profile?.lastName ? 'missing' : 'ok',
          mciNumber: !profile?.mciNumber ? 'missing' : 'ok'
        }
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format:', email)
      return NextResponse.json({
        success: false,
        message: 'Invalid email format'
      }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      console.log('❌ Password too short:', password.length)
      return NextResponse.json({
        success: false,
        message: 'Password must be at least 8 characters long'
      }, { status: 400 })
    }

    // Connect to database
    console.log('🔌 Connecting to database...')
    try {
      await connectDB()
      console.log('✅ Database connected successfully')
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError)
      return NextResponse.json({
        success: false,
        message: 'Database connection failed',
        error: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 })
    }

    // Check if user already exists
    console.log('🔍 Checking for existing user...')
    const existingUser = await User.findOne({ 
      email: email.toLowerCase() 
    })

    if (existingUser) {
      // If user is in pending-payment status (abandoned gateway), reuse them
      if (existingUser.registration?.status === 'pending-payment' && payment?.method === 'pay-now') {
        console.log('🔄 Found pending-payment user, reusing:', email)
        
        // Update their profile and password in case they changed anything
        const hashedPw = await bcrypt.hash(password, 12)
        existingUser.password = hashedPw
        existingUser.profile = {
          title: profile.title,
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          age: profile.age ? parseInt(profile.age) : undefined,
          designation: profile.designation,
          specialization: profile.specialization || '',
          institution: profile.institution,
          address: {
            street: profile.address?.street || '',
            city: profile.address?.city || '',
            state: profile.address?.state || '',
            country: profile.address?.country || 'India',
            pincode: profile.address?.pincode || ''
          },
          dietaryRequirements: profile.dietaryRequirements || '',
          mciNumber: profile.mciNumber,
          hodFormUrl: profile.hodFormUrl || '',
          specialNeeds: profile.specialNeeds || ''
        } as any
        existingUser.registration.workshopSelections = registration?.workshopSelections || []
        existingUser.registration.accompanyingPersons = (registration?.accompanyingPersons || []).map((p: any) => ({
          name: p.name,
          relationship: p.relationship,
          dietaryRequirements: p.dietaryRequirements || '',
          age: p.age ?? 18
        }))
        if (registration?.accommodation?.required) {
          existingUser.registration.accommodation = {
            required: true,
            roomType: registration.accommodation.roomType,
            checkIn: registration.accommodation.checkIn,
            checkOut: registration.accommodation.checkOut,
            nights: registration.accommodation.nights || 0,
            totalAmount: registration.accommodation.totalAmount || 0
          }
        } else {
          existingUser.registration.accommodation = { required: false } as any
        }
        await existingUser.save()

        // Create new Razorpay order
        if (!razorpay) {
          return NextResponse.json({ success: false, message: 'Payment gateway not configured.' }, { status: 500 })
        }

        const amountInSmallestUnit = Math.round(payment.amount * 100)
        const orderOptions: any = {
          amount: amountInSmallestUnit,
          currency: 'INR',
          receipt: `receipt_${existingUser.registration.registrationId}_${Date.now()}`,
          notes: {
            registrationId: existingUser.registration.registrationId,
            userId: existingUser._id.toString(),
            email: email.toLowerCase(),
            name: `${profile.firstName} ${profile.lastName}`
          }
        }

        const order: any = await razorpay.orders.create(orderOptions)
        if (order && order.id) {
          await User.findByIdAndUpdate(existingUser._id, { 'payment.razorpayOrderId': order.id })
          console.log('✅ Reused pending-payment user, new Razorpay order:', order.id)

          return NextResponse.json({
            success: true,
            message: 'Registration created, complete payment to confirm',
            requiresPayment: true,
            data: {
              userId: existingUser._id,
              registrationId: existingUser.registration.registrationId,
              razorpayOrder: { id: order.id, amount: order.amount, currency: order.currency, receipt: order.receipt },
              razorpayKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
              pendingRegistration: {
                email: email.toLowerCase(),
                registrationId: existingUser.registration.registrationId,
                profile: { firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone }
              }
            }
          }, { status: 201 })
        }

        return NextResponse.json({ success: false, message: 'Failed to create payment order' }, { status: 500 })
      }

      console.log('❌ User already exists:', email)
      return NextResponse.json({
        success: false,
        message: 'User with this email already exists'
      }, { status: 409 })
    }
    console.log('✅ Email is available')

    // Hash password
    console.log('🔐 Hashing password...')
    const hashedPassword = await bcrypt.hash(password, 12)
    console.log('✅ Password hashed')

    // Generate unique registration ID
    console.log('🆔 Generating registration ID...')
    let registrationId
    try {
      registrationId = await generateRegistrationId()
      console.log('✅ Generated registration ID:', registrationId)
    } catch (idError) {
      console.error('❌ Failed to generate registration ID:', idError)
      return NextResponse.json({
        success: false,
        message: 'Failed to generate registration ID',
        error: idError instanceof Error ? idError.message : 'Unknown error'
      }, { status: 500 })
    }
    
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 10) {
      const existingReg = await User.findOne({ 
        'registration.registrationId': registrationId 
      })
      if (!existingReg) {
        isUnique = true
      } else {
        // Increment the number directly instead of regenerating
        // This handles race conditions where generateRegistrationId returns the same value
        const idMatch: RegExpMatchArray | null = registrationId.match(/^(.+)-(\d+)$/)
        if (idMatch) {
          const idPrefix: string = idMatch[1]
          const currentNum: number = parseInt(idMatch[2])
          registrationId = `${idPrefix}-${(currentNum + 1).toString().padStart(3, '0')}`
          console.log('🔄 Collision detected, trying:', registrationId)
        } else {
          registrationId = await generateRegistrationId()
        }
        attempts++
      }
    }

    if (!isUnique) {
      console.log('❌ Failed to generate unique registration ID after 10 attempts')
      return NextResponse.json({
        success: false,
        message: 'Failed to generate unique registration ID'
      }, { status: 500 })
    }

    // Create new user
    console.log('👤 Creating user with data:', {
      email: email.toLowerCase(),
      profile: profile,
      registration: registration
    })
    
    // Prepare user data
    const userData = {
      email: email.toLowerCase(),
      password: hashedPassword,
      profile: {
        title: profile.title,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        age: profile.age ? parseInt(profile.age) : undefined,
        designation: profile.designation,
        specialization: profile.specialization || '',
        institution: profile.institution,
        address: {
          street: profile.address?.street || '',
          city: profile.address?.city || '',
          state: profile.address?.state || '',
          country: profile.address?.country || 'India',
          pincode: profile.address?.pincode || ''
        },
        dietaryRequirements: profile.dietaryRequirements || '',
        mciNumber: profile.mciNumber,
        hodFormUrl: profile.hodFormUrl || '',
        specialNeeds: profile.specialNeeds || ''
      },
      registration: {
        registrationId,
        type: registration?.type || 'delegate',
        status: 'pending' as const,
        tier: body?.payment?.tier || body?.currentTier || undefined,
        membershipNumber: registration?.membershipNumber || '',
        workshopSelections: registration?.workshopSelections || [],
        accompanyingPersons: (registration?.accompanyingPersons || []).map((p: any) => ({
          name: p.name,
          relationship: p.relationship,
          dietaryRequirements: p.dietaryRequirements || '',
          age: p.age ?? 18
        })),
        accommodation: registration?.accommodation?.required ? {
          required: true,
          roomType: registration.accommodation.roomType,
          checkIn: registration.accommodation.checkIn,
          checkOut: registration.accommodation.checkOut,
          nights: registration.accommodation.nights || 0,
          totalAmount: registration.accommodation.totalAmount || 0
        } : { required: false },
        registrationDate: new Date()
      },
      payment: payment ? {
        method: payment.method || 'bank-transfer',
        status: 'pending' as const,
        amount: payment.amount || 0,
        bankTransferUTR: payment.bankTransferUTR,
        screenshotUrl: payment.screenshotUrl,
        paymentDate: new Date()
      } : undefined,
      role: 'user' as const,
      isActive: true
    }
    
    console.log('📝 User data prepared:', JSON.stringify(userData, null, 2))
    
    let newUser
    try {
      newUser = await User.create(userData)
      console.log('✅ User created successfully:', {
        id: newUser._id,
        email: newUser.email,
        registrationId: newUser.registration.registrationId
      })
    } catch (createError: any) {
      console.error('❌ Failed to create user:', createError)
      console.error('❌ Error name:', createError.name)
      console.error('❌ Error message:', createError.message)
      if (createError.errors) {
        console.error('❌ Validation errors:', JSON.stringify(createError.errors, null, 2))
      }
      return NextResponse.json({
        success: false,
        message: 'Failed to create user: ' + (createError.message || 'Unknown error'),
        validationErrors: createError.errors ? Object.keys(createError.errors).map(key => ({
          field: key,
          message: createError.errors[key].message
        })) : undefined
      }, { status: 500 })
    }

    // Book workshop seats immediately upon registration
    if (registration?.workshopSelections && registration.workshopSelections.length > 0) {
      console.log('🎫 Booking workshop seats for:', registration.workshopSelections)
      try {
        const Workshop = (await import('@/lib/models/Workshop')).default
        for (const workshopId of registration.workshopSelections) {
          // Atomically increment bookedSeats (only if not full or unlimited)
          const result = await Workshop.findOneAndUpdate(
            {
              id: workshopId,
              isActive: true,
              $or: [
                { maxSeats: 0 },  // Unlimited seats
                { $expr: { $lt: ['$bookedSeats', '$maxSeats'] } }  // Has available seats
              ]
            },
            { $inc: { bookedSeats: 1 } },
            { new: true }
          )
          if (result) {
            console.log(`✅ Seat booked for workshop: ${result.name} (${result.bookedSeats}/${result.maxSeats === 0 ? 'unlimited' : result.maxSeats})`)
          } else {
            console.warn(`⚠️ Could not book seat for workshop ${workshopId} - may be full or inactive`)
          }
        }
      } catch (workshopError) {
        console.error('⚠️ Error booking workshop seats (non-blocking):', workshopError)
        // Don't fail registration if workshop booking fails
      }
    }

    // Check payment method - if pay-now (gateway), create user with pending-payment status
    if (payment?.method === 'pay-now') {
      if (!razorpay) {
        console.error('❌ Razorpay not initialized - missing credentials')
        return NextResponse.json({
          success: false,
          message: 'Payment gateway not configured. Please use bank transfer.'
        }, { status: 500 })
      }
      
      try {
        // Update user status to pending-payment (user already created above)
        await User.findByIdAndUpdate(newUser._id, {
          'registration.status': 'pending-payment',
          'payment.status': 'pending'
        })
        console.log('✅ User status updated to pending-payment:', newUser.email)

        // Create Razorpay order
        const amountInSmallestUnit = Math.round(payment.amount * 100)
        console.log('💰 Creating Razorpay order for amount:', amountInSmallestUnit)

        const orderOptions: any = {
          amount: amountInSmallestUnit,
          currency: 'INR',
          receipt: `receipt_${registrationId}_${Date.now()}`,
          notes: {
            registrationId: registrationId,
            userId: newUser._id.toString(),
            email: email.toLowerCase(),
            name: `${profile.firstName} ${profile.lastName}`
          }
        }

        const order: any = await razorpay.orders.create(orderOptions)
        
        if (order && order.id) {
          console.log('✅ Razorpay order created:', order.id)

          // Store order ID in user record
          await User.findByIdAndUpdate(newUser._id, {
            'payment.razorpayOrderId': order.id
          })

          const elapsed = Date.now() - startTime
          console.log(`✅ Registration with payment completed in ${elapsed}ms`)

          return NextResponse.json({
            success: true,
            message: 'Registration created, complete payment to confirm',
            requiresPayment: true,
            data: {
              userId: newUser._id,
              registrationId: registrationId,
              razorpayOrder: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt
              },
              razorpayKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
              pendingRegistration: {
                email: email.toLowerCase(),
                registrationId: registrationId,
                profile: {
                  firstName: profile.firstName,
                  lastName: profile.lastName,
                  phone: profile.phone
                }
              }
            }
          }, { status: 201 })
        } else {
          console.error('❌ Failed to create Razorpay order: No order ID received')
          // Mark user as failed payment
          await User.findByIdAndUpdate(newUser._id, {
            'registration.status': 'payment-failed'
          })
          return NextResponse.json({
            success: false,
            message: 'Failed to create payment order'
          }, { status: 500 })
        }
      } catch (paymentError) {
        console.error('❌ Failed to create Razorpay order:', paymentError)
        // Mark user as failed payment
        await User.findByIdAndUpdate(newUser._id, {
          'registration.status': 'payment-failed'
        })
        return NextResponse.json({
          success: false,
          message: 'Failed to create payment order: ' + (paymentError instanceof Error ? paymentError.message : 'Unknown error')
        }, { status: 500 })
      }
    }

    // Send registration confirmation email (skip for complementary, sponsored, and gateway users)
    if (newUser.registration.paymentType !== 'complementary' && 
        newUser.registration.paymentType !== 'sponsored' &&
        payment?.method !== 'pay-now') {
      try {
        console.log('📧 Sending registration confirmation email...')
        // Fetch workshop details for email
        let workshopDetails: Array<{id: string, name: string}> = []
        if (registration?.workshopSelections && registration.workshopSelections.length > 0) {
          const Workshop = (await import('@/lib/models/Workshop')).default
          const workshops = await Workshop.find({ 
            id: { $in: registration.workshopSelections },
            isActive: true 
          })
          workshopDetails = workshops.map(w => ({ id: w.id, name: w.name }))
        }

        // Fetch registration type label from conference config
        const { conferenceConfig } = await import('@/conference-backend-core/config/conference.config')
        const registrationCategory = conferenceConfig.registration.categories.find(
          (cat: any) => cat.key === newUser.registration.type
        )
        const registrationTypeLabel = registrationCategory?.label || newUser.registration.type

        await EmailService.sendRegistrationConfirmation({
          userId: newUser._id.toString(),
          email: newUser.email,
          name: `${newUser.profile.firstName} ${newUser.profile.lastName}`,
          registrationId: newUser.registration.registrationId,
          registrationType: newUser.registration.type,
          registrationTypeLabel: registrationTypeLabel,
          workshopSelections: workshopDetails,
          accompanyingPersons: registration?.accompanyingPersons || [],
          accommodation: newUser.registration.accommodation?.required ? newUser.registration.accommodation : undefined
        })
        console.log('✅ Registration confirmation email sent')
      } catch (emailError) {
        console.error('⚠️ Failed to send registration email (non-blocking):', emailError)
        // Don't fail the registration if email fails
      }
    } else {
      console.log('ℹ️ Skipping confirmation email - will send after payment confirmation')
    }

    const elapsed = Date.now() - startTime
    console.log(`✅ Registration completed successfully in ${elapsed}ms`)

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data: {
        id: newUser._id,
        email: newUser.email,
        registrationId: newUser.registration.registrationId,
        name: `${newUser.profile.firstName} ${newUser.profile.lastName}`
      }
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Registration error:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('duplicate key') || error.message.includes('E11000')) {
        return NextResponse.json({
          success: false,
          message: 'Email address is already registered'
        }, { status: 409 })
      }
      
      if (error.message.includes('validation')) {
        return NextResponse.json({
          success: false,
          message: 'Validation error: ' + error.message
        }, { status: 400 })
      }
    }
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}