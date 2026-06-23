import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Abstract from '@/lib/models/Abstract'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const hasAbstract = searchParams.get('hasAbstract')
    const daysFilter = searchParams.get('days')

    // Build query
    const query: any = { 'registration.status': 'pending-payment' }
    
    if (search) {
      // Escape special regex characters to prevent invalid regex patterns
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      query.$or = [
        { email: { $regex: escapedSearch, $options: 'i' } },
        { 'profile.firstName': { $regex: escapedSearch, $options: 'i' } },
        { 'profile.lastName': { $regex: escapedSearch, $options: 'i' } },
        { 'registration.registrationId': { $regex: escapedSearch, $options: 'i' } }
      ]
    }

    // Get pending users
    const pendingUsers = await User.find(query)
      .select('email profile registration createdAt')
      .sort({ createdAt: -1 })

    // Get abstracts for these users
    const userIds = pendingUsers.map(u => u._id)
    const abstracts = await Abstract.find({ userId: { $in: userIds } })
      .select('userId title status')

    const abstractsByUser = abstracts.reduce((acc: any, abs) => {
      const key = abs.userId.toString()
      if (!acc[key]) acc[key] = []
      acc[key].push(abs)
      return acc
    }, {})

    // Calculate days pending and format response
    const now = new Date()
    let users = pendingUsers.map(u => {
      const createdAt = new Date(u.createdAt)
      const daysPending = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
      const userAbstracts = abstractsByUser[u._id.toString()] || []
      
      return {
        _id: u._id,
        email: u.email,
        name: `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim(),
        phone: u.profile?.phone,
        institution: u.profile?.institution,
        registrationId: u.registration?.registrationId,
        registrationType: u.registration?.type,
        daysPending,
        hasAbstract: userAbstracts.length > 0,
        abstractCount: userAbstracts.length,
        abstracts: userAbstracts.map((a: any) => ({ title: a.title, status: a.status })),
        createdAt: u.createdAt
      }
    })

    // Apply filters
    if (hasAbstract === 'yes') {
      users = users.filter(u => u.hasAbstract)
    } else if (hasAbstract === 'no') {
      users = users.filter(u => !u.hasAbstract)
    }

    if (daysFilter) {
      const days = parseInt(daysFilter)
      users = users.filter(u => u.daysPending >= days)
    }

    // Calculate stats
    const stats = {
      total: users.length,
      withAbstracts: users.filter(u => u.hasAbstract).length,
      withoutAbstracts: users.filter(u => !u.hasAbstract).length,
      pending7Days: users.filter(u => u.daysPending >= 7).length,
      pending14Days: users.filter(u => u.daysPending >= 14).length,
      avgDaysPending: users.length > 0 
        ? Math.round(users.reduce((sum, u) => sum + u.daysPending, 0) / users.length) 
        : 0
    }

    return NextResponse.json({ success: true, users, stats })
  } catch (error) {
    console.error('Error fetching pending users:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch pending users' }, { status: 500 })
  }
}
