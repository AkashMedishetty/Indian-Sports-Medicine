import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Payment from '@/lib/models/Payment'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    const adminUser = await User.findById((session.user as any).id)
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 })
    }

    // Get query parameters for date filtering
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build date filter
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.$gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate)
    }

    const registrationFilter: any = {
      'registration.registrationId': { $exists: true }
    }
    if (Object.keys(dateFilter).length > 0) {
      registrationFilter['registration.registrationDate'] = dateFilter
    }

    // Fetch all registrations (users with registration data)
    const users = await User.find(registrationFilter).select('-password -activeSessions')

    // Get payment information for each user
    const allRegistrations = await Promise.all(
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
          paymentInfo = {
            amount: userObj.payment.amount,
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

    // === OVERVIEW STATISTICS ===
    const totalRegistrations = allRegistrations.length
    const confirmedRegistrations = allRegistrations.filter(r => r.registration.status === 'confirmed').length
    const pendingRegistrations = allRegistrations.filter(r => r.registration.status === 'pending').length
    const cancelledRegistrations = allRegistrations.filter(r => r.registration.status === 'cancelled').length

    // Revenue calculation
    const totalRevenue = allRegistrations
      .filter(r => r.paymentInfo?.status === 'verified' || r.registration.status === 'confirmed')
      .reduce((sum, r) => sum + (r.paymentInfo?.amount || 0), 0)

    const paidRegistrations = allRegistrations.filter(r => 
      r.paymentInfo?.status === 'verified' || r.registration.status === 'confirmed'
    ).length

    const unpaidRegistrations = totalRegistrations - paidRegistrations

    // === REGISTRATION TYPE BREAKDOWN ===
    const typeBreakdown = allRegistrations.reduce((acc: any, reg) => {
      const type = reg.registration.type || 'other'
      if (!acc[type]) {
        acc[type] = { count: 0, revenue: 0 }
      }
      acc[type].count++
      if (reg.paymentInfo?.status === 'verified' || reg.registration.status === 'confirmed') {
        acc[type].revenue += reg.paymentInfo?.amount || 0
      }
      return acc
    }, {})

    // === REGISTRATION STATUS BREAKDOWN ===
    const statusBreakdown = {
      confirmed: confirmedRegistrations,
      pending: pendingRegistrations,
      cancelled: cancelledRegistrations
    }

    // === DAILY REGISTRATIONS (Last 30 days or filtered range) ===
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const dailyRegistrations = allRegistrations
      .filter(r => new Date(r.registration.registrationDate) >= thirtyDaysAgo)
      .reduce((acc: any, reg) => {
        const date = new Date(reg.registration.registrationDate).toISOString().split('T')[0]
        if (!acc[date]) {
          acc[date] = { count: 0, revenue: 0 }
        }
        acc[date].count++
        if (reg.paymentInfo?.status === 'verified' || reg.registration.status === 'confirmed') {
          acc[date].revenue += reg.paymentInfo?.amount || 0
        }
        return acc
      }, {})

    // Convert to array and sort by date
    const dailyData = Object.entries(dailyRegistrations)
      .map(([date, data]: [string, any]) => ({
        date,
        count: data.count,
        revenue: data.revenue
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // === WORKSHOP STATISTICS ===
    const workshopStats = allRegistrations.reduce((acc: any, reg) => {
      (reg.registration.workshopSelections || []).forEach((workshop: string) => {
        if (!acc[workshop]) {
          acc[workshop] = 0
        }
        acc[workshop]++
      })
      return acc
    }, {})

    // === ACCOMPANYING PERSONS ===
    const totalAccompanyingPersons = allRegistrations.reduce((sum, reg) => 
      sum + (reg.registration.accompanyingPersons?.length || 0), 0
    )

    // === PAYMENT METHOD BREAKDOWN ===
    const paymentMethodBreakdown = allRegistrations
      .filter(r => r.registration.paymentType)
      .reduce((acc: any, reg) => {
        const method = reg.registration.paymentType || 'regular'
        if (!acc[method]) {
          acc[method] = { count: 0, revenue: 0 }
        }
        acc[method].count++
        if (reg.paymentInfo?.status === 'verified' || reg.registration.status === 'confirmed') {
          acc[method].revenue += reg.paymentInfo?.amount || 0
        }
        return acc
      }, {})

    // === GEOGRAPHICAL DISTRIBUTION ===
    const geographicalDistribution = allRegistrations.reduce((acc: any, reg) => {
      const state = reg.profile?.address?.state || 'Unknown'
      const country = reg.profile?.address?.country || 'Unknown'
      
      if (!acc[country]) {
        acc[country] = { count: 0, states: {} }
      }
      acc[country].count++
      
      if (!acc[country].states[state]) {
        acc[country].states[state] = 0
      }
      acc[country].states[state]++
      
      return acc
    }, {})

    // === INSTITUTION STATISTICS ===
    const institutionStats = allRegistrations.reduce((acc: any, reg) => {
      const institution = reg.profile?.institution || 'Unknown'
      if (!acc[institution]) {
        acc[institution] = 0
      }
      acc[institution]++
      return acc
    }, {})

    // Top 10 institutions
    const topInstitutions = Object.entries(institutionStats)
      .map(([name, count]) => ({ name, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10)

    // === MONTHLY TRENDS ===
    const monthlyData = allRegistrations.reduce((acc: any, reg) => {
      const date = new Date(reg.registration.registrationDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!acc[monthKey]) {
        acc[monthKey] = { count: 0, revenue: 0 }
      }
      acc[monthKey].count++
      if (reg.paymentInfo?.status === 'verified' || reg.registration.status === 'confirmed') {
        acc[monthKey].revenue += reg.paymentInfo?.amount || 0
      }
      return acc
    }, {})

    const monthlyTrends = Object.entries(monthlyData)
      .map(([month, data]: [string, any]) => ({
        month,
        count: data.count,
        revenue: data.revenue
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // === CONVERSION RATE ===
    const conversionRate = totalRegistrations > 0 
      ? ((paidRegistrations / totalRegistrations) * 100).toFixed(2)
      : '0'

    // === AVERAGE TRANSACTION VALUE ===
    const averageTransactionValue = paidRegistrations > 0
      ? (totalRevenue / paidRegistrations).toFixed(2)
      : '0'

    // === CITY-WISE DISTRIBUTION ===
    const cityDistribution = allRegistrations.reduce((acc: any, reg) => {
      const city = reg.profile?.address?.city || 'Unknown'
      const state = reg.profile?.address?.state || 'Unknown'
      const key = `${city}, ${state}`
      
      if (!acc[key]) {
        acc[key] = { count: 0, revenue: 0, city, state }
      }
      acc[key].count++
      if (reg.paymentInfo?.status === 'verified' || reg.registration.status === 'confirmed') {
        acc[key].revenue += reg.paymentInfo?.amount || 0
      }
      return acc
    }, {})

    const topCities = Object.entries(cityDistribution)
      .map(([key, data]: [string, any]) => ({
        city: data.city,
        state: data.state,
        count: data.count,
        revenue: data.revenue
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)

    // === STATE-WISE DISTRIBUTION ===
    const stateDistribution = allRegistrations.reduce((acc: any, reg) => {
      const state = reg.profile?.address?.state || 'Unknown'
      
      if (!acc[state]) {
        acc[state] = { count: 0, revenue: 0, cities: new Set() }
      }
      acc[state].count++
      acc[state].cities.add(reg.profile?.address?.city || 'Unknown')
      if (reg.paymentInfo?.status === 'verified' || reg.registration.status === 'confirmed') {
        acc[state].revenue += reg.paymentInfo?.amount || 0
      }
      return acc
    }, {})

    const topStates = Object.entries(stateDistribution)
      .map(([state, data]: [string, any]) => ({
        state,
        count: data.count,
        revenue: data.revenue,
        citiesCount: data.cities.size
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // === DESIGNATION BREAKDOWN ===
    const designationBreakdown = allRegistrations.reduce((acc: any, reg) => {
      const designation = reg.profile?.designation || 'Unknown'
      if (!acc[designation]) {
        acc[designation] = { count: 0, revenue: 0 }
      }
      acc[designation].count++
      if (reg.paymentInfo?.status === 'verified' || reg.registration.status === 'confirmed') {
        acc[designation].revenue += reg.paymentInfo?.amount || 0
      }
      return acc
    }, {})

    // === TITLE DISTRIBUTION ===
    const titleDistribution = allRegistrations.reduce((acc: any, reg) => {
      const title = reg.profile?.title || 'Unknown'
      if (!acc[title]) {
        acc[title] = 0
      }
      acc[title]++
      return acc
    }, {})

    // === DIETARY REQUIREMENTS ===
    const dietaryRequirements = allRegistrations.reduce((acc: any, reg) => {
      const dietary = reg.profile?.dietaryRequirements || 'None specified'
      if (!acc[dietary]) {
        acc[dietary] = 0
      }
      acc[dietary]++
      
      // Count accompanying persons dietary requirements
      reg.registration.accompanyingPersons?.forEach((person: any) => {
        const personDietary = person.dietaryRequirements || 'None specified'
        if (!acc[personDietary]) {
          acc[personDietary] = 0
        }
        acc[personDietary]++
      })
      
      return acc
    }, {})

    // === REGISTRATION TIME ANALYSIS ===
    const hourlyDistribution = allRegistrations.reduce((acc: any, reg) => {
      const hour = new Date(reg.registration.registrationDate).getHours()
      if (!acc[hour]) {
        acc[hour] = 0
      }
      acc[hour]++
      return acc
    }, {})

    // === DAY OF WEEK ANALYSIS ===
    const dayOfWeekDistribution = allRegistrations.reduce((acc: any, reg) => {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const day = dayNames[new Date(reg.registration.registrationDate).getDay()]
      if (!acc[day]) {
        acc[day] = 0
      }
      acc[day]++
      return acc
    }, {})

    // === PAYMENT METHOD ANALYSIS ===
    const paymentMethodStats = allRegistrations.reduce((acc: any, reg) => {
      const method = reg.payment?.method || 'Not specified'
      if (!acc[method]) {
        acc[method] = { count: 0, revenue: 0, avgProcessingTime: 0 }
      }
      acc[method].count++
      if (reg.paymentInfo?.status === 'verified' || reg.registration.status === 'confirmed') {
        acc[method].revenue += reg.paymentInfo?.amount || 0
      }
      return acc
    }, {})

    // === SPECIAL NEEDS COUNT ===
    const specialNeedsCount = allRegistrations.filter(reg => 
      reg.profile?.specialNeeds && reg.profile.specialNeeds.trim() !== ''
    ).length

    // === MEMBERSHIP ANALYSIS ===
    const membershipStats = allRegistrations.reduce((acc: any, reg) => {
      const hasMembership = reg.registration.membershipNumber ? 'Member' : 'Non-Member'
      if (!acc[hasMembership]) {
        acc[hasMembership] = 0
      }
      acc[hasMembership]++
      return acc
    }, {})

    // === AGE DISTRIBUTION (from accompanying persons) ===
    const ageRanges = {
      '0-12': 0,
      '13-18': 0,
      '19-30': 0,
      '31-50': 0,
      '51-70': 0,
      '70+': 0
    }
    allRegistrations.forEach(reg => {
      reg.registration.accompanyingPersons?.forEach((person: any) => {
        const age = person.age
        if (age <= 12) ageRanges['0-12']++
        else if (age <= 18) ageRanges['13-18']++
        else if (age <= 30) ageRanges['19-30']++
        else if (age <= 50) ageRanges['31-50']++
        else if (age <= 70) ageRanges['51-70']++
        else ageRanges['70+']++
      })
    })

    // === REVENUE BY DAY (Last 30 days) ===
    const revenueByDay = allRegistrations
      .filter(r => {
        const regDate = new Date(r.registration.registrationDate)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return regDate >= thirtyDaysAgo
      })
      .reduce((acc: any, reg) => {
        const date = new Date(reg.registration.registrationDate).toISOString().split('T')[0]
        if (!acc[date]) {
          acc[date] = 0
        }
        if (reg.paymentInfo?.status === 'verified' || reg.registration.status === 'confirmed') {
          acc[date] += reg.paymentInfo?.amount || 0
        }
        return acc
      }, {})

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalRegistrations,
          confirmedRegistrations,
          pendingRegistrations,
          cancelledRegistrations,
          totalRevenue,
          paidRegistrations,
          unpaidRegistrations,
          totalAccompanyingPersons,
          conversionRate: parseFloat(conversionRate),
          averageTransactionValue: parseFloat(averageTransactionValue),
          specialNeedsCount
        },
        typeBreakdown,
        statusBreakdown,
        dailyRegistrations: dailyData,
        monthlyTrends,
        workshopStats,
        paymentMethodBreakdown,
        geographicalDistribution,
        topInstitutions,
        topCities,
        topStates,
        designationBreakdown,
        titleDistribution,
        dietaryRequirements,
        hourlyDistribution,
        dayOfWeekDistribution,
        paymentMethodStats,
        membershipStats,
        accompanyingPersonsAgeDistribution: ageRanges,
        revenueByDay,
        dateRange: {
          start: startDate || 'all-time',
          end: endDate || 'present'
        }
      }
    })

  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
