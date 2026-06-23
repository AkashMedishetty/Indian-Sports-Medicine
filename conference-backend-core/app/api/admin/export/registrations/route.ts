import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    const adminUser = await User.findById((session.user as any).id)
    if (!adminUser || !['admin', 'manager'].includes(adminUser.role)) {
      return NextResponse.json({
        success: false,
        message: 'Admin or Manager access required'
      }, { status: 403 })
    }

    // Get filter params
    const { searchParams } = new URL(request.url)
    const sponsorId = searchParams.get('sponsorId')
    const paymentType = searchParams.get('paymentType')
    const status = searchParams.get('status')
    const specialization = searchParams.get('specialization')
    const registrationType = searchParams.get('registrationType') || searchParams.get('type')

    // Build query
    const query: any = { role: 'user' }
    if (sponsorId) {
      query['registration.sponsorId'] = sponsorId
    }
    if (paymentType) {
      query['registration.paymentType'] = paymentType
    }
    if (status) {
      query['registration.status'] = status
    }
    if (specialization && specialization !== 'all') {
      query['profile.specialization'] = specialization
    }
    if (registrationType && registrationType !== 'all') {
      query['registration.type'] = registrationType
    }

    // Fetch user registrations including payment info
    const users = await User.find(query)
      .select('email profile registration payment createdAt')
      .lean()

    // Generate CSV content
    const csvHeaders = [
      'Registration ID',
      'Title',
      'First Name',
      'Last Name',
      'Full Name',
      'Email',
      'Phone',
      'Age',
      'Institution',
      'MCI Number',
      'Designation',
      'Specialization',
      'Registration Type',
      'Status',
      'Tier',
      'Payment Method',
      'Payment Status',
      'Payment Amount',
      'UTR Number',
      'Transaction ID',
      'Payment Date',
      'Verified By',
      'Verification Date',
      'Payment Remarks',
      'Payment Type',
      'Source',
      'Sponsor Name',
      'Sponsor Category',
      'Workshop Selections',
      'Accompanying Persons Count',
      'Accompanying Names',
      'Registration Date',
      'Confirmed Date',
      'Accommodation Required',
      'Accommodation Room Type',
      'Accommodation Check-in',
      'Accommodation Check-out',
      'Accommodation Nights',
      'Accommodation Amount',
      'Street Address',
      'City',
      'State',
      'Country',
      'Pincode',
      'HOD Form',
      'Dietary Requirements',
      'Special Needs'
    ]

    const csvRows = users.map(user => [
      user.registration.registrationId,
      user.profile.title || '',
      user.profile.firstName || '',
      user.profile.lastName || '',
      `${user.profile.title || ''} ${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim(),
      user.email,
      user.profile.phone || '',
      user.profile.age || '',
      user.profile.institution || '',
      user.profile.mciNumber || '',
      user.profile.designation || '',
      user.profile.specialization || '',
      user.registration.type,
      user.registration.status,
      user.registration.tier || '',
      user.payment?.method || '',
      user.payment?.status || '',
      user.payment?.amount || 0,
      user.payment?.bankTransferUTR || '',
      user.payment?.transactionId || '',
      user.payment?.paymentDate ? new Date(user.payment.paymentDate).toLocaleDateString() : '',
      user.payment?.verifiedBy || '',
      user.payment?.verificationDate ? new Date(user.payment.verificationDate).toLocaleDateString() : '',
      user.payment?.remarks || '',
      user.registration.paymentType || '',
      user.registration.source || 'normal',
      user.registration.sponsorName || '',
      user.registration.sponsorCategory || '',
      user.registration.workshopSelections?.join('; ') || '',
      user.registration.accompanyingPersons?.length || 0,
      (user.registration.accompanyingPersons || []).map((p: any) => `${p.name}${p.relationship ? ' (' + p.relationship + ')' : ''}${p.age ? ' - Age: ' + p.age : ''}`).join('; '),
      user.registration.registrationDate ? new Date(user.registration.registrationDate).toLocaleDateString() : '',
      user.registration.confirmedDate ? new Date(user.registration.confirmedDate).toLocaleDateString() : '',
      user.registration.accommodation?.required ? 'Yes' : 'No',
      user.registration.accommodation?.roomType || '',
      user.registration.accommodation?.checkIn || '',
      user.registration.accommodation?.checkOut || '',
      user.registration.accommodation?.nights || 0,
      user.registration.accommodation?.totalAmount || 0,
      user.profile.address?.street || '',
      user.profile.address?.city || '',
      user.profile.address?.state || '',
      user.profile.address?.country || '',
      user.profile.address?.pincode || '',
      user.profile.hodFormUrl || '',
      user.profile.dietaryRequirements || '',
      user.profile.specialNeeds || ''
    ])

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => 
        row.map(field => 
          typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))
            ? `"${field.replace(/"/g, '""')}"` // Escape quotes and wrap in quotes
            : field
        ).join(',')
      )
    ].join('\n')

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="registrations-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Registration export error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}