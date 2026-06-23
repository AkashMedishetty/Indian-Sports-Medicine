import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Razorpay from 'razorpay'
import paymentAttempts from '@/conference-backend-core/lib/payment/attempts'
import { logPaymentError } from '@/conference-backend-core/lib/errors/service'
import { logPaymentAction } from '@/conference-backend-core/lib/audit/service'

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

// Helper to extract device info from request
function getDeviceInfo(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || ''
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  // Basic browser/OS detection
  let browser = 'unknown'
  let os = 'unknown'
  
  if (userAgent.includes('Chrome')) browser = 'Chrome'
  else if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Safari')) browser = 'Safari'
  else if (userAgent.includes('Edge')) browser = 'Edge'
  
  if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac')) os = 'macOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) os = 'iOS'
  
  return { ip, browser, os, userAgent }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      amount, 
      currency = 'INR', 
      discountCode,
      userId, // For registration flow (no session)
      registrationId, // For registration flow (no session)
      email, // For registration flow (no session)
      name // For registration flow (no session)
    } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Invalid amount'
      }, { status: 400 })
    }

    await connectDB()

    // Check if this is an authenticated request (logged-in user)
    const session = await getServerSession(authOptions)
    
    let orderNotes: any = {}
    let receiptId = ''

    const sessionUser = session?.user as any
    if (sessionUser?.id) {
      // AUTHENTICATED FLOW - User is logged in
      const user = await User.findById(sessionUser.id)
      if (!user) {
        return NextResponse.json({
          success: false,
          message: 'User not found'
        }, { status: 404 })
      }

      receiptId = user.registration.registrationId
      orderNotes = {
        registrationId: user.registration.registrationId,
        userId: user._id.toString(),
        email: user.email,
        name: `${user.profile.firstName} ${user.profile.lastName}`,
        discountCode: discountCode || '',
        registrationType: user.registration.type
      }
    } else if (userId && registrationId) {
      // PUBLIC FLOW - Registration/Guest payment (no session required)
      // Verify the user exists in database
      const user = await User.findById(userId)
      if (!user) {
        return NextResponse.json({
          success: false,
          message: 'Invalid user ID'
        }, { status: 400 })
      }

      receiptId = registrationId
      orderNotes = {
        registrationId,
        userId,
        email: email || user.email,
        name: name || `${user.profile.firstName} ${user.profile.lastName}`,
        discountCode: discountCode || '',
        registrationType: user.registration.type
      }
    } else if (registrationId && email && name) {
      // PRE-PAYMENT FLOW - Order created before user registration (payment gateway)
      // No user exists yet, will be created after successful payment
      receiptId = registrationId
      orderNotes = {
        registrationId,
        email,
        name,
        discountCode: discountCode || '',
        pendingRegistration: true // Flag to indicate user not yet created
      }
    } else {
      // Neither session nor userId provided
      return NextResponse.json({
        success: false,
        message: 'Authentication required or user details must be provided'
      }, { status: 401 })
    }

    // Convert amount to smallest currency unit (paise for INR, cents for USD)
    const amountInSmallestUnit = Math.round(amount * 100)

    // Initialize Razorpay fresh for this request
    const razorpay = getRazorpayInstance()
    
    // Check if Razorpay is initialized
    if (!razorpay) {
      return NextResponse.json({
        success: false,
        message: 'Payment gateway not configured'
      }, { status: 500 })
    }

    // Create Razorpay order
    const orderOptions = {
      amount: amountInSmallestUnit,
      currency: currency,
      receipt: `receipt_${receiptId}_${Date.now()}`,
      notes: orderNotes
    }

    const order = await razorpay.orders.create(orderOptions)

    // Record payment attempt with tracking
    const device = getDeviceInfo(request)
    const trackingUserId = orderNotes.userId
    const trackingUserEmail = orderNotes.email
    
    if (trackingUserId) {
      const attemptResult = await paymentAttempts.recordAttempt({
        userId: trackingUserId,
        userEmail: trackingUserEmail,
        registrationId: receiptId,
        amount: amount,
        currency,
        method: 'razorpay',
        device,
        razorpay: {
          orderId: order.id
        }
      })

      if (attemptResult.success) {
        // Log audit trail
        await logPaymentAction(
          { userId: trackingUserId, email: trackingUserEmail, role: 'user', name: orderNotes.name },
          'payment.initiated',
          attemptResult.attemptId!,
          receiptId,
          { ip: device.ip, userAgent: device.userAgent },
          { amount, currency, method: 'razorpay', orderId: order.id }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      }
    })

  } catch (error: any) {
    console.error('Order creation error:', error)
    
    // Log the error
    const device = getDeviceInfo(request)
    await logPaymentError(
      error instanceof Error ? error.message : 'Failed to create payment order',
      {
        device,
        stack: error instanceof Error ? error.stack : undefined
      }
    )
    
    return NextResponse.json({
      success: false,
      message: error?.error?.description || error?.message || 'Failed to create payment order',
      debug: {
        statusCode: error?.statusCode,
        errorCode: error?.error?.code,
        errorDescription: error?.error?.description
      }
    }, { status: 500 })
  }
}