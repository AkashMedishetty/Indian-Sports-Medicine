import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import { logAction } from '@/conference-backend-core/lib/audit/service'

// Timeout in minutes for pending-payment registrations
const PENDING_PAYMENT_TIMEOUT_MINUTES = 30

export async function POST(request: NextRequest) {
  try {
    // This can be called by admin or by a cron job with API key
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    const apiKey = request.headers.get('x-api-key')
    
    const isAdmin = sessionUser?.role === 'admin'
    const isValidApiKey = apiKey === process.env.CRON_API_KEY
    
    if (!isAdmin && !isValidApiKey) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    // Calculate cutoff time (30 minutes ago)
    const cutoffTime = new Date()
    cutoffTime.setMinutes(cutoffTime.getMinutes() - PENDING_PAYMENT_TIMEOUT_MINUTES)

    // Find all pending-payment registrations older than timeout
    const expiredRegistrations = await User.find({
      'registration.status': 'pending-payment',
      'registration.registrationDate': { $lt: cutoffTime }
    })

    console.log(`Found ${expiredRegistrations.length} expired pending-payment registrations`)

    const results = {
      total: expiredRegistrations.length,
      cancelled: 0,
      errors: 0,
      details: [] as Array<{ email: string; registrationId: string; status: string }>
    }

    // Cancel each expired registration
    for (const user of expiredRegistrations) {
      try {
        await User.findByIdAndUpdate(user._id, {
          'registration.status': 'cancelled',
          'registration.cancellationReason': 'Payment timeout - registration expired after 30 minutes',
          'registration.cancelledAt': new Date()
        })

        // Log the cancellation
        await logAction({
          actor: {
            userId: sessionUser?.id || 'system',
            email: sessionUser?.email || 'system@issh.org',
            role: sessionUser?.role || 'system'
          },
          action: 'registration.cancelled',
          resourceType: 'user',
          resourceId: user._id.toString(),
          changes: {
            before: { status: 'pending-payment' },
            after: { status: 'cancelled', reason: 'Payment timeout' },
            fields: ['registration.status']
          },
          metadata: {
            ip: request.headers.get('x-forwarded-for') || 'system',
            userAgent: request.headers.get('user-agent') || 'system'
          },
          description: `Registration ${user.registration.registrationId} cancelled due to payment timeout`
        })

        results.cancelled++
        results.details.push({
          email: user.email,
          registrationId: user.registration.registrationId,
          status: 'cancelled'
        })
      } catch (error) {
        console.error(`Failed to cancel registration ${user.registration.registrationId}:`, error)
        results.errors++
        results.details.push({
          email: user.email,
          registrationId: user.registration.registrationId,
          status: 'error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.total} expired registrations`,
      results
    })
  } catch (error) {
    console.error('Error cleaning up pending registrations:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to cleanup pending registrations'
    }, { status: 500 })
  }
}

// GET endpoint to check pending registrations without cancelling
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const cutoffTime = new Date()
    cutoffTime.setMinutes(cutoffTime.getMinutes() - PENDING_PAYMENT_TIMEOUT_MINUTES)

    // Get counts
    const [expiredCount, pendingCount] = await Promise.all([
      User.countDocuments({
        'registration.status': 'pending-payment',
        'registration.registrationDate': { $lt: cutoffTime }
      }),
      User.countDocuments({
        'registration.status': 'pending-payment'
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalPending: pendingCount,
        expiredPending: expiredCount,
        timeoutMinutes: PENDING_PAYMENT_TIMEOUT_MINUTES
      }
    })
  } catch (error) {
    console.error('Error checking pending registrations:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to check pending registrations'
    }, { status: 500 })
  }
}
