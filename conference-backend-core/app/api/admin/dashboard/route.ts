import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Payment from '@/lib/models/Payment'
import Abstract from '@/lib/models/Abstract'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is admin
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    const userId = (session.user as any).id
    const adminUser = await User.findById(userId)
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 })
    }

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get date 30 days ago for trends
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get all statistics in parallel for better performance
    const [
      totalRegistrations,
      paidRegistrations,
      confirmedRegistrations,
      pendingRegistrations,
      todayRegistrations,
      totalAbstracts,
      payments,
      todayPayments,
      users,
      recentUsers,
      abstracts
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', 'registration.status': 'paid' }),
      User.countDocuments({ role: 'user', 'registration.status': 'confirmed' }),
      User.countDocuments({ role: 'user', 'registration.status': 'pending' }),
      User.countDocuments({ 
        role: 'user',
        'registration.registrationDate': { $gte: today, $lt: tomorrow }
      }),
      Abstract.countDocuments({}),
      Payment.find({ status: 'completed' }).lean(),
      Payment.find({ 
        status: 'completed',
        createdAt: { $gte: today, $lt: tomorrow }
      }).lean(),
      User.find({ role: 'user' })
        .select('profile registration createdAt')
        .lean(),
      User.find({ role: 'user' })
        .select('profile registration email createdAt')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      Abstract.find({})
        .select('track status createdAt title userId')
        .populate('userId', 'profile email')
        .lean()
    ])

    // Calculate revenue
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount.total, 0)
    const todayRevenue = todayPayments.reduce((sum, payment) => sum + payment.amount.total, 0)
    const currency = payments.length > 0 ? payments[0].amount.currency : 'INR'

    // Registration breakdown by category (from conference config - NOT hardcoded!)
    const registrationsByCategory: Record<string, number> = {}
    
    // Initialize categories from config
    conferenceConfig.registration.categories.forEach(cat => {
      registrationsByCategory[cat.key] = 0
    })

    // Count registrations by category
    users.forEach(user => {
      const category = user.registration.type || conferenceConfig.registration.categories[0].key
      if (registrationsByCategory.hasOwnProperty(category)) {
        registrationsByCategory[category]++
      } else {
        registrationsByCategory[category] = 1
      }
    })

    // Daily registrations for the last 30 days
    const dailyRegistrations: Array<{ date: string; count: number }> = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      
      const count = users.filter(u => {
        const regDate = new Date(u.registration.registrationDate)
        return regDate >= date && regDate < nextDate
      }).length
      
      dailyRegistrations.push({
        date: date.toISOString().split('T')[0],
        count
      })
    }

    // Geographic distribution
    const stateDistribution: Record<string, number> = {}
    users.forEach(user => {
      const state = user.profile?.address?.state || 'Unknown'
      stateDistribution[state] = (stateDistribution[state] || 0) + 1
    })

    const topStates = Object.entries(stateDistribution)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Workshop statistics
    const workshopSelections: { [key: string]: number } = {}
    let totalWorkshopParticipants = 0

    users.forEach(user => {
      if (user.registration.workshopSelections && user.registration.workshopSelections.length > 0) {
        user.registration.workshopSelections.forEach((workshop: string) => {
          workshopSelections[workshop] = (workshopSelections[workshop] || 0) + 1
          totalWorkshopParticipants++
        })
      }
    })

    const popularWorkshops = Object.entries(workshopSelections)
      .map(([name, participants]) => ({ name, participants }))
      .sort((a, b) => b.participants - a.participants)
      .slice(0, 5)

    // Count accompanying persons
    const totalAccompanyingPersons = users.reduce((sum, user) => {
      return sum + (user.registration.accompanyingPersons?.length || 0)
    }, 0)

    // Abstract statistics by track (from conference config - NOT hardcoded!)
    const abstractsByTrack: Record<string, { submitted: number; accepted: number; total: number }> = {}
    
    // Initialize tracks from config
    conferenceConfig.abstracts.tracks.forEach(track => {
      if (track.enabled) {
        abstractsByTrack[track.key] = { submitted: 0, accepted: 0, total: 100 } // Default capacity
      }
    })

    // Count abstracts by track
    abstracts.forEach((abstract: any) => {
      const track = abstract.track || conferenceConfig.abstracts.tracks[0]?.key || 'oral-presentation'
      if (!abstractsByTrack[track]) {
        abstractsByTrack[track] = { submitted: 0, accepted: 0, total: 50 }
      }
      abstractsByTrack[track].submitted++
      if (abstract.status === 'accepted') {
        abstractsByTrack[track].accepted++
      }
    })

    // Recent activity feed (mix of registrations, payments, abstracts)
    const recentActivity: Array<{
      type: string
      timestamp: Date
      userId: string
      userName: string
      details: any
    }> = []

    // Add recent registrations
    recentUsers.slice(0, 5).forEach(user => {
      recentActivity.push({
        type: 'registration',
        timestamp: user.createdAt || new Date(),
        userId: String(user._id),
        userName: `${user.profile.title || ''} ${user.profile.firstName} ${user.profile.lastName}`.trim(),
        details: {
          registrationId: user.registration.registrationId,
          category: user.registration.type
        }
      })
    })

    // Add recent payments
    todayPayments.slice(0, 5).forEach(payment => {
      recentActivity.push({
        type: 'payment',
        timestamp: payment.createdAt || new Date(),
        userId: String(payment.userId),
        userName: 'User',
        details: {
          amount: payment.amount.total,
          transactionId: payment.razorpayPaymentId || payment.razorpayOrderId || 'N/A'
        }
      })
    })

    // Add recent abstracts
    abstracts.slice(0, 3).forEach((abstract: any) => {
      recentActivity.push({
        type: 'abstract',
        timestamp: abstract.createdAt || new Date(),
        userId: String(abstract.userId?._id || abstract.userId || ''),
        userName: abstract.userId && typeof abstract.userId === 'object' ? 
          `${abstract.userId.profile?.firstName || ''} ${abstract.userId.profile?.lastName || ''}`.trim() : 
          'User',
        details: {
          title: abstract.title,
          track: abstract.track || 'N/A'
        }
      })
    })

    // Sort by timestamp and take top 10
    recentActivity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    const limitedActivity = recentActivity.slice(0, 10)

    const dashboardStats = {
      // Core Stats
      totalRegistrations,
      paidRegistrations,
      confirmedRegistrations,
      pendingPayments: pendingRegistrations,
      totalRevenue,
      totalAbstracts,
      currency,
      accompanyingPersons: totalAccompanyingPersons,
      
      // Today's Stats
      todayStats: {
        registrations: todayRegistrations,
        payments: todayPayments.length,
        revenue: todayRevenue
      },
      
      // Registration Breakdown
      registrationsByCategory,
      
      // Daily Trend (30 days)
      dailyRegistrations,
      
      // Workshop Statistics
      workshopStats: {
        totalWorkshops: Object.keys(workshopSelections).length,
        totalParticipants: totalWorkshopParticipants,
        popularWorkshops
      },
      
      // Geographic Distribution
      geographicDistribution: {
        topStates
      },
      
      // Abstract Statistics
      abstractStats: {
        total: totalAbstracts,
        byTrack: abstractsByTrack
      },
      
      // Recent Activity Feed
      recentActivity: limitedActivity,
      
      // Payment By Method (from existing data)
      paymentsByMethod: {
        razorpay: payments.filter(p => p.razorpayPaymentId).length,
        bankTransfer: payments.filter(p => !p.razorpayPaymentId && p.status === 'completed').length
      }
    }

    // Return with no-cache headers to prevent stale data
    return NextResponse.json({
      success: true,
      data: dashboardStats
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}