import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import Payment from "@/lib/models/Payment"
import { generateRegistrationId } from "@/lib/utils/generateId"
import { EmailService } from "@/lib/email/service"
import bcrypt from "bcryptjs"
import { logAction } from "@/conference-backend-core/lib/audit/service"

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    
    // Filters
    const status = searchParams.get('status')
    const paymentType = searchParams.get('paymentType')
    const registrationType = searchParams.get('registrationType') || searchParams.get('type')
    const sponsorId = searchParams.get('sponsorId')
    const specialization = searchParams.get('specialization')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')
    
    console.log('📋 Admin Registrations API - Filters:', {
      status, paymentType, registrationType, sponsorId, specialization, search
    })
    
    // Sorting
    const sortField = searchParams.get('sortField') || 'registration.registrationDate'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1

    // Build query - only show regular users, not sponsors/reviewers/admins
    const query: any = {
      'registration.registrationId': { $exists: true },
      role: 'user'
    }
    
    if (status && status !== 'all') {
      query['registration.status'] = status
    }
    if (paymentType && paymentType !== 'all') {
      query['registration.paymentType'] = paymentType
    }
    if (registrationType && registrationType !== 'all') {
      query['registration.type'] = registrationType
    }
    if (sponsorId) {
      query['registration.sponsorId'] = sponsorId
    }
    if (specialization && specialization !== 'all') {
      query['profile.specialization'] = specialization
    }
    
    console.log('📋 Admin Registrations API - Final Query:', JSON.stringify(query, null, 2))
    if (startDate) {
      query['registration.registrationDate'] = { ...query['registration.registrationDate'], $gte: new Date(startDate) }
    }
    if (endDate) {
      query['registration.registrationDate'] = { ...query['registration.registrationDate'], $lte: new Date(endDate) }
    }
    if (search) {
      // Escape special regex characters to prevent invalid regex patterns
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      query.$or = [
        { email: { $regex: escapedSearch, $options: 'i' } },
        { 'profile.firstName': { $regex: escapedSearch, $options: 'i' } },
        { 'profile.lastName': { $regex: escapedSearch, $options: 'i' } },
        { 'registration.registrationId': { $regex: escapedSearch, $options: 'i' } },
        { 'profile.phone': { $regex: escapedSearch, $options: 'i' } },
        { 'profile.institution': { $regex: escapedSearch, $options: 'i' } }
      ]
    }

    // Get total count for pagination
    const total = await User.countDocuments(query)
    
    // Get paginated users
    const users = await User.find(query)
      .select('-password -activeSessions')
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)

    // Get payment information for each user
    const usersWithPayments = await Promise.all(
      users.map(async (user) => {
        const userObj = user.toObject()

        // Prefer embedded user.payment (bank-transfer flow); fallback to Payment collection
        let paymentInfo = null as null | {
          amount: number
          currency: string
          transactionId?: string
          paymentDate?: Date
          status?: string
          breakdown?: any
        }

        if (userObj.payment && typeof userObj.payment.amount === 'number') {
          let displayAmount = userObj.payment.amount
          const accom = userObj.registration?.accommodation
          if (accom?.required && accom.totalAmount > 0) {
            const accomWithGst = Math.round(accom.totalAmount * 1.18)
            // Detect if accommodation is already included in payment.amount:
            // If subtracting accommodation leaves a non-negative value, it's included.
            // If it goes negative, the stored amount is just the reg fee — add accommodation.
            if (displayAmount - accomWithGst < 0) {
              displayAmount += accomWithGst
            }
          }

          paymentInfo = {
            amount: displayAmount,
            currency: 'INR',
            transactionId: userObj.payment.bankTransferUTR || userObj.payment.transactionId,
            paymentDate: userObj.payment.paymentDate,
            status: userObj.payment.status,
          }
        } else {
          const payment = await Payment.findOne({ userId: user._id }).sort({ createdAt: -1 })
          if (payment) {
            paymentInfo = {
              amount: payment.amount.total,
              currency: payment.amount.currency,
              transactionId: payment.razorpayPaymentId,
              paymentDate: payment.transactionDate,
              status: payment.status,
              breakdown: payment.breakdown
            }
          }
        }

        return {
          ...userObj,
          paymentInfo
        }
      })
    )

    // Calculate stats - only for regular users
    const stats = await User.aggregate([
      { $match: { 'registration.registrationId': { $exists: true }, role: 'user' } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          paid: { $sum: { $cond: [{ $eq: ['$registration.status', 'paid'] }, 1, 0] } },
          confirmed: { $sum: { $cond: [{ $eq: ['$registration.status', 'confirmed'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$registration.status', 'pending'] }, 1, 0] } },
          pendingPayment: { $sum: { $cond: [{ $eq: ['$registration.status', 'pending-payment'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$registration.status', 'cancelled'] }, 1, 0] } },
          sponsored: { $sum: { $cond: [{ $eq: ['$registration.paymentType', 'sponsored'] }, 1, 0] } },
          complimentary: { $sum: { $cond: [{ $eq: ['$registration.paymentType', 'complimentary'] }, 1, 0] } },
          workshopRegistrations: { $sum: { $size: { $ifNull: ['$registration.workshopSelections', []] } } },
          accompanyingPersons: { $sum: { $size: { $ifNull: ['$registration.accompanyingPersons', []] } } }
        }
      }
    ])

    // Combine pending and pending-payment for the pendingPayment stat
    const statsResult = stats[0] || { total: 0, paid: 0, confirmed: 0, pending: 0, pendingPayment: 0, cancelled: 0, sponsored: 0, complimentary: 0, workshopRegistrations: 0, accompanyingPersons: 0 }
    statsResult.pendingPayment = (statsResult.pending || 0) + (statsResult.pendingPayment || 0)

    return NextResponse.json({
      success: true,
      data: usersWithPayments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: statsResult
    })

  } catch (error) {
    console.error("Get registrations error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()

    // Check if user already exists
    const existingUser = await User.findOne({ email: body.email?.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Generate registration ID using proper format
    let registrationId = await generateRegistrationId()
    
    // Ensure registration ID is unique
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 10) {
      const existingReg = await User.findOne({ 
        'registration.registrationId': registrationId 
      })
      if (!existingReg) {
        isUnique = true
      } else {
        registrationId = await generateRegistrationId()
        attempts++
      }
    }

    if (!isUnique) {
      return NextResponse.json({
        success: false,
        message: 'Failed to generate unique registration ID'
      }, { status: 500 })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(body.password, 12)

    const userData = {
      ...body,
      email: body.email.toLowerCase(),
      password: hashedPassword,
      registration: {
        ...body.registration,
        registrationId,
        registrationDate: new Date().toISOString(),
        accompanyingPersons: body.registration?.accompanyingPersons || [],
        workshopSelections: body.registration?.workshopSelections || []
      },
      role: 'user'
    }

    // Create new user
    const user = await User.create(userData)

    // Log the action
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || ''
    
    await logAction({
      actor: {
        userId: (session.user as any).id,
        email: session.user.email || '',
        role: userRole,
        name: session.user.name || ''
      },
      action: 'registration.created_by_admin',
      resourceType: 'registration',
      resourceId: registrationId,
      resourceName: `${user.profile.firstName} ${user.profile.lastName}`,
      metadata: { ip, userAgent },
      changes: {
        before: {},
        after: {
          registrationId,
          email: user.email,
          type: user.registration.type,
          paymentType: user.registration.paymentType,
          status: user.registration.status
        }
      },
      description: `Admin created registration for ${user.email} (${registrationId})`
    })
    
    // Send registration confirmation email with credentials
    try {
      // Get registration type label from conference config
      const { conferenceConfig } = await import('@/conference-backend-core/config/conference.config')
      const registrationCategory = conferenceConfig.registration.categories.find(
        (cat: any) => cat.key === user.registration.type
      )
      const registrationTypeLabel = registrationCategory?.label || user.registration.type
      
      await EmailService.sendRegistrationConfirmation({
        userId: user._id.toString(),
        email: user.email,
        name: `${user.profile.firstName} ${user.profile.lastName}`,
        registrationId: user.registration.registrationId,
        registrationType: user.registration.type,
        registrationTypeLabel: registrationTypeLabel,
        workshopSelections: user.registration.workshopSelections || [],
        accompanyingPersons: user.registration.accompanyingPersons?.length || 0
      })
    } catch (emailError) {
      console.error('Failed to send registration email:', emailError)
      // Don't fail the registration if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Registration created successfully",
      data: {
        ...user.toObject(),
        password: undefined // Don't return password
      }
    })

  } catch (error) {
    console.error("Create registration error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}