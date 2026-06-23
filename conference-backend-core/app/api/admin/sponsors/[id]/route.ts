import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import { logSponsorAction } from '@/conference-backend-core/lib/audit/service'

// GET - Get single sponsor details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const sponsor = await User.findOne({ _id: id, role: 'sponsor' }).select('-password')
    
    if (!sponsor) {
      return NextResponse.json({ success: false, message: 'Sponsor not found' }, { status: 404 })
    }

    // Get delegates registered by this sponsor
    const delegates = await User.find({ 'registration.sponsorId': id })
      .select('email profile.firstName profile.lastName registration.registrationId registration.status createdAt')
      .sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      sponsor: {
        _id: sponsor._id,
        email: sponsor.email,
        companyName: sponsor.sponsorProfile?.companyName,
        contactPerson: sponsor.sponsorProfile?.contactPerson,
        category: sponsor.sponsorProfile?.category,
        allocation: sponsor.sponsorProfile?.allocation,
        status: sponsor.sponsorProfile?.status,
        mustChangePassword: sponsor.sponsorProfile?.mustChangePassword,
        lastActivity: sponsor.sponsorProfile?.lastActivity,
        phone: sponsor.sponsorProfile?.phone,
        address: sponsor.sponsorProfile?.address,
        createdAt: sponsor.createdAt
      },
      delegates: delegates.map(d => ({
        _id: d._id,
        email: d.email,
        name: `${d.profile?.firstName || ''} ${d.profile?.lastName || ''}`.trim(),
        registrationId: d.registration?.registrationId,
        status: d.registration?.status,
        createdAt: d.createdAt
      }))
    })
  } catch (error) {
    console.error('Error fetching sponsor:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch sponsor' }, { status: 500 })
  }
}


// PUT - Update sponsor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const sponsor = await User.findOne({ _id: id, role: 'sponsor' })
    if (!sponsor) {
      return NextResponse.json({ success: false, message: 'Sponsor not found' }, { status: 404 })
    }

    const body = await request.json()
    const { companyName, contactPerson, category, allocation, status, phone, address } = body

    // Validate allocation change - cannot reduce below used
    if (allocation !== undefined && allocation < (sponsor.sponsorProfile?.allocation?.used || 0)) {
      return NextResponse.json({
        success: false,
        message: `Cannot reduce allocation below used amount (${sponsor.sponsorProfile?.allocation?.used})`
      }, { status: 400 })
    }

    // Track changes for audit
    const before = {
      companyName: sponsor.sponsorProfile?.companyName,
      contactPerson: sponsor.sponsorProfile?.contactPerson,
      category: sponsor.sponsorProfile?.category,
      allocation: sponsor.sponsorProfile?.allocation?.total,
      status: sponsor.sponsorProfile?.status
    }

    // Update fields
    if (companyName) sponsor.sponsorProfile!.companyName = companyName
    if (contactPerson) sponsor.sponsorProfile!.contactPerson = contactPerson
    if (category) sponsor.sponsorProfile!.category = category
    if (allocation !== undefined) sponsor.sponsorProfile!.allocation!.total = allocation
    if (status) sponsor.sponsorProfile!.status = status
    if (phone !== undefined) sponsor.sponsorProfile!.phone = phone
    if (address !== undefined) sponsor.sponsorProfile!.address = address

    await sponsor.save()

    const after = {
      companyName: sponsor.sponsorProfile?.companyName,
      contactPerson: sponsor.sponsorProfile?.contactPerson,
      category: sponsor.sponsorProfile?.category,
      allocation: sponsor.sponsorProfile?.allocation?.total,
      status: sponsor.sponsorProfile?.status
    }

    // Log the action
    await logSponsorAction(
      { userId: sessionUser.id, email: sessionUser.email, role: 'admin' },
      'sponsor.updated',
      sponsor._id.toString(),
      sponsor.sponsorProfile?.companyName || '',
      { ip: request.headers.get('x-forwarded-for') || 'unknown', userAgent: request.headers.get('user-agent') || '' },
      { before, after, fields: Object.keys(body) }
    )

    return NextResponse.json({
      success: true,
      message: 'Sponsor updated successfully',
      sponsor: {
        _id: sponsor._id,
        email: sponsor.email,
        companyName: sponsor.sponsorProfile?.companyName,
        contactPerson: sponsor.sponsorProfile?.contactPerson,
        category: sponsor.sponsorProfile?.category,
        allocation: sponsor.sponsorProfile?.allocation,
        status: sponsor.sponsorProfile?.status
      }
    })
  } catch (error) {
    console.error('Error updating sponsor:', error)
    return NextResponse.json({ success: false, message: 'Failed to update sponsor' }, { status: 500 })
  }
}

// DELETE - Deactivate sponsor (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const sponsor = await User.findOne({ _id: id, role: 'sponsor' })
    if (!sponsor) {
      return NextResponse.json({ success: false, message: 'Sponsor not found' }, { status: 404 })
    }

    // Soft delete - just deactivate
    sponsor.sponsorProfile!.status = 'inactive'
    sponsor.isActive = false
    await sponsor.save()

    // Log the action
    await logSponsorAction(
      { userId: sessionUser.id, email: sessionUser.email, role: 'admin' },
      'sponsor.deactivated',
      sponsor._id.toString(),
      sponsor.sponsorProfile?.companyName || '',
      { ip: request.headers.get('x-forwarded-for') || 'unknown', userAgent: request.headers.get('user-agent') || '' }
    )

    return NextResponse.json({
      success: true,
      message: 'Sponsor deactivated successfully'
    })
  } catch (error) {
    console.error('Error deactivating sponsor:', error)
    return NextResponse.json({ success: false, message: 'Failed to deactivate sponsor' }, { status: 500 })
  }
}
