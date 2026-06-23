import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Payment from '@/lib/models/Payment'
import Configuration from '@/lib/models/Configuration'
import PendingPayment from '@/lib/models/PendingPayment'
import { EmailService } from '@/lib/email/service'
import { sendEmail } from '@/conference-backend-core/lib/email/smtp'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import mongoose from 'mongoose'
import paymentAttempts from '@/conference-backend-core/lib/payment/attempts'
import { logPaymentError } from '@/conference-backend-core/lib/errors/service'
import { logPaymentAction } from '@/conference-backend-core/lib/audit/service'
import { calculateGST } from '@/conference-backend-core/lib/utils/gst'

// Razorpay is initialized per-request to always pick up current env vars
function getRazorpayInstance(): Razorpay | null {
  try {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      })
    }
  } catch (error) {
    console.error('Failed to initialize Razorpay:', error)
  }
  return null
}

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

// Helper function to execute with retry
async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`Attempt ${attempt}/${maxRetries} failed:`, lastError.message)
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt))
      }
    }
  }
  
  throw lastError
}

// Function to recalculate payment breakdown based on user data
async function recalculatePaymentBreakdown(user: any, totalAmount: number, currency: string) {
  try {
    // Fetch pricing from database
    const pricingConfigs = await Configuration.find({
      type: 'pricing',
      isActive: true
    })

    // Build pricing data from database
    let registrationCategories: any = {}
    let accompanyingPersonFeeFromDB: number | null = null
    let currentTierName = 'regular'

    pricingConfigs.forEach(config => {
      if (config.key === 'pricing_tiers') {
        // Determine current active tier based on date
        const currentDate = new Date()
        const tiers = config.value
        
        // Use IST (UTC+5:30) for date comparison
        const nowIST = new Date(currentDate.getTime() + (5.5 * 60 * 60 * 1000))
        const todayDateIST = nowIST.toISOString().split('T')[0]
        
        // Check each tier to find the active one
        for (const [tierKey, tierData] of Object.entries(tiers)) {
          if (tierKey === 'specialOffers') continue
          
          const tier = tierData as any
          if (!tier.isActive) continue
          
          const startDate = tier.startDate ? new Date(tier.startDate).toISOString().split('T')[0] : null
          const endDate = tier.endDate ? new Date(tier.endDate).toISOString().split('T')[0] : null
          
          const isInDateRange = (!startDate || todayDateIST >= startDate) && 
                               (!endDate || todayDateIST <= endDate)
          
          if (isInDateRange && tier.categories) {
            registrationCategories = tier.categories
            currentTierName = tier.name || tierKey
            console.log('📊 Active pricing tier:', currentTierName, `(${tier.startDate} to ${tier.endDate})`)
            break
          }
        }
        
        // If no active tier found, use regular as fallback
        if (Object.keys(registrationCategories).length === 0 && tiers.regular?.categories) {
          registrationCategories = tiers.regular.categories
          currentTierName = tiers.regular.name || 'regular'
          console.log('📊 Using regular tier as fallback')
        }
      }
      
      if (config.key === 'accompanying_person') {
        // Get accompanying person fee based on current tier
        if (config.value?.tierPricing) {
          // Try to match current tier name to tier pricing
          const tierKey = currentTierName.toLowerCase().replace(/\s+/g, '')
          if (config.value.tierPricing[tierKey]) {
            accompanyingPersonFeeFromDB = config.value.tierPricing[tierKey]
          } else if (config.value.tierPricing.regular) {
            accompanyingPersonFeeFromDB = config.value.tierPricing.regular
          } else if (config.value.tierPricing.earlyBird) {
            accompanyingPersonFeeFromDB = config.value.tierPricing.earlyBird
          }
        } else if (config.value?.amount) {
          accompanyingPersonFeeFromDB = config.value.amount
        }
      }
    })

    // Database pricing is required - no fallback
    if (Object.keys(registrationCategories).length === 0) {
      console.error('❌ CRITICAL: No registration categories found in database!')
      console.error('❌ Please configure pricing in admin panel or check pricing_tiers configuration')
      throw new Error('Registration pricing not configured in database. Please contact administrator.')
    }
    console.log('📊 Using database pricing configuration')

    // Fetch workshops from Workshop collection
    let workshopsData: Array<{id: string, name: string, amount: number}> = []
    try {
      const Workshop = (await import('@/lib/models/Workshop')).default
      const workshopDocs = await Workshop.find({ isActive: true })
      workshopsData = workshopDocs.map((w: any) => ({
        id: w.id,
        name: w.name,
        amount: w.price
      }))
    } catch (error) {
      console.error('Error fetching workshops:', error)
    }

    // Get accompanying person fee - database only
    let accompanyingPersonFee = accompanyingPersonFeeFromDB || 0
    if (accompanyingPersonFeeFromDB === null) {
      console.warn('⚠️ WARNING: No accompanying person fee found in database, using 0')
    } else {
      console.log('📊 Accompanying person fee from database:', accompanyingPersonFee)
    }

    // Calculate base registration fee from database or config
    const registrationType = user.registration.type || 'non-member'
    const registrationCategory = registrationCategories[registrationType]
    const baseAmount = registrationCategory?.amount || 0
    
    // Get label from conference.config.ts (static labels)
    const { conferenceConfig } = await import('@/config/conference.config')
    const registrationCategoryFromConfig = conferenceConfig.registration.categories.find(
      (cat: any) => cat.key === registrationType
    )
    const registrationTypeLabel = registrationCategoryFromConfig?.label || registrationCategory?.label || registrationType
    
    console.log('📊 Registration type:', registrationType, '| Base amount:', baseAmount, '| Label:', registrationTypeLabel, '| Source: Database')

    // Calculate workshop fees - match by ID not name
    let workshopFees: Array<{ name: string; amount: number }> = []
    let totalWorkshopFees = 0

    if (user.registration.workshopSelections && user.registration.workshopSelections.length > 0) {
      user.registration.workshopSelections.forEach((workshopId: string) => {
        const workshop = workshopsData.find(w => w.id === workshopId)
        if (workshop) {
          workshopFees.push({
            name: workshop.name,
            amount: workshop.amount
          })
          totalWorkshopFees += workshop.amount
        }
      })
    }

    // Calculate accompanying person fees
    let accompanyingPersonCount = 0
    let accompanyingPersonDetails: Array<{name: string, age: number}> = []
    
    if (user.registration.accompanyingPersons && user.registration.accompanyingPersons.length > 0) {
      // Filter out children under age threshold
      const ageExemptionsConfig = await Configuration.findOne({
        type: 'pricing',
        key: 'age_exemptions'
      })
      const childrenUnderAge = ageExemptionsConfig?.value?.children_under_age || 10
      
      user.registration.accompanyingPersons.forEach((person: any) => {
        if (person.age >= childrenUnderAge) {
          accompanyingPersonCount++
          accompanyingPersonDetails.push({
            name: person.name,
            age: person.age
          })
        }
      })
    }
    
    const accompanyingPersonFees = accompanyingPersonCount * accompanyingPersonFee

    // Calculate accommodation fees
    let accommodationFees = 0
    if (user.registration.accommodation?.required && user.registration.accommodation.totalAmount) {
      accommodationFees = user.registration.accommodation.totalAmount
    }

    // Calculate GST (18% on all fees: registration + workshops + accompanying persons + accommodation)
    const preGstTotal = baseAmount + totalWorkshopFees + accompanyingPersonFees + accommodationFees
    const gstAmount = calculateGST(preGstTotal)

    // Calculate discounts (placeholder for future discount implementation)
    let totalDiscount = 0
    const appliedDiscounts: Array<{
      type: string
      code?: string
      percentage: number
      amount: number
    }> = []

    return {
      amount: {
        total: totalAmount,
        currency: currency,
        registration: baseAmount,
        gst: gstAmount,
        gstPercentage: 18,
        workshops: totalWorkshopFees,
        accompanyingPersons: accompanyingPersonFees,
        accommodation: accommodationFees,
        discount: totalDiscount
      },
      breakdown: {
        registrationType: registrationType,
        registrationTypeLabel: registrationTypeLabel,
        baseAmount: baseAmount,
        gst: gstAmount,
        gstPercentage: 18,
        workshopFees: workshopFees,
        accompanyingPersonCount: accompanyingPersonCount,
        accompanyingPersonDetails: accompanyingPersonDetails,
        accompanyingPersonFees: accompanyingPersonFees,
        accommodation: user.registration.accommodation || null,
        accommodationFees: accommodationFees,
        discountsApplied: appliedDiscounts,
        paymentMethod: 'payment_gateway'
      }
    }
  } catch (error) {
    console.error('Error recalculating payment breakdown:', error)
    // Return basic breakdown if calculation fails
    return {
      amount: {
        total: totalAmount,
        currency: currency,
        registration: totalAmount,
        gst: 0,
        gstPercentage: 18,
        workshops: 0,
        accompanyingPersons: 0,
        discount: 0
      },
      breakdown: {
        registrationType: user.registration.type || 'regular',
        baseAmount: totalAmount,
        gst: 0,
        gstPercentage: 18,
        workshopFees: [],
        accompanyingPersonFees: 0,
        discountsApplied: []
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, pendingRegistration } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({
        success: false,
        message: 'Missing payment details'
      }, { status: 400 })
    }

    await connectDB()

    // Verify signature
    const body_string = razorpay_order_id + '|' + razorpay_payment_id
    const expected_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body_string)
      .digest('hex')

    if (expected_signature !== razorpay_signature) {
      return NextResponse.json({
        success: false,
        message: 'Invalid payment signature'
      }, { status: 400 })
    }

    // Initialize Razorpay fresh for this request
    const razorpay = getRazorpayInstance()

    // Check if Razorpay is initialized
    if (!razorpay) {
      return NextResponse.json({
        success: false,
        message: 'Payment gateway not configured'
      }, { status: 500 })
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id)
    const order = await razorpay.orders.fetch(razorpay_order_id)

    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return NextResponse.json({
        success: false,
        message: 'Payment not successful'
      }, { status: 400 })
    }

    let user: any = null

    // First, try to find user by order ID (new flow - user created with pending-payment status)
    user = await User.findOne({ 'payment.razorpayOrderId': razorpay_order_id })
    
    if (user) {
      console.log('Found existing user with pending payment:', user.email)
      
      // Use transaction with retry for atomic payment status update
      await executeWithRetry(async () => {
        const session = await mongoose.startSession()
        session.startTransaction()
        
        try {
          // Update user status atomically
          await User.findByIdAndUpdate(
            user._id,
            {
              'registration.status': 'paid',
              'registration.paymentType': 'online',
              'payment.status': 'verified',
              'payment.transactionId': razorpay_payment_id,
              'payment.paymentDate': new Date()
            },
            { session }
          )
          
          await session.commitTransaction()
          console.log('✅ Payment status updated atomically')
        } catch (error) {
          await session.abortTransaction()
          throw error
        } finally {
          session.endSession()
        }
      })
      
      // Refresh user data after transaction
      user = await User.findById(user._id)
      
      console.log('✅ User payment verified:', {
        id: user._id,
        email: user.email,
        registrationId: user.registration.registrationId
      })

      // Skip registration confirmation email — payment confirmation email
      // is sent by the common code at the bottom of this route
      console.log('ℹ️ Skipping registration email for gateway payment — payment confirmation will be sent')
    } else if (pendingRegistration) {
      // Legacy flow - pendingRegistration data passed from frontend
      console.log('Creating user after successful payment (legacy flow):', pendingRegistration.email)
      
      try {
        // Hash password if provided as plain text
        const bcrypt = (await import('bcryptjs')).default
        const hashedPassword = pendingRegistration.password.startsWith('$2') 
          ? pendingRegistration.password 
          : await bcrypt.hash(pendingRegistration.password, 12)

        // Generate registration ID
        const { generateRegistrationId } = await import('@/lib/utils/generateId')
        let registrationId = pendingRegistration.registrationId
        if (!registrationId) {
          registrationId = await generateRegistrationId()
          // Ensure uniqueness
          let isUnique = false
          let attempts = 0
          while (!isUnique && attempts < 10) {
            const existingReg = await User.findOne({ 'registration.registrationId': registrationId })
            if (!existingReg) {
              isUnique = true
            } else {
              registrationId = await generateRegistrationId()
              attempts++
            }
          }
        }

        // Create the user NOW after payment is verified
        user = await User.create({
          email: pendingRegistration.email,
          password: hashedPassword,
          profile: {
            title: pendingRegistration.profile.title,
            firstName: pendingRegistration.profile.firstName,
            lastName: pendingRegistration.profile.lastName,
            phone: pendingRegistration.profile.phone,
            age: pendingRegistration.profile.age ? parseInt(pendingRegistration.profile.age) : undefined,
            designation: pendingRegistration.profile.designation,
            specialization: pendingRegistration.profile.specialization || '',
            institution: pendingRegistration.profile.institution,
            address: {
              street: pendingRegistration.profile.address?.street || '',
              city: pendingRegistration.profile.address?.city || '',
              state: pendingRegistration.profile.address?.state || '',
              country: pendingRegistration.profile.address?.country || 'India',
              pincode: pendingRegistration.profile.address?.pincode || ''
            },
            dietaryRequirements: pendingRegistration.profile.dietaryRequirements || '',
            mciNumber: pendingRegistration.profile.mciNumber,
            hodFormUrl: pendingRegistration.profile.hodFormUrl || '',
            specialNeeds: pendingRegistration.profile.specialNeeds || ''
          },
          registration: {
            registrationId,
            type: pendingRegistration.registration?.type || 'non-member',
            status: 'paid',
            paymentType: 'online',
            tier: pendingRegistration.payment?.tier || undefined,
            membershipNumber: pendingRegistration.registration?.membershipNumber || '',
            workshopSelections: pendingRegistration.registration?.workshopSelections || [],
            accompanyingPersons: (pendingRegistration.registration?.accompanyingPersons || []).map((p: any) => ({
              name: p.name,
              relationship: p.relationship,
              dietaryRequirements: p.dietaryRequirements || '',
              age: p.age ?? 18
            })),
            accommodation: pendingRegistration.registration?.accommodation?.required ? {
              required: true,
              roomType: pendingRegistration.registration.accommodation.roomType,
              checkIn: pendingRegistration.registration.accommodation.checkIn,
              checkOut: pendingRegistration.registration.accommodation.checkOut,
              nights: pendingRegistration.registration.accommodation.nights || 0,
              totalAmount: pendingRegistration.registration.accommodation.totalAmount || 0
            } : { required: false },
            registrationDate: new Date()
          },
          payment: {
            method: 'pay-now',
            status: 'verified',
            amount: pendingRegistration.payment?.amount || 0,
            transactionId: razorpay_payment_id,
            paymentDate: new Date()
          },
          role: 'user',
          isActive: true
        })

        console.log('✅ User created successfully after payment:', {
          id: user._id,
          email: user.email,
          registrationId: user.registration.registrationId
        })

        // Book workshop seats after successful payment + user creation
        if (pendingRegistration.registration?.workshopSelections?.length > 0) {
          console.log('🎫 Booking workshop seats for:', pendingRegistration.registration.workshopSelections)
          try {
            const WorkshopModel = (await import('@/lib/models/Workshop')).default
            for (const workshopId of pendingRegistration.registration.workshopSelections) {
              const result = await WorkshopModel.findOneAndUpdate(
                {
                  id: workshopId,
                  isActive: true,
                  $or: [
                    { maxSeats: 0 },
                    { $expr: { $lt: ['$bookedSeats', '$maxSeats'] } }
                  ]
                },
                { $inc: { bookedSeats: 1 } },
                { new: true }
              )
              if (result) {
                console.log(`✅ Seat booked: ${result.name} (${result.bookedSeats}/${result.maxSeats === 0 ? 'unlimited' : result.maxSeats})`)
              }
            }
          } catch (wsError) {
            console.error('⚠️ Workshop seat booking error (non-blocking):', wsError)
          }
        }

        // Skip registration confirmation email here — payment confirmation email
        // is sent by the common code at the bottom of this route
        console.log('ℹ️ Skipping registration email for gateway payment — payment confirmation will be sent')
      } catch (userCreationError) {
        // CRITICAL: Payment succeeded but user creation failed
        console.error('❌ CRITICAL: Payment successful but user creation failed:', userCreationError)
        
        const errorMessage = userCreationError instanceof Error ? userCreationError.message : 'Unknown error'
        const supportEmail = conferenceConfig.contact.supportEmail || conferenceConfig.contact.email
        
        // Create a pending payment record with registration data for manual recovery
        let pendingPaymentRecord: any = null
        try {
          pendingPaymentRecord = await PendingPayment.create({
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            amount: Number(payment.amount) / 100,
            currency: payment.currency.toUpperCase(),
            pendingRegistration: pendingRegistration,
            status: 'payment_successful_user_creation_failed',
            error: errorMessage,
            createdAt: new Date()
          })
          console.log('✅ Pending payment record created for manual recovery')
        } catch (pendingError) {
          console.error('❌ Failed to create pending payment record:', pendingError)
        }

        // Send alert email to support team asynchronously (don't wait for response)
        // Wrapped in IIFE to properly handle the promise without blocking
        (async () => {
          try {
            await sendEmail({
              to: supportEmail,
              subject: `🚨 URGENT: Payment Successful but Registration Failed - ${razorpay_payment_id}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #dc2626; border-bottom: 3px solid #dc2626; padding-bottom: 10px;">
                    🚨 CRITICAL: Manual Intervention Required
                  </h2>
                  
                  <div style="background: #fee; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-weight: bold;">Payment was successful but user registration failed in the database.</p>
                  </div>

                  <h3>Payment Details:</h3>
                  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr style="background: #f5f5f5;">
                      <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Payment ID</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">${razorpay_payment_id}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Order ID</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">${razorpay_order_id}</td>
                    </tr>
                    <tr style="background: #f5f5f5;">
                      <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Amount</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">₹${Number(payment.amount) / 100} ${payment.currency.toUpperCase()}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Payment Status</td>
                      <td style="padding: 10px; border: 1px solid #ddd; color: #16a34a; font-weight: bold;">✅ SUCCESSFUL</td>
                    </tr>
                    <tr style="background: #f5f5f5;">
                      <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">User Creation</td>
                      <td style="padding: 10px; border: 1px solid #ddd; color: #dc2626; font-weight: bold;">❌ FAILED</td>
                    </tr>
                  </table>

                  <h3>User Details:</h3>
                  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr style="background: #f5f5f5;">
                      <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Name</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">${pendingRegistration.profile.firstName} ${pendingRegistration.profile.lastName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Email</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">${pendingRegistration.email}</td>
                    </tr>
                    <tr style="background: #f5f5f5;">
                      <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Phone</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">${pendingRegistration.profile.phone}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Registration ID</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">${pendingRegistration.registrationId}</td>
                    </tr>
                    <tr style="background: #f5f5f5;">
                      <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Registration Type</td>
                      <td style="padding: 10px; border: 1px solid #ddd;">${pendingRegistration.registration?.type || 'non-member'}</td>
                    </tr>
                  </table>

                  <h3>Error Details:</h3>
                  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace; margin: 20px 0;">
                    ${errorMessage}
                  </div>

                  <h3>Action Required:</h3>
                  <ol style="line-height: 1.8;">
                    <li>Check the database for PendingPayment record: <code>${pendingPaymentRecord?._id || 'N/A'}</code></li>
                    <li>Verify the payment in Razorpay dashboard</li>
                    <li>Manually create user from saved pendingRegistration data</li>
                    <li>Mark PendingPayment as resolved</li>
                    <li>Send confirmation email to user</li>
                  </ol>

                  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>⚠️ Important:</strong> User has been notified that payment was successful and team will contact them.</p>
                  </div>

                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                  <p style="color: #666; font-size: 12px;">
                    <strong>Conference System Alert</strong><br>
                    ${conferenceConfig.name}<br>
                    ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </p>
                </div>
              `
            })
            console.log('✅ Alert email sent to support team:', supportEmail)
          } catch (emailError) {
            console.error('❌ Failed to send alert email to support:', emailError)
          }
        })()

        // Return error but indicate payment was successful
        return NextResponse.json({
          success: false,
          paymentSuccessful: true,
          message: 'Payment was successful but registration could not be completed. Our team will contact you shortly to complete your registration.',
          support: {
            email: supportEmail,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id
          }
        }, { status: 500 })
      }
    } else {
      // Normal flow - user already exists (for logged-in users paying later)
      const session = await getServerSession(authOptions)
      if (!session?.user?.email) {
        return NextResponse.json({
          success: false,
          message: 'Unauthorized - user must exist or pending registration data must be provided'
        }, { status: 401 })
      }

      user = await User.findOne({ email: session.user.email })
      if (!user) {
        return NextResponse.json({
          success: false,
          message: 'User not found'
        }, { status: 404 })
      }
    }

    // Check if payment already exists OR find existing pending payment
    let existingPayment = await Payment.findOne({ razorpayPaymentId: razorpay_payment_id })
    if (existingPayment && existingPayment.status === 'completed') {
      return NextResponse.json({
        success: false,
        message: 'Payment already processed'
      }, { status: 400 })
    }
    
    // Check for pending workshop addon payment by order ID
    if (!existingPayment) {
      existingPayment = await Payment.findOne({ razorpayOrderId: razorpay_order_id, status: 'pending' })
    }

    // Calculate payment breakdown (re-calculate to ensure accuracy)
    const amount = Number(payment.amount) / 100 // Convert from smallest unit
    const currency = payment.currency.toUpperCase()

    let paymentRecord: any = null
    let isWorkshopAddon = false

    // Update existing payment or create new one
    if (existingPayment) {
      // Update existing pending payment (workshop addon)
      existingPayment.razorpayPaymentId = razorpay_payment_id
      existingPayment.razorpaySignature = razorpay_signature
      existingPayment.status = 'completed'
      existingPayment.paymentMethod = payment.method
      existingPayment.transactionDate = new Date(payment.created_at * 1000)
      existingPayment.invoiceGenerated = true
      
      await existingPayment.save()
      paymentRecord = existingPayment
      isWorkshopAddon = existingPayment.type === 'workshop-addon'
      
      console.log(`Payment updated: ${paymentRecord.type} - ${paymentRecord._id}`)
    } else {
      // Create new payment record (registration payment)
      const calculationData = await recalculatePaymentBreakdown(user, amount, currency)
      
      console.log('💾 Payment breakdown being saved to DB:', JSON.stringify(calculationData.breakdown, null, 2))
      console.log('💾 Payment amount being saved to DB:', JSON.stringify(calculationData.amount, null, 2))
      
      paymentRecord = new Payment({
        userId: user._id,
        registrationId: user.registration.registrationId,
        type: 'registration',  // Explicitly set type for registration payments
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        amount: calculationData.amount,
        breakdown: calculationData.breakdown,
        status: 'completed',
        paymentMethod: payment.method,
        transactionDate: new Date(payment.created_at * 1000),
        invoiceGenerated: true
      })

      await paymentRecord.save()
      console.log(`✅ Payment created: registration - ${paymentRecord._id}`)
      console.log('✅ Saved breakdown:', JSON.stringify(paymentRecord.breakdown, null, 2))
      
      // Update payment attempt tracking
      const existingAttempt = await paymentAttempts.findByRazorpayOrderId(razorpay_order_id)
      if (existingAttempt) {
        await paymentAttempts.markAttemptSuccess(
          existingAttempt.attemptId,
          razorpay_payment_id,
          razorpay_signature
        )
      }

      // Log audit trail for successful payment
      await logPaymentAction(
        { userId: user._id.toString(), email: user.email, role: 'user', name: `${user.profile.firstName} ${user.profile.lastName}` },
        'payment.completed',
        paymentRecord._id.toString(),
        user.registration.registrationId,
        { ip: request.headers.get('x-forwarded-for') || 'unknown', userAgent: request.headers.get('user-agent') || 'unknown' },
        { amount, currency, method: payment.method, paymentId: razorpay_payment_id }
      )
    }

    // Update workshop seats - only for workshop addons (registration workshops are booked at registration time)
    const Workshop = (await import('@/lib/models/Workshop')).default
    let workshopsBooked: string[] = []
    
    if (isWorkshopAddon && paymentRecord.workshopIds) {
      // For workshop addon: add workshops to user selections and book seats
      console.log('Processing workshop addon:', paymentRecord.workshopIds)
      
      // Add workshops to user's selections NOW (after payment confirmed)
      const currentSelections = user.registration.workshopSelections || []
      const newWorkshops = paymentRecord.workshopIds.filter((id: string) => !currentSelections.includes(id))
      user.registration.workshopSelections = [...currentSelections, ...newWorkshops]
      console.log(`✅ Added ${newWorkshops.length} workshops to user selections`)
      
      // Book seats for the NEW workshops only
      for (const workshopId of newWorkshops) {
        const workshop = await Workshop.findOne({ id: workshopId })
        if (workshop) {
          const seatsAvailable = workshop.maxSeats === 0 || workshop.bookedSeats < workshop.maxSeats
          if (seatsAvailable) {
            await Workshop.findByIdAndUpdate(
              workshop._id,
              { $inc: { bookedSeats: 1 } }
            )
            workshopsBooked.push(workshopId)
            console.log(`✅ Seat booked for workshop addon: ${workshop.name} (${workshop.bookedSeats + 1}/${workshop.maxSeats === 0 ? 'unlimited' : workshop.maxSeats})`)
          } else {
            console.warn(`⚠️ Workshop ${workshop.name} is full, cannot book seat`)
          }
        }
      }
    }
    // Note: For regular registration payments, seats are already booked at registration time
    // No need to book again here to avoid double-counting

    // Update user registration status
    user.registration.status = 'paid'
    user.registration.paymentDate = new Date()
    await user.save()

    // Send payment confirmation email asynchronously
    if (isWorkshopAddon && paymentRecord.workshops) {
      // Send workshop addon confirmation email
      (async () => {
        try {
          await EmailService.sendWorkshopAddonConfirmation({
            email: user.email,
            name: `${user.profile.firstName} ${user.profile.lastName}`,
            registrationId: user.registration.registrationId,
            amount: paymentRecord.amount.total,
            currency: paymentRecord.amount.currency,
            transactionId: razorpay_payment_id,
            paymentDate: new Date().toLocaleDateString('en-IN'),
            userId: user._id.toString(),
            paymentId: paymentRecord._id.toString(),
            workshops: paymentRecord.workshops
          })
          console.log('✅ Workshop addon confirmation email sent to:', user.email)
        } catch (emailError) {
          console.error('Failed to send workshop addon confirmation email:', emailError)
        }
      })()
    } else if (user.registration.paymentType !== 'complementary' && user.registration.paymentType !== 'sponsored') {
      // Send regular payment confirmation email using stored breakdown
      (async () => {
        try {
          // Use the breakdown already stored in the payment record
          await EmailService.sendPaymentConfirmation({
            userId: user._id.toString(),
            email: user.email,
            name: `${user.profile.firstName} ${user.profile.lastName}`,
            registrationId: user.registration.registrationId,
            amount: paymentRecord.amount.total,
            currency: paymentRecord.amount.currency,
            transactionId: razorpay_payment_id,
            paymentDate: new Date(paymentRecord.transactionDate).toLocaleDateString('en-IN'),
            breakdown: {
              ...paymentRecord.breakdown,
              registration: paymentRecord.amount.registration,
              gst: paymentRecord.amount.gst || 0,
              workshops: paymentRecord.amount.workshops,
              accompanyingPersons: paymentRecord.amount.accompanyingPersons,
              accommodation: paymentRecord.amount.accommodation || 0,
              discount: paymentRecord.amount.discount
            }
          })
          console.log('✅ Payment confirmation email sent to:', user.email)
        } catch (emailError) {
          console.error('Failed to send payment confirmation email:', emailError)
        }
      })()
    } else {
      console.log('Skipping email for complementary/sponsored user:', user.email)
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        paymentId: paymentRecord._id,
        registrationId: user.registration.registrationId,
        amount: amount,
        currency: currency,
        status: 'completed'
      }
    })

  } catch (error) {
    console.error('Payment verification error:', error)
    
    // Log the error
    await logPaymentError(
      error instanceof Error ? error.message : 'Payment verification failed',
      {
        stack: error instanceof Error ? error.stack : undefined
      }
    )
    
    return NextResponse.json({
      success: false,
      message: 'Payment verification failed'
    }, { status: 500 })
  }
}