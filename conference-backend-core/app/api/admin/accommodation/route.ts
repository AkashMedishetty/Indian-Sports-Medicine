import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const roomType = searchParams.get('roomType') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const query: any = {
      'registration.accommodation.required': true
    }

    if (roomType) {
      query['registration.accommodation.roomType'] = roomType
    }

    if (search) {
      query['$or'] = [
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'registration.registrationId': { $regex: search, $options: 'i' } },
      ]
    }

    const total = await User.countDocuments(query)
    const users = await User.find(query)
      .select('email profile.title profile.firstName profile.lastName profile.phone registration.registrationId registration.type registration.status registration.accommodation payment.status payment.amount')
      .sort({ 'registration.accommodation.checkIn': 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    // Calculate stats
    const allAccommodation = await User.find({ 'registration.accommodation.required': true })
      .select('registration.accommodation registration.status payment.status')
      .lean()

    const stats = {
      total: allAccommodation.length,
      single: allAccommodation.filter((u: any) => u.registration?.accommodation?.roomType === 'single').length,
      sharing: allAccommodation.filter((u: any) => u.registration?.accommodation?.roomType === 'sharing').length,
      totalRevenue: allAccommodation.reduce((sum: number, u: any) => sum + (u.registration?.accommodation?.totalAmount || 0), 0),
      confirmed: allAccommodation.filter((u: any) => u.payment?.status === 'verified' || u.registration?.status === 'paid').length,
    }

    return NextResponse.json({
      success: true,
      data: users,
      stats,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Accommodation fetch error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
