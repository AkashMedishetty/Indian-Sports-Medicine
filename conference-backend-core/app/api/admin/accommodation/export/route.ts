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

    const users = await User.find({ 'registration.accommodation.required': true })
      .select('email profile registration.registrationId registration.type registration.status registration.accommodation payment.status payment.amount')
      .sort({ 'registration.accommodation.checkIn': 1 })
      .lean()

    // Build CSV
    const headers = [
      'Registration ID', 'Name', 'Email', 'Phone', 'Institution',
      'Registration Type', 'Registration Status', 'Payment Status',
      'Room Type', 'Check-in', 'Check-out', 'Nights', 'Amount (₹)'
    ]

    const rows = users.map((u: any) => [
      u.registration?.registrationId || '',
      `${u.profile?.title || ''} ${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim(),
      u.email || '',
      u.profile?.phone || '',
      u.profile?.institution || '',
      u.registration?.type || '',
      u.registration?.status || '',
      u.payment?.status || 'pending',
      u.registration?.accommodation?.roomType || '',
      u.registration?.accommodation?.checkIn || '',
      u.registration?.accommodation?.checkOut || '',
      u.registration?.accommodation?.nights || 0,
      u.registration?.accommodation?.totalAmount || 0,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="accommodation-bookings-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Accommodation export error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
