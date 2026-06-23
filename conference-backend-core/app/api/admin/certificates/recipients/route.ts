import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'paid'
    const category = searchParams.get('category') || 'all'
    const hasCertificate = searchParams.get('hasCertificate') || 'no'

    let query: any = { role: 'user' }

    // Filter by payment status
    if (status !== 'all') {
      query['registration.status'] = status
    }

    // Filter by category
    if (category !== 'all') {
      query['registration.type'] = category
    }

    const users = await User.find(query)
      .select('email profile registration')
      .lean()

    const recipients = users.map((user: any) => ({
      _id: user._id?.toString(),
      email: user.email,
      name: `${user.profile?.title || ''} ${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim(),
      registrationId: user.registration?.registrationId,
      registrationType: user.registration?.type,
      status: user.registration?.status
    }))

    return NextResponse.json({
      success: true,
      data: recipients
    })
  } catch (error) {
    console.error('Get recipients error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch recipients'
    }, { status: 500 })
  }
}
