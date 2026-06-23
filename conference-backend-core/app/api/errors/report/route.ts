import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { logError, logFormError, logPaymentError } from '@/conference-backend-core/lib/errors/service'

/**
 * POST /api/errors/report
 * Report frontend errors to the error logging system
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const {
      message,
      stack,
      severity = 'error',
      category = 'system',
      url,
      // Form-specific
      formName,
      fieldName,
      invalidValue,
      validationErrors,
      // Payment-specific
      orderId,
      paymentMethod,
      amount,
      razorpayError,
      // Additional context
      additionalInfo
    } = body

    // Get user context from session if available
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any

    // Extract device info from request
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

    const device = { ip, browser, os, userAgent }

    let result

    // Route to appropriate logging function based on category
    if (category === 'form_validation' && formName) {
      result = await logFormError(message, {
        userId: sessionUser?.id,
        userEmail: sessionUser?.email,
        formName,
        fieldName,
        invalidValue,
        validationErrors,
        device
      })
    } else if (category === 'payment' && orderId) {
      result = await logPaymentError(message, {
        userId: sessionUser?.id,
        userEmail: sessionUser?.email,
        orderId,
        paymentMethod,
        amount,
        razorpayError,
        device,
        stack
      })
    } else {
      result = await logError({
        message,
        stack,
        severity,
        category,
        source: 'frontend',
        url,
        userId: sessionUser?.id,
        userEmail: sessionUser?.email,
        metadata: { additionalInfo },
        device
      })
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        errorId: result.errorId,
        isNewError: result.isNewError
      })
    } else {
      return NextResponse.json({
        success: false,
        message: result.error || 'Failed to log error'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error reporting endpoint failed:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to report error'
    }, { status: 500 })
  }
}
